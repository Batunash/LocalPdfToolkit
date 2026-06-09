import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { pdfSplit } from '../../lib/tauri';

export function SplitPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [splitMode, setSplitMode] = useState('by_ranges');
  const [pageRanges, setPageRanges] = useState('');
  const [nPages, setNPages] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ outputPath: string[] } | null>(null);

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

  const handleSplit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Splitting PDF');
    setProgressMessage('Processing...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const outputs = await pdfSplit(file.file.name, './output', splitMode, pageRanges || undefined, nPages, true);

      clearInterval(interval);
      setProgress(100);
      setProgressMessage('Complete!');
      setResult({ outputPath: outputs });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Split failed');
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const splitModeOptions = [
    { value: 'by_ranges', label: 'By Page Ranges (e.g., 1-3,5,7-9)' },
    { value: 'by_every', label: 'By Every N Pages' },
    { value: 'by_size', label: 'By File Size (10MB each)' },
  ];

  return (
    <div className="space-y-6">
      <DropZone onFilesDropped={handleFileDropped} multiple={false} />

      {file && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-surface border border-border rounded-lg">
          <p className="font-medium text-text-primary">{file.file.name}</p>
          <p className="text-sm text-text-secondary">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Split Mode"
          value={splitMode}
          onChange={(e) => setSplitMode(e.target.value)}
          options={splitModeOptions}
        />

        {splitMode === 'by_every' && (
          <Input
            label="Pages per file"
            type="number"
            min={1}
            value={nPages}
            onChange={(e) => setNPages(parseInt(e.target.value) || 1)}
          />
        )}

        {splitMode === 'by_ranges' && (
          <div className="col-span-2">
            <Input
              label="Page Ranges"
              placeholder="e.g., 1-3,5,7-9"
              value={pageRanges}
              onChange={(e) => setPageRanges(e.target.value)}
            />
          </div>
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleSplit}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Splitting...' : 'Split PDF'}
      </Button>

      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ProgressCard progress={progress} stage={progressStage} message={progressMessage} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ResultCard outputPath={`${result.outputPath.length} files created`} onSave={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}