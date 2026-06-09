import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { pdfPageNumbers } from '../../lib/tauri';

export function PageNumbers() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [position, setPosition] = useState('bottom-center');
  const [format, setFormat] = useState('simple');
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

  const handlePageNumbers = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Adding Page Numbers');
    setProgressMessage('Processing...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 300);

      const output = await pdfPageNumbers(
        file.file.name,
        file.file.name.replace('.pdf', '_paginated.pdf'),
        position,
        format,
        undefined,
        undefined,
        true
      );

      clearInterval(interval);
      setProgress(100);
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Failed to add page numbers');
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
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
        <Select
          label="Position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          options={[
            { value: 'top-left', label: 'Top Left' },
            { value: 'top-center', label: 'Top Center' },
            { value: 'top-right', label: 'Top Right' },
            { value: 'bottom-left', label: 'Bottom Left' },
            { value: 'bottom-center', label: 'Bottom Center' },
            { value: 'bottom-right', label: 'Bottom Right' },
          ]}
          disabled={!file}
        />

        <Select
          label="Format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          options={[
            { value: 'simple', label: 'Simple (1, 2, 3...)' },
            { value: 'fraction', label: 'Fraction (1/10, 2/10...)' },
            { value: 'custom', label: 'Custom (e.g., "Page {n}")' },
          ]}
          disabled={!file}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handlePageNumbers}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Adding Page Numbers...' : 'Add Page Numbers'}
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