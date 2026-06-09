import { invoke } from '@tauri-apps/api/core';

export interface JobOutput {
  output_path: string;
  file_size: number;
  processing_time_ms: number;
  page_count?: number;
  metadata: Record<string, string>;
}

export interface MergeOpts {
  input_files: string[];
  output_path: string;
  overwrite: boolean;
}

export interface SplitOpts {
  input_file: string;
  output_dir: string;
  mode: 'by_ranges' | 'by_every' | 'by_size';
  ranges?: string;
  n_pages?: number;
  overwrite: boolean;
}

export interface RotateOpts {
  input_file: string;
  output_path: string;
  pages?: number[];
  rotation: 90 | 180 | 270;
  overwrite: boolean;
}

export interface CompressOpts {
  input_file: string;
  output_path: string;
  level: 'maximum' | 'high' | 'balanced' | 'low';
  overwrite: boolean;
}

export interface WatermarkOpts {
  input_file: string;
  output_path: string;
  watermark_type: 'text' | 'image';
  text?: string;
  image_path?: string;
  position: 'center' | 'diagonal' | 'custom';
  opacity: number;
  font_size?: number;
  font_color?: string;
  overwrite: boolean;
}

// Tauri command wrappers
export async function pdfMerge(input_files: string[], output_path: string, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_merge', { inputFiles: input_files, outputPath: output_path, overwrite });
}

export async function pdfSplit(input_file: string, output_dir: string, mode: string, ranges?: string, n_pages?: number, overwrite?: boolean): Promise<string[]> {
  return await invoke<string[]>('pdf_split', { inputFile: input_file, outputDir: output_dir, mode, ranges, nPages: n_pages, overwrite });
}

export async function pdfRemovePages(input_file: string, output_path: string, page_ranges: string, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_remove_pages', { inputFile: input_file, outputPath: output_path, pageRanges: page_ranges, overwrite });
}

export async function pdfExtractPages(input_file: string, output_path: string, page_ranges: string, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_extract_pages', { inputFile: input_file, outputPath: output_path, pageRanges: page_ranges, overwrite });
}

export async function pdfOrganize(input_file: string, output_path: string, page_order?: number[], page_rotations?: Record<number, number>, overwrite?: boolean): Promise<string> {
  return await invoke<string>('pdf_organize', { inputFile: input_file, outputPath: output_path, pageOrder: page_order, pageRotations: page_rotations, overwrite });
}

export async function pdfCompress(input_file: string, output_path: string, level: string, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_compress', { inputFile: input_file, outputPath: output_path, level, overwrite });
}

export async function pdfRotate(input_file: string, output_path: string, pages?: number[], rotation?: number, overwrite?: boolean): Promise<string> {
  return await invoke<string>('pdf_rotate', { inputFile: input_file, outputPath: output_path, pages, rotation, overwrite });
}

export async function pdfWatermark(input_file: string, output_path: string, watermark_type: string, text?: string, image_path?: string, position?: string, opacity?: number, font_size?: number, font_color?: string, overwrite?: boolean): Promise<string> {
  return await invoke<string>('pdf_watermark', { inputFile: input_file, outputPath: output_path, watermarkType: watermark_type, text, imagePath: image_path, position, opacity, fontSize: font_size, fontColor: font_color, overwrite });
}

export async function pdfPageNumbers(input_file: string, output_path: string, position: string, format: string, font_size?: number, font_color?: string, overwrite?: boolean): Promise<string> {
  return await invoke<string>('pdf_page_numbers', { inputFile: input_file, outputPath: output_path, position, format, fontSize: font_size, fontColor: font_color, overwrite });
}

export async function pdfCrop(input_file: string, output_path: string, margins: any, unit: string, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_crop', { inputFile: input_file, outputPath: output_path, margins, unit, overwrite });
}

export async function pdfOcr(input_file: string, output_path: string, languages: string[], dpi: number, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_ocr', { inputFile: input_file, outputPath: output_path, languages, dpi, overwrite });
}

export async function pdfProtect(input_file: string, output_path: string, user_password: string, owner_password?: string, permissions?: any, overwrite?: boolean): Promise<string> {
  return await invoke<string>('pdf_protect', { inputFile: input_file, outputPath: output_path, userPassword: user_password, ownerPassword: owner_password, permissions, overwrite });
}

export async function pdfUnlock(input_file: string, output_path: string, password: string, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_unlock', { inputFile: input_file, outputPath: output_path, password, overwrite });
}

export async function pdfRepair(input_file: string, output_path: string, overwrite: boolean): Promise<string> {
  return await invoke<string>('pdf_repair', { inputFile: input_file, outputPath: output_path, overwrite });
}

export async function convertAny(input_file: string, output_path: string, target_format: string, options?: any, overwrite?: boolean): Promise<string> {
  return await invoke<string>('convert_any', { inputFile: input_file, outputPath: output_path, targetFormat: target_format, options, overwrite });
}

export async function pdfInfo(input_file: string): Promise<any> {
  return await invoke<any>('pdf_info', { inputFile: input_file });
}

export async function pdfThumbnail(input_file: string, pages: number[], dpi: number): Promise<Uint8Array> {
  return await invoke<Uint8Array>('pdf_thumbnail', { inputFile: input_file, pages, dpi });
}

export async function getTempDir(): Promise<string> {
  return await invoke<string>('get_temp_dir');
}

export async function cleanTemp(): Promise<number> {
  return await invoke<number>('clean_temp');
}

export async function appVersion(): Promise<string> {
  return await invoke<string>('app_version');
}