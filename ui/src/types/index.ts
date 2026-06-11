export interface SelectedFile {
  name: string;
  path: string;
  size: number;
  pages?: number;
}

export type PageId =
  | 'dashboard'
  | 'merge'
  | 'split'
  | 'compress'
  | 'protect'
  | 'unlock'
  | 'ocr'
  | 'rotate'
  | 'convert'
  | 'info'
  | 'remove'
  | 'repair'
  | 'watermark'
  | 'page_numbers'
  | 'crop';

export interface ToolDefinition {
  id: PageId;
  title: string;
  description: string;
  icon: string; // Name of Lucide icon
  color: string; // Tailwind color classes
  category: 'organize' | 'edit' | 'security' | 'ocr' | 'convert' | 'utility';
}
