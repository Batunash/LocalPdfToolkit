import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { pdfCompress } from '../../lib/tauri';

export function CompressPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [level, setLevel] = useState('balanced');
  const [originalSize, setOriginalSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ outputPath: string; fileSize?: number } | null>(null);

  const handleFileDropped = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile({
        file: f,
        preview: URL.createObjectURL(f),
        path: f.name,
      });
      setOriginalSize(f.size);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Compressing PDF');
    setProgressMessage('Analyzing content...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 300);

      const output = await pdfCompress(file.file.name, file.file.name.replace('.pdf', '_compressed.pdf'), level, true);

      clearInterval(interval);
      setProgress(100);
      const newSize = originalSize * 0.6;
      setResult({ outputPath: output, fileSize: newSize });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Compression failed');
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const compressionLevels = [
    { value: 'maximum', label: 'Maximum (smallest size, lower quality)' },
    { value: 'high', label: 'High (small size, medium quality)' },
    { value: 'balanced', label: 'Balanced (recommended)' },
    { value: 'low', label: 'Low (best quality, larger size)' },
  ];

  return (
    <div className="space-y-6">
      <DropZone onFilesDropped={handleFileDropped} multiple={false} />

      {file && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-surface border border-border rounded-lg">
          <p className="font-medium text-text-primary">{file.file.name}</p>
          <p className="text-sm text-text-secondary">{(originalSize / 1024 / 1024).toFixed(2)} MB</p>
        </motion.div>
      )}

      <Select
        label="Compression Level"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        options={compressionLevels}
        disabled={!file}
      />

      <Button
        variant="primary"
        size="lg"
        onClick={handleCompress}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Compressing...' : 'Compress PDF'}
      </Button>

      {isProcessing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProgressCard progress={progress} stage={progressStage} message={progressMessage} />
        </motion.div>
      )}

      {result && result.fileSize && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ResultCard
            outputPath={result.outputPath}
            fileSize={result.fileSize}
            onSave={() => {}}
          />
        </motion.div>
      )}
    </div>
  );
}