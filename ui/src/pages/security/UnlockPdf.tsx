import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { pdfUnlock } from '../../lib/tauri';

export function UnlockPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ outputPath: string } | null>(null);
  const [error, setError] = useState('');

  const handleFileDropped = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile({
        file: f,
        preview: URL.createObjectURL(f),
        path: f.name,
      });
      setError('');
    }
  };

  const handleUnlock = async () => {
    if (!file || !password) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Unlocking PDF');
    setProgressMessage('Decrypting...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 50, 90));
      }, 400);

      const output = await pdfUnlock(file.file.name, file.file.name.replace('.pdf', '_unlocked.pdf'), password, true);

      clearInterval(interval);
      setProgress(100);
      setResult({ outputPath: output });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed - wrong password?');
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
          <p className="text-sm text-text-secondary">This PDF is password protected.</p>
        </motion.div>
      )}

      <Input
        label="PDF Password"
        type="password"
        placeholder="Enter the password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={!file}
        error={error}
      />

      <Button
        variant="primary"
        size="lg"
        onClick={handleUnlock}
        disabled={!file || !password || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Unlocking...' : 'Unlock PDF'}
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