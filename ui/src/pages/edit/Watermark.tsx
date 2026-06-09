import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { pdfWatermark } from '../../lib/tauri';

export function Watermark() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState('');
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState('center');
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

  const handleWatermark = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Adding Watermark');
    setProgressMessage('Processing...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 300);

      const output = await pdfWatermark(
        file.file.name,
        file.file.name.replace('.pdf', '_watermarked.pdf'),
        watermarkType,
        watermarkType === 'text' ? watermarkText : undefined,
        watermarkType === 'image' ? watermarkText : undefined,
        position,
        opacity,
        undefined,
        undefined,
        true
      );

      clearInterval(interval);
      setProgress(100);
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Watermark failed');
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
          label="Watermark Type"
          value={watermarkType}
          onChange={(e) => setWatermarkType(e.target.value as 'text' | 'image')}
          options={[
            { value: 'text', label: 'Text Watermark' },
            { value: 'image', label: 'Image Watermark' },
          ]}
          disabled={!file}
        />

        {watermarkType === 'text' ? (
          <Input
            label="Watermark Text"
            placeholder="Enter watermark text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            disabled={!file}
          />
        ) : (
          <Input
            label="Image Path"
            placeholder="Path to image file"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            disabled={!file}
          />
        )}

        <Select
          label="Position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          options={[
            { value: 'center', label: 'Center' },
            { value: 'diagonal', label: 'Diagonal' },
            { value: 'custom', label: 'Custom' },
          ]}
          disabled={!file}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Opacity: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            disabled={!file}
            className="w-full"
          />
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleWatermark}
        disabled={!file || !watermarkText || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Adding Watermark...' : 'Add Watermark'}
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