import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { pdfCrop } from '../../lib/tauri';

export function CropPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [unit, setUnit] = useState('points');
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
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

  const handleCrop = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Cropping PDF');
    setProgressMessage('Processing...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 25, 90));
      }, 300);

      const output = await pdfCrop(file.file.name, file.file.name.replace('.pdf', '_cropped.pdf'), margins, unit, true);

      clearInterval(interval);
      setProgress(100);
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Crop failed');
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
          label="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          options={[
            { value: 'points', label: 'Points' },
            { value: 'percentage', label: 'Percentage' },
          ]}
          disabled={!file}
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Top"
            value={margins.top}
            onChange={(e) => setMargins({ ...margins, top: parseFloat(e.target.value) || 0 })}
            disabled={!file}
            className="px-3 py-2 bg-bg border border-border rounded-md text-text-primary"
          />
          <input
            type="number"
            placeholder="Bottom"
            value={margins.bottom}
            onChange={(e) => setMargins({ ...margins, bottom: parseFloat(e.target.value) || 0 })}
            disabled={!file}
            className="px-3 py-2 bg-bg border border-border rounded-md text-text-primary"
          />
          <input
            type="number"
            placeholder="Left"
            value={margins.left}
            onChange={(e) => setMargins({ ...margins, left: parseFloat(e.target.value) || 0 })}
            disabled={!file}
            className="px-3 py-2 bg-bg border border-border rounded-md text-text-primary"
          />
          <input
            type="number"
            placeholder="Right"
            value={margins.right}
            onChange={(e) => setMargins({ ...margins, right: parseFloat(e.target.value) || 0 })}
            disabled={!file}
            className="px-3 py-2 bg-bg border border-border rounded-md text-text-primary"
          />
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleCrop}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Cropping...' : 'Crop PDF'}
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