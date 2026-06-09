import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { pdfRepair } from '../../lib/tauri';

export function RepairPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
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

  const handleRepair = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Repairing PDF');
    setProgressMessage('Analyzing document structure...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 25, 90));
      }, 400);

      const output = await pdfRepair(file.file.name, file.file.name.replace('.pdf', '_repaired.pdf'), true);

      clearInterval(interval);
      setProgress(100);
      setProgressMessage('Repair complete!');
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Repair failed');
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
          <p className="text-sm text-text-secondary">This file will be analyzed and repaired if possible.</p>
        </motion.div>
      )}

      <p className="text-sm text-text-secondary">
        This tool attempts to repair corrupt PDF files by rebuilding the cross-reference table and fixing common structural issues.
      </p>

      <Button
        variant="primary"
        size="lg"
        onClick={handleRepair}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Repairing...' : 'Repair PDF'}
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