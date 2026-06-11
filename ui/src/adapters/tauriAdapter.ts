// Tauri Adapter Layer for external service calls
// Ensures the UI layer has zero business logic or direct external invocations

const checkIsTauri = () => typeof window !== 'undefined' && (
  (window as any).__TAURI_INTERNALS__ !== undefined ||
  (window as any).__TAURI__ !== undefined
);

let cachedInvoke: any = null;
async function getInvoke() {
  if (!checkIsTauri()) return null;
  if (!cachedInvoke) {
    const { invoke } = await import('@tauri-apps/api/core');
    cachedInvoke = invoke;
  }
  return cachedInvoke;
}

let cachedOpen: any = null;
async function getOpenDialog() {
  if (!checkIsTauri()) return null;
  if (!cachedOpen) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    cachedOpen = open;
  }
  return cachedOpen;
}

let cachedSave: any = null;
async function getSaveDialog() {
  if (!checkIsTauri()) return null;
  if (!cachedSave) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    cachedSave = save;
  }
  return cachedSave;
}

// Helper to delay executions to simulate backend lag in mock mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  pages: number;
  isEncrypted: boolean;
  sizeBytes: number;
}

export const tauriAdapter = {
  isTauri: () => checkIsTauri(),

  // Dialog helpers
  selectFile: async (extensions: string[] = ['pdf'], multiple: boolean = false): Promise<string | string[] | null> => {
    if (checkIsTauri()) {
      const openFn = await getOpenDialog();
      if (openFn) {
        return await openFn({
          multiple,
          filters: [{ name: 'Files', extensions }]
        });
      }
      throw new Error('Tauri Dialog plugin is not loaded');
    } else {
      await delay(400);
      if (multiple) {
        return [
          'C:\\Users\\MockUser\\Documents\\sample_report.pdf',
          'C:\\Users\\MockUser\\Documents\\appendix_draft.pdf'
        ];
      }
      return 'C:\\Users\\MockUser\\Documents\\document_presentation.pdf';
    }
  },

  selectFolder: async (): Promise<string | null> => {
    if (checkIsTauri()) {
      const openFn = await getOpenDialog();
      if (openFn) {
        return await openFn({
          directory: true,
          multiple: false
        }) as string | null;
      }
      throw new Error('Tauri Dialog plugin is not loaded');
    } else {
      await delay(400);
      return 'C:\\Users\\MockUser\\Downloads\\LocalPDF_Output';
    }
  },

  getSavePath: async (defaultName: string, extensions: string[] = ['pdf']): Promise<string | null> => {
    if (checkIsTauri()) {
      const saveFn = await getSaveDialog();
      if (saveFn) {
        return await saveFn({
          defaultPath: defaultName,
          filters: [{ name: 'Files', extensions }]
        });
      }
      throw new Error('Tauri Dialog plugin is not loaded');
    } else {
      await delay(400);
      return `C:\\Users\\MockUser\\Documents\\${defaultName}`;
    }
  },

  // App version
  appVersion: async (): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('app_version');
    }
    return '1.0.0-mock-web';
  },

  // Temp folder management
  getTempDir: async (): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('get_temp_dir');
    }
    return 'C:\\Users\\MockUser\\AppData\\Local\\Temp\\localpdf_toolkit';
  },

  cleanTemp: async (): Promise<number> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('clean_temp');
    }
    await delay(600);
    return 14;
  },

  readFile: async (filePath: string): Promise<Uint8Array> => {
    if (checkIsTauri()) {
      const { readFile } = await import('@tauri-apps/plugin-fs');
      return await readFile(filePath);
    }
    // Return empty array for mock
    return new Uint8Array();
  },

  // PDF tools
  merge: async (inputFiles: string[], outputPath: string, overwrite: boolean = true): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_merge', { inputFiles, outputPath, overwrite });
    }
    await delay(2000);
    return outputPath;
  },

  split: async (
    inputFile: string,
    outputDir: string,
    mode: 'by_ranges' | 'by_every' | 'by_size',
    ranges?: string,
    nPages?: number,
    overwrite: boolean = true
  ): Promise<string[]> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) {
        return await invokeFn('pdf_split', {
          inputFile,
          outputDir,
          mode,
          ranges: ranges || null,
          nPages: nPages || null,
          overwrite
        });
      }
    }
    await delay(2000);
    return [
      `${outputDir}\\split_part_1.pdf`,
      `${outputDir}\\split_part_2.pdf`
    ];
  },

  removePages: async (inputFile: string, outputPath: string, pageRanges: string, overwrite: boolean = true): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_remove_pages', { inputFile, outputPath, pageRanges, overwrite });
    }
    await delay(1500);
    return outputPath;
  },

  extractPages: async (inputFile: string, outputPath: string, pageRanges: string, overwrite: boolean = true): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_extract_pages', { inputFile, outputPath, pageRanges, overwrite });
    }
    await delay(1500);
    return outputPath;
  },

  organize: async (
    inputFile: string,
    outputPath: string,
    pageOrder?: number[],
    pageRotations?: Record<number, number>,
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_organize', { inputFile, outputPath, pageOrder, pageRotations, overwrite });
    }
    await delay(1800);
    return outputPath;
  },

  compress: async (
    inputFile: string,
    outputPath: string,
    level: 'maximum' | 'high' | 'balanced' | 'low',
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_compress', { inputFile, outputPath, level, overwrite });
    }
    await delay(2500);
    return outputPath;
  },

  rotate: async (
    inputFile: string,
    outputPath: string,
    pages: number[] | null,
    angle: 90 | 180 | 270,
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_rotate', { inputFile, outputPath, pages, angle, overwrite });
    }
    await delay(1200);
    return outputPath;
  },

  protect: async (
    inputFile: string,
    outputPath: string,
    password: string,
    ownerPassword?: string,
    allowPrint: boolean = true,
    allowModify: boolean = false,
    allowCopy: boolean = false,
    allowAnnotate: boolean = false,
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) {
        return await invokeFn('pdf_protect', {
          inputFile,
          outputPath,
          userPassword: password,
          ownerPassword: ownerPassword || null,
          allowPrint,
          allowModify,
          allowCopy,
          allowAnnotate,
          overwrite
        });
      }
    }
    await delay(1500);
    return outputPath;
  },

  unlock: async (
    inputFile: string,
    outputPath: string,
    password: string,
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) {
        return await invokeFn('pdf_unlock', {
          inputFile,
          outputPath,
          password,
          overwrite
        });
      }
    }
    await delay(1505);
    return outputPath;
  },

  watermark: async (
    inputFile: string,
    outputPath: string,
    text: string,
    position: 'center' | 'diagonal' | 'custom',
    opacity: number,
    angle?: number,
    fontSize?: number,
    color?: string,
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) {
        return await invokeFn('pdf_watermark', {
          inputFile,
          outputPath,
          text,
          position,
          opacity,
          angle: angle || null,
          fontSize: fontSize || null,
          color: color || null,
          overwrite
        });
      }
    }
    await delay(1800);
    return outputPath;
  },

  pageNumbers: async (
    inputFile: string,
    outputPath: string,
    position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'bottom_center',
    format: string,
    startNumber?: number,
    fontSize?: number,
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) {
        return await invokeFn('pdf_page_numbers', {
          inputFile,
          outputPath,
          position,
          format,
          startNumber: startNumber || null,
          fontSize: fontSize || null,
          overwrite
        });
      }
    }
    await delay(1500);
    return outputPath;
  },

  crop: async (
    inputFile: string,
    outputPath: string,
    left: number,
    top: number,
    right: number,
    bottom: number,
    unit: 'percentage' | 'points',
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_crop', { inputFile, outputPath, left, top, right, bottom, unit, overwrite });
    }
    await delay(1500);
    return outputPath;
  },

  ocr: async (inputFile: string, outputPath: string, language: string, dpi?: number, overwrite: boolean = true): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_ocr', { inputFile, outputPath, language, dpi: dpi || null, overwrite });
    }
    await delay(3000);
    return outputPath;
  },

  repair: async (inputFile: string, outputPath: string, overwrite: boolean = true): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_repair', { inputFile, outputPath, overwrite });
    }
    await delay(2000);
    return outputPath;
  },

  convert: async (
    inputFile: string,
    outputPath: string,
    targetFormat: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'jpg' | 'png' | 'html',
    dpi?: number,
    quality?: number,
    overwrite: boolean = true
  ): Promise<string> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) {
        return await invokeFn('convert_any', {
          inputFile,
          outputPath,
          targetFormat,
          dpi: dpi || null,
          quality: quality || null,
          overwrite
        });
      }
    }
    await delay(2500);
    return outputPath;
  },

  getPdfInfo: async (inputFile: string): Promise<PdfMetadata> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) {
        const info: any = await invokeFn('pdf_info', { inputFile });
        return {
          title: info.title || undefined,
          author: info.author || undefined,
          creator: info.creator || undefined,
          producer: info.producer || undefined,
          pages: info.page_count || info.pages || 0,
          isEncrypted: info.is_encrypted || false,
          sizeBytes: info.size_bytes || 0
        };
      }
    }
    await delay(400);
    const filename = inputFile.split(/[\\/]/).pop() || 'document.pdf';
    return {
      title: filename.replace('.pdf', ''),
      author: 'Antigravity AI',
      creator: 'LocalPdfToolkit',
      producer: 'Google DeepMind',
      pages: 12,
      isEncrypted: false,
      sizeBytes: 1024 * 1024 * 3.4
    };
  },

  getThumbnails: async (inputFile: string, pages: number[], dpi?: number, overwrite: boolean = true): Promise<string[]> => {
    if (checkIsTauri()) {
      const invokeFn = await getInvoke();
      if (invokeFn) return await invokeFn('pdf_thumbnail', { inputFile, pages, dpi, overwrite });
    }
    await delay(300);
    return pages.map(page => {
      const hue = (page * 45) % 360;
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" fill="hsl(${hue}, 40%, 20%)"/><text x="100" y="140" fill="white" font-size="24" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">Page ${page}</text></svg>`;
    });
  }
};
