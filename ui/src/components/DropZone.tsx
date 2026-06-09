import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';

export interface FileWithPreview {
  file: File;
  preview: string;
  path?: string;
}

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxFiles?: number;
}

export function DropZone({ onFilesDropped, accept = { 'application/pdf': ['.pdf'] }, multiple = true, maxFiles }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesDropped(acceptedFiles);
    },
    [onFilesDropped]
  );

  const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const dropZoneContent = (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
        dropzoneDragActive || isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-surface'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <svg
          className={cn('w-12 h-12', dropzoneDragActive || isDragActive ? 'text-primary' : 'text-text-secondary')}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L8 5.414V11a1 1 0 11-2 0V5.414L4.707 6.707a1 1 0 01-1.414-1.414l5-5z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-lg font-medium text-text-primary">
            {dropzoneDragActive || isDragActive ? 'Drop your PDF here' : 'Drag & drop PDF here'}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            or <span className="text-primary font-medium">browse to select file</span>
          </p>
        </div>
        <p className="text-xs text-text-secondary">Supports PDF files only</p>
      </div>
    </div>
  );

  return dropZoneContent;
}