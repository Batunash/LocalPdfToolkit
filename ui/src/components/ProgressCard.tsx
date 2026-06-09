import { motion } from 'framer-motion';
import { Progress } from './ui/Progress';

interface ProgressCardProps {
  progress: number;
  stage: string;
  message: string;
  onCancel?: () => void;
}

export function ProgressCard({ progress, stage, message, onCancel }: ProgressCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-surface border border-border rounded-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-text-primary">Processing...</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-error hover:text-error/80 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      <Progress value={progress} label={stage} />
      <p className="text-sm text-text-secondary mt-2">{message}</p>
    </motion.div>
  );
}