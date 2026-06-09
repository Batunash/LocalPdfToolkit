import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { pdfThumbnail } from '../../lib/tauri';

export function PdfThumbnail() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [pages, setPages] = useState('all');
  const [dpi, setDpi] = useState(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ outputPath: string } | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const handleFileDropped = async (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile({
        file: f,
        preview: URL.createObjectURL(f),
        path: f.name,
      });
    }
  };

  const handleThumbnail = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Generating Thumbnails');
    setProgressMessage('Rendering pages...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 400);

      const pageNumbers = pages === 'all' ? [1, 2, 3] : pages.split(',').map((p) => parseInt(p.trim()));
      const output = await pdfThumbnail(file.file.name, pageNumbers, dpi);

      clearInterval(interval);
      setProgress(100);
      // Handle the output as file paths (string[]) instead of Uint8Array
      const thumbUrls: string[] = [];
      setResult({ outputPath: `${file.file.name.replace('.pdf', '')}_thumbnails` });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Thumbnail generation failed');
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
          label="Pages"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          options={[
            { value: 'all', label: 'All Pages (first 3)' },
            { value: 'custom', label: 'Custom (comma-separated)' },
          ]}
          disabled={!file}
        />

        {pages === 'custom' && (
          <input
            type="text"
            placeholder="e.g., 1,3,5"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            disabled={!file}
            className="px-3 py-2 bg-bg border border-border rounded-md text-text-primary"
          />
        )}

        <Select
          label="DPI"
          value={dpi.toString()}
          onChange={(e) => setDpi(parseInt(e.target.value))}
          options={[
            { value: '72', label: '72 DPI (small, low quality)' },
            { value: '150', label: '150 DPI (medium)' },
            { value: '300', label: '300 DPI (high quality)' },
          ]}
          disabled={!file}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleThumbnail}
        disabled={!file || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Generating...' : 'Generate Thumbnails'}
      </Button>

      {isProcessing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProgressCard progress={progress} stage={progressStage} message={progressMessage} />
        </motion.div>
      )}

      {thumbnails.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {thumbnails.map((thumb, i) => (
              <img key={i} src={thumb} alt={`Page ${i + 1}`} className="rounded-lg border border-border" />
            ))}
          </div>
          <ResultCard outputPath={result?.outputPath || ''} onSave={() => {}} />
        </motion.div>
      )}
    </div>
  );
}