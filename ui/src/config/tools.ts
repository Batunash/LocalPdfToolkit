import type { ToolDefinition } from '../types';
export type { ToolDefinition } from '../types';

export const TOOLS: ToolDefinition[] = [
  // Organize Category
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one single document easily.',
    icon: 'Combine',
    color: 'text-rose-500 dark:text-rose-400',
    category: 'organize'
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Extract specific page ranges or split every page into separate files.',
    icon: 'Scissors',
    color: 'text-orange-500 dark:text-orange-400',
    category: 'organize'
  },
  {
    id: 'remove',
    title: 'Remove Pages',
    description: 'Delete unwanted pages from your PDF document.',
    icon: 'Trash2',
    color: 'text-red-500 dark:text-red-400',
    category: 'organize'
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    description: 'Reduce the file size of your PDF while maintaining optimal quality.',
    icon: 'Minimize2',
    color: 'text-emerald-500 dark:text-emerald-400',
    category: 'organize'
  },
  // Edit Category
  {
    id: 'rotate',
    title: 'Rotate PDF',
    description: 'Rotate your PDF pages 90, 180, or 270 degrees in bulk.',
    icon: 'RotateCw',
    color: 'text-purple-500 dark:text-purple-400',
    category: 'edit'
  },
  {
    id: 'watermark',
    title: 'Watermark',
    description: 'Stamp text or an image watermark onto your PDF pages.',
    icon: 'Stamp',
    color: 'text-indigo-500 dark:text-indigo-400',
    category: 'edit'
  },
  {
    id: 'page_numbers',
    title: 'Page Numbers',
    description: 'Add clean page numbers with custom positions and formats.',
    icon: 'Hash',
    color: 'text-blue-500 dark:text-blue-400',
    category: 'edit'
  },
  {
    id: 'crop',
    title: 'Crop PDF',
    description: 'Trim margins or crop specific areas of your PDF pages.',
    icon: 'Crop',
    color: 'text-cyan-500 dark:text-cyan-400',
    category: 'edit'
  },
  // Security Category
  {
    id: 'protect',
    title: 'Protect PDF',
    description: 'Encrypt your PDF with a password and set user permissions.',
    icon: 'Lock',
    color: 'text-pink-500 dark:text-pink-400',
    category: 'security'
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    description: 'Remove password protection and permissions security from your PDF.',
    icon: 'Unlock',
    color: 'text-teal-500 dark:text-teal-400',
    category: 'security'
  },
  // OCR & Utility
  {
    id: 'ocr',
    title: 'OCR PDF',
    description: 'Convert scanned PDF documents into searchable text PDFs (English/Turkish).',
    icon: 'ScanText',
    color: 'text-sky-500 dark:text-sky-400',
    category: 'ocr'
  },
  {
    id: 'repair',
    title: 'Repair PDF',
    description: 'Rebuild damaged or corrupt PDF structures.',
    icon: 'Wrench',
    color: 'text-amber-500 dark:text-amber-400',
    category: 'ocr'
  },
  {
    id: 'convert',
    title: 'Convert Format',
    description: 'Convert PDF to Docx, Xlsx, Pptx, HTML, Images, or vice versa.',
    icon: 'ArrowLeftRight',
    color: 'text-fuchsia-500 dark:text-fuchsia-400',
    category: 'convert'
  },
  {
    id: 'info',
    title: 'PDF Info',
    description: 'View file properties, page count, fonts, encryption status, and metadata.',
    icon: 'Info',
    color: 'text-slate-500 dark:text-slate-400',
    category: 'utility'
  }
];

export const CATEGORIES = [
  { id: 'all', title: 'All Tools' },
  { id: 'organize', title: 'Organize' },
  { id: 'edit', title: 'Edit PDF' },
  { id: 'convert', title: 'Convert' },
  { id: 'security', title: 'Security' },
  { id: 'ocr', title: 'OCR & Repair' }
] as const;
