import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}

export function Progress({ value, max = 100, className, label }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-text-secondary">{label}</span>
          <span className="text-sm font-medium text-text-secondary">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn('h-2 bg-surface border border-border rounded-full overflow-hidden', className)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}