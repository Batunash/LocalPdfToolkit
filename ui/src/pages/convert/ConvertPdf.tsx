import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { convertAny } from '../../lib/tauri';

export function ConvertPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [targetFormat, setTargetFormat] = useState('jpg');
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

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage(`Converting to ${targetFormat.toUpperCase()}`);
    setProgressMessage('Processing...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 400);

      const output = await convertAny(file.file.name, file.file.name.replace('.pdf', `.${targetFormat}`), targetFormat, {}, true);

      clearInterval(interval);
      setProgress(100);
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Conversion failed');
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

      <Select
        label="Target Format"
        value={targetFormat}
        onChange={(e) => setTargetFormat(e.target.value)}
        options={[
          { value: 'jpg', label: 'JPG (images)' },
          { value: 'png', label: 'PNG (images)' },
          { value: 'docx', label: 'DOCX (Word document)' },
          { value: 'xlsx', label: 'XLSX (Excel spreadsheet)' },
          { value: 'pptx', label: 'PPTX (PowerPoint)' },
          { value: 'html', label: 'HTML (web page)' },
        ]}
        disabled={!file}
      />

      <Button
        variant="primary"
        size="lg"
        onClick={handleConvert}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Converting...' : 'Convert PDF'}
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