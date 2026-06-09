import { motion } from 'framer-motion';
import { Button } from './ui/Button';

interface ResultCardProps {
  outputPath: string;
  fileSize?: number;
  processingTime?: number;
  onSave?: () => void;
  onPreview?: () => void;
  showPreview?: boolean;
}

export function ResultCard({ outputPath, fileSize, processingTime, onSave, onPreview, showPreview }: ResultCardProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="p-4 bg-surface border border-border rounded-lg"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-success" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary">Success!</h3>
          <p className="text-sm text-text-secondary truncate">{outputPath}</p>
        </div>
      </div>

      {(fileSize || processingTime) && (
        <div className="flex items-center gap-4 mb-4 text-sm text-text-secondary">
          {fileSize && <span>Size: {formatSize(fileSize)}</span>}
          {processingTime && <span>Time: {formatTime(processingTime)}</span>}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="primary" onClick={onSave} className="flex-1">
          Save File
        </Button>
        {onPreview && (
          <Button variant="outline" onClick={onPreview} className="flex-1">
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}