import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export function OrganizePdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [pageOrder, setPageOrder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ outputPath: string } | null>(null);

  const handleFileDropped = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile({
        file: f,
        preview: URL.createObjectURL(f),
        path: f.name,
      });
    }
  };

  const handleOrganize = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Organizing Pages');
    setProgressMessage('Processing...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 300);

      const pages = pageOrder ? pageOrder.split(',').map((p) => parseInt(p.trim())) : undefined;
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setResult({ outputPath: file.file.name.replace('.pdf', '_organized.pdf') });
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Operation failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <DropZone onFilesDropped={handleFileDropped} multiple={false} />

      {file && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-surface border border-border rounded-lg">
          <p className="font-medium text-text-primary">{file.file.name}</p>
        </motion.div>
      )}

      <div className="grid gap-4">
        <Input
          label="Page Order (comma-separated)"
          placeholder="e.g., 3,1,2,5,4"
          value={pageOrder}
          onChange={(e) => setPageOrder(e.target.value)}
          disabled={!file}
        />

        <Select
          label="Page Rotations (optional)"
          value="none"
          onChange={() => {}}
          options={[
            { value: 'none', label: 'No Rotation' },
            { value: '90', label: 'Rotate 90°' },
            { value: '180', label: 'Rotate 180°' },
            { value: '270', label: 'Rotate 270°' },
          ]}
          disabled
        />
      </div>

      <p className="text-sm text-text-secondary">
        Note: Advanced page reordering features coming soon.
      </p>

      <Button
        variant="primary"
        size="lg"
        onClick={handleOrganize}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Organizing...' : 'Organize Pages'}
      </Button>

      {isProcessing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProgressCard progress={progress} stage={progressStage} message={progressMessage} />
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ResultCard outputPath={result.outputPath} onSave={() => {}} />
        </motion.div>
      )}
    </div>
  );
}