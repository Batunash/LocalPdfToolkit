import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { pdfRemovePages } from '../../lib/tauri';

export function RemovePages() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [pageRanges, setPageRanges] = useState('');
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

  const handleRemove = async () => {
    if (!file || !pageRanges) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Removing Pages');
    setProgressMessage('Processing...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 300);

      const output = await pdfRemovePages(file.file.name, file.file.name.replace('.pdf', '_removed.pdf'), pageRanges, true);

      clearInterval(interval);
      setProgress(100);
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Operation failed');
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

      <Input
        label="Pages to Remove"
        placeholder="e.g., 1-3,5,7-9"
        value={pageRanges}
        onChange={(e) => setPageRanges(e.target.value)}
        disabled={!file}
      />

      <Button
        variant="primary"
        size="lg"
        onClick={handleRemove}
        disabled={!file || !pageRanges || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Removing...' : 'Remove Pages'}
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
            <ResultCard outputPath={result.outputPath} onSave={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}