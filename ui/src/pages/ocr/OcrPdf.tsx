import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { pdfOcr } from '../../lib/tauri';

export function OcrPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [languages, setLanguages] = useState('eng');
  const [dpi, setDpi] = useState(300);
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

  const handleOcr = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Processing OCR');
    setProgressMessage('Analyzing pages...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      const output = await pdfOcr(
        file.file.name,
        file.file.name.replace('.pdf', '_ocr.pdf'),
        languages.split('+'),
        dpi,
        true
      );

      clearInterval(interval);
      setProgress(100);
      setProgressMessage('OCR complete!');
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'OCR failed');
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
        <Input
          label="Languages (comma-separated)"
          placeholder="e.g., eng, tur"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          disabled={!file}
        />

        <Select
          label="DPI"
          value={dpi.toString()}
          onChange={(e) => setDpi(parseInt(e.target.value))}
          options={[
            { value: '150', label: '150 DPI (faster, lower quality)' },
            { value: '300', label: '300 DPI (recommended)' },
            { value: '600', label: '600 DPI (slower, higher quality)' },
          ]}
          disabled={!file}
        />
      </div>

      <p className="text-sm text-text-secondary">
        Note: OCR requires Tesseract to be installed. Processing time depends on page count and language.
      </p>

      <Button
        variant="primary"
        size="lg"
        onClick={handleOcr}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing OCR...' : 'Run OCR'}
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