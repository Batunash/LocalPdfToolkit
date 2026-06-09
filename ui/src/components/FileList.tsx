import { motion, Reorder } from 'framer-motion';
import { cn } from '../lib/utils';
import { FileCard } from './FileCard';

interface FileItem {
  id: string;
  name: string;
  size: number;
}

interface FileListProps {
  files: FileItem[];
  onReorder?: (newFiles: FileItem[]) => void;
  onRemove?: (id: string) => void;
  canReorder?: boolean;
}

export function FileList({ files, onReorder, onRemove, canReorder = false }: FileListProps) {
  return (
    <div className="space-y-2">
      {canReorder && onReorder ? (
        <Reorder.Group axis="y" values={files} onReorder={onReorder} className="space-y-2">
          {files.map((file) => (
            <Reorder.Item key={file.id} value={file}>
              <div className="flex items-center gap-2">
                <div className="cursor-grab active:cursor-grabbing p-2 text-text-secondary">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 2a2 2 0 10.001 3.999A2 2 0 007 2zm0 6a2 2 0 10.001 3.999A2 2 0 007 8zm0 6a2 2 0 10.001 3.999A2 2 0 007 14zm6-8a2 2 0 10-.001-3.999A2 2 0 0013 6zm0 2a2 2 0 10-.001 3.999A2 2 0 0013 8zm0 6a2 2 0 10-.001-3.999A2 2 0 0013 14z" />
                  </svg>
                </div>
                <FileCard name={file.name} size={file.size} onRemove={() => onRemove?.(file.id)} />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        files.map((file) => (
          <FileCard key={file.id} name={file.name} size={file.size} onRemove={() => onRemove?.(file.id)} />
        ))
      )}
    </div>
  );
}