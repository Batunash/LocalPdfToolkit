import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tauriAdapter } from './tauriAdapter';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  get open() { return (globalThis as any).mockDialogOpen; },
  get save() { return (globalThis as any).mockDialogSave; },
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: vi.fn(),
}));

// We need to mock the environment to test both Tauri and Mock modes.
// tauriAdapter uses `window.__TAURI_INTERNALS__` or `window.__TAURI__` to detect Tauri.

describe('tauriAdapter', () => {
  beforeEach(() => {
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
    (globalThis as any).mockDialogOpen = vi.fn();
    (globalThis as any).mockDialogSave = vi.fn();
    (tauriAdapter as any)._resetCache();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
  });

  describe('isTauri()', () => {
    it('should return false when window.__TAURI__ is undefined', () => {
      expect(tauriAdapter.isTauri()).toBe(false);
    });

    it('should return true when window.__TAURI_INTERNALS__ is defined', () => {
      (window as any).__TAURI_INTERNALS__ = {};
      expect(tauriAdapter.isTauri()).toBe(true);
    });

    it('should return true when window.__TAURI__ is defined', () => {
      (window as any).__TAURI__ = {};
      expect(tauriAdapter.isTauri()).toBe(true);
    });
  });

  describe('selectFile() (Mock Mode)', () => {
    it('should return a single mock path when multiple is false', async () => {
      const result = await tauriAdapter.selectFile(['pdf'], false);
      expect(result).toBe('C:\\Users\\MockUser\\Documents\\document_presentation.pdf');
    });

    it('should return an array of mock paths when multiple is true', async () => {
      const result = await tauriAdapter.selectFile(['pdf'], true);
      expect(result).toEqual([
        'C:\\Users\\MockUser\\Documents\\sample_report.pdf',
        'C:\\Users\\MockUser\\Documents\\appendix_draft.pdf'
      ]);
    });
  });

  describe('selectFolder() (Mock Mode)', () => {
    it('should return a mock folder path', async () => {
      const result = await tauriAdapter.selectFolder();
      expect(result).toBe('C:\\Users\\MockUser\\Downloads\\LocalPDF_Output');
    });
  });

  describe('getSavePath() (Mock Mode)', () => {
    it('should return a mock save path appended with defaultName', async () => {
      const result = await tauriAdapter.getSavePath('test_output.pdf');
      expect(result).toBe('C:\\Users\\MockUser\\Documents\\test_output.pdf');
    });
  });

  describe('appVersion() (Mock Mode)', () => {
    it('should return mock version', async () => {
      const result = await tauriAdapter.appVersion();
      expect(result).toBe('1.0.0-mock-web');
    });
  });

  describe('getTempDir() (Mock Mode)', () => {
    it('should return mock temp directory', async () => {
      const result = await tauriAdapter.getTempDir();
      expect(result).toBe('C:\\Users\\MockUser\\AppData\\Local\\Temp\\localpdf_toolkit');
    });
  });

  describe('cleanTemp() (Mock Mode)', () => {
    it('should return mock cleaned file count', async () => {
      const result = await tauriAdapter.cleanTemp();
      expect(result).toBe(14);
    });
  });

  describe('readFile() (Mock Mode)', () => {
    it('should return empty Uint8Array', async () => {
      const result = await tauriAdapter.readFile('dummy.pdf');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });
  });

  describe('merge() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.merge(['f1.pdf', 'f2.pdf'], 'out.pdf');
      expect(result).toBe('out.pdf');
    });
  });

  describe('split() (Mock Mode)', () => {
    it('should return mock output paths', async () => {
      const result = await tauriAdapter.split('in.pdf', 'C:\\out', 'by_every');
      expect(result).toEqual([
        'C:\\out\\split_part_1.pdf',
        'C:\\out\\split_part_2.pdf'
      ]);
    });
  });

  describe('removePages() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.removePages('in.pdf', 'out.pdf', '1,2');
      expect(result).toBe('out.pdf');
    });
  });

  describe('extractPages() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.extractPages('in.pdf', 'out.pdf', '1,2');
      expect(result).toBe('out.pdf');
    });
  });

  describe('organize() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.organize('in.pdf', 'out.pdf', [2,1]);
      expect(result).toBe('out.pdf');
    });
  });

  describe('compress() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      console.log('__TAURI_INTERNALS__:', (window as any).__TAURI_INTERNALS__);
      console.log('__TAURI__:', (window as any).__TAURI__);
      console.log('isTauri:', tauriAdapter.isTauri());
      const result = await tauriAdapter.compress('in.pdf', 'out.pdf', 'high');
      expect(result).toBe('out.pdf');
    });
  });

  describe('rotate() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.rotate('in.pdf', 'out.pdf', [1], 90);
      expect(result).toBe('out.pdf');
    });
  });

  describe('protect() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.protect('in.pdf', 'out.pdf', 'pass');
      expect(result).toBe('out.pdf');
    });
  });

  describe('unlock() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.unlock('in.pdf', 'out.pdf', 'pass');
      expect(result).toBe('out.pdf');
    });
  });

  describe('watermark() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.watermark('in.pdf', 'out.pdf', 'Watermark', 'center', 0.5);
      expect(result).toBe('out.pdf');
    });
  });

  describe('pageNumbers() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.pageNumbers('in.pdf', 'out.pdf', 'bottom_center', 'Page {n}');
      expect(result).toBe('out.pdf');
    });
  });

  describe('crop() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.crop('in.pdf', 'out.pdf', 0, 0, 100, 100, 'percentage');
      expect(result).toBe('out.pdf');
    });
  });

  describe('ocr() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.ocr('in.pdf', 'out.pdf', 'eng');
      expect(result).toBe('out.pdf');
    });
  });

  describe('repair() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.repair('in.pdf', 'out.pdf');
      expect(result).toBe('out.pdf');
    });
  });

  describe('convert() (Mock Mode)', () => {
    it('should return outputPath', async () => {
      const result = await tauriAdapter.convert('in.pdf', 'out.pdf', 'docx');
      expect(result).toBe('out.pdf');
    });
  });

  describe('getPdfInfo() (Mock Mode)', () => {
    it('should return mock metadata with filename as title', async () => {
      const result = await tauriAdapter.getPdfInfo('C:\\test\\my_document.pdf');
      expect(result.title).toBe('my_document.pdf');
      expect(result.pages).toBe(12);
      expect(result.isEncrypted).toBe(false);
    });
  });

  describe('getThumbnails() (Mock Mode)', () => {
    it('should return mock SVG images', async () => {
      const result = await tauriAdapter.getThumbnails('in.pdf', [1, 2]);
      expect(result.length).toBe(2);
      expect(result[0]).toContain('data:image/svg+xml');
      expect(result[0]).toContain('Page 1');
    });
  });

  describe('Tauri Mode', () => {
    beforeEach(() => {
      (window as any).__TAURI__ = {};
    });

    it('selectFile() should call dialog.open', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      (open as any).mockResolvedValue('C:\\real.pdf');
      const result = await tauriAdapter.selectFile(['pdf'], false);
      expect(open).toHaveBeenCalledWith({ multiple: false, filters: [{ name: 'Files', extensions: ['pdf'] }] });
      expect(result).toBe('C:\\real.pdf');
    });

    it('selectFile() should throw error if open is missing', async () => {
      (globalThis as any).mockDialogOpen = undefined;
      await expect(tauriAdapter.selectFile(['pdf'], false)).rejects.toThrow('Tauri Dialog plugin is not loaded');
    });

    it('selectFolder() should call dialog.open', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      (open as any).mockResolvedValue('C:\\real_folder');
      const result = await tauriAdapter.selectFolder();
      expect(open).toHaveBeenCalledWith({ directory: true, multiple: false });
      expect(result).toBe('C:\\real_folder');
    });

    it('selectFolder() should throw error if open is missing', async () => {
      (globalThis as any).mockDialogOpen = undefined;
      await expect(tauriAdapter.selectFolder()).rejects.toThrow('Tauri Dialog plugin is not loaded');
    });

    it('getSavePath() should call dialog.save', async () => {
      const { save } = await import('@tauri-apps/plugin-dialog');
      (save as any).mockResolvedValue('C:\\saved.pdf');
      const result = await tauriAdapter.getSavePath('def.pdf');
      expect(save).toHaveBeenCalledWith({ defaultPath: 'def.pdf', filters: [{ name: 'Files', extensions: ['pdf'] }] });
      expect(result).toBe('C:\\saved.pdf');
    });

    it('getSavePath() should throw error if save is missing', async () => {
      (globalThis as any).mockDialogSave = undefined;
      await expect(tauriAdapter.getSavePath('def.pdf')).rejects.toThrow('Tauri Dialog plugin is not loaded');
    });

    it('appVersion() should call invoke app_version', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('2.0.0');
      const result = await tauriAdapter.appVersion();
      expect(invoke).toHaveBeenCalledWith('app_version');
      expect(result).toBe('2.0.0');
    });

    it('getTempDir() should call invoke get_temp_dir', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('C:\\temp');
      const result = await tauriAdapter.getTempDir();
      expect(invoke).toHaveBeenCalledWith('get_temp_dir');
      expect(result).toBe('C:\\temp');
    });

    it('cleanTemp() should call invoke clean_temp', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(5);
      const result = await tauriAdapter.cleanTemp();
      expect(invoke).toHaveBeenCalledWith('clean_temp');
      expect(result).toBe(5);
    });

    it('readFile() should call fs.readFile', async () => {
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const arr = new Uint8Array([1, 2, 3]);
      (readFile as any).mockResolvedValue(arr);
      const result = await tauriAdapter.readFile('real.pdf');
      expect(readFile).toHaveBeenCalledWith('real.pdf');
      expect(result).toBe(arr);
    });

    it('merge() should call invoke pdf_merge', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.merge(['1.pdf'], 'out.pdf', true);
      expect(invoke).toHaveBeenCalledWith('pdf_merge', { inputFiles: ['1.pdf'], outputPath: 'out.pdf', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('split() should call invoke pdf_split', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(['p1.pdf']);
      const result = await tauriAdapter.split('in.pdf', 'out', 'by_every', undefined, 2, false);
      expect(invoke).toHaveBeenCalledWith('pdf_split', { inputFile: 'in.pdf', outputDir: 'out', mode: 'by_every', ranges: null, nPages: 2, overwrite: false });
      expect(result).toEqual(['p1.pdf']);
    });

    it('removePages() should call invoke pdf_remove_pages', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.removePages('in.pdf', 'out.pdf', '1');
      expect(invoke).toHaveBeenCalledWith('pdf_remove_pages', { inputFile: 'in.pdf', outputPath: 'out.pdf', pageRanges: '1', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('extractPages() should call invoke pdf_extract_pages', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.extractPages('in.pdf', 'out.pdf', '1');
      expect(invoke).toHaveBeenCalledWith('pdf_extract_pages', { inputFile: 'in.pdf', outputPath: 'out.pdf', pageRanges: '1', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('organize() should call invoke pdf_organize', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.organize('in.pdf', 'out.pdf', [1], {1: 90});
      expect(invoke).toHaveBeenCalledWith('pdf_organize', { inputFile: 'in.pdf', outputPath: 'out.pdf', pageOrder: [1], pageRotations: {1: 90}, overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('compress() should call invoke pdf_compress', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.compress('in.pdf', 'out.pdf', 'low');
      expect(invoke).toHaveBeenCalledWith('pdf_compress', { inputFile: 'in.pdf', outputPath: 'out.pdf', level: 'low', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('rotate() should call invoke pdf_rotate', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.rotate('in.pdf', 'out.pdf', [1], 180);
      expect(invoke).toHaveBeenCalledWith('pdf_rotate', { inputFile: 'in.pdf', outputPath: 'out.pdf', pages: [1], angle: 180, overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('protect() should call invoke pdf_protect', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.protect('in.pdf', 'out.pdf', 'pass', 'owner', true, false, false, false, true);
      expect(invoke).toHaveBeenCalledWith('pdf_protect', { inputFile: 'in.pdf', outputPath: 'out.pdf', userPassword: 'pass', ownerPassword: 'owner', allowPrint: true, allowModify: false, allowCopy: false, allowAnnotate: false, overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('unlock() should call invoke pdf_unlock', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.unlock('in.pdf', 'out.pdf', 'pass', true);
      expect(invoke).toHaveBeenCalledWith('pdf_unlock', { inputFile: 'in.pdf', outputPath: 'out.pdf', password: 'pass', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('watermark() should call invoke pdf_watermark', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.watermark('in.pdf', 'out.pdf', 'txt', 'center', 0.5, 45, 12, 'red');
      expect(invoke).toHaveBeenCalledWith('pdf_watermark', { inputFile: 'in.pdf', outputPath: 'out.pdf', text: 'txt', position: 'center', opacity: 0.5, angle: 45, fontSize: 12, color: 'red', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('pageNumbers() should call invoke pdf_page_numbers', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.pageNumbers('in.pdf', 'out.pdf', 'top_left', '{n}', 1, 12);
      expect(invoke).toHaveBeenCalledWith('pdf_page_numbers', { inputFile: 'in.pdf', outputPath: 'out.pdf', position: 'top_left', format: '{n}', startNumber: 1, fontSize: 12, overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('crop() should call invoke pdf_crop', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.crop('in.pdf', 'out.pdf', 1, 2, 3, 4, 'points');
      expect(invoke).toHaveBeenCalledWith('pdf_crop', { inputFile: 'in.pdf', outputPath: 'out.pdf', left: 1, top: 2, right: 3, bottom: 4, unit: 'points', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('ocr() should call invoke pdf_ocr', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.ocr('in.pdf', 'out.pdf', 'tur', 300);
      expect(invoke).toHaveBeenCalledWith('pdf_ocr', { inputFile: 'in.pdf', outputPath: 'out.pdf', language: 'tur', dpi: 300, overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('repair() should call invoke pdf_repair', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.pdf');
      const result = await tauriAdapter.repair('in.pdf', 'out.pdf');
      expect(invoke).toHaveBeenCalledWith('pdf_repair', { inputFile: 'in.pdf', outputPath: 'out.pdf', overwrite: true });
      expect(result).toBe('out.pdf');
    });

    it('convert() should call invoke convert_any', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('out.docx');
      const result = await tauriAdapter.convert('in.pdf', 'out.docx', 'docx', 300, 90);
      expect(invoke).toHaveBeenCalledWith('convert_any', { inputFile: 'in.pdf', outputPath: 'out.docx', targetFormat: 'docx', dpi: 300, quality: 90, overwrite: true });
      expect(result).toBe('out.docx');
    });

    it('getPdfInfo() should call invoke pdf_info', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue({ title: 't', author: 'a', creator: 'c', producer: 'p', page_count: 5, is_encrypted: true, size_bytes: 100 });
      const result = await tauriAdapter.getPdfInfo('in.pdf');
      expect(invoke).toHaveBeenCalledWith('pdf_info', { inputFile: 'in.pdf' });
      expect(result).toEqual({ title: 't', author: 'a', creator: 'c', producer: 'p', pages: 5, isEncrypted: true, sizeBytes: 100 });
    });

    it('getThumbnails() should call invoke pdf_thumbnail', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(['t1', 't2']);
      const result = await tauriAdapter.getThumbnails('in.pdf', [1, 2], 100, true);
      expect(invoke).toHaveBeenCalledWith('pdf_thumbnail', { inputFile: 'in.pdf', pages: [1, 2], dpi: 100, overwrite: true });
      expect(result).toEqual(['t1', 't2']);
    });
  });
});
