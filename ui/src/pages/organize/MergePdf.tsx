import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { FileList } from '../../components/FileList';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { pdfMerge } from '../../lib/tauri';
import { cn } from '../../lib/utils';

export function MergePdf() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [outputPath, setOutputPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ outputPath: string; fileSize?: number; processingTime?: number } | null>(null);

  const handleFilesDropped = (newFiles: File[]) => {
    const converted = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      path: file.name,
    }));
    setFiles((prev) => [...prev, ...converted]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Merging PDFs');
    setProgressMessage('Preparing files...');

    try {
      // Simulate progress (actual implementation would need backend support)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const inputFiles = files.map((f) => f.file.name);
      const output = await pdfMerge(inputFiles, `${files[0].file.name.replace('.pdf', '')}_merged.pdf`, true);

      clearInterval(interval);
      setProgress(100);
      setProgressMessage('Complete!');

      setResult({
        outputPath: output,
        fileSize: files.reduce((acc, f) => acc + f.file.size, 0),
        processingTime: 1500,
      });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Merge failed');
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      <DropZone onFilesDropped={handleFilesDropped} multiple />

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <FileList
            files={files.map((f, i) => ({ id: `file-${i}`, name: f.file.name, size: f.file.size }))}
            canReorder
            onReorder={() => {}}
            onRemove={(id) => removeFile(parseInt(id.split('-')[1]))}
          />
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleMerge}
          disabled={files.length < 2 || isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Merging...' : `Merge (${files.length} files)`}
        </Button>
      </div>

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
            <ResultCard
              outputPath={result.outputPath}
              fileSize={result.fileSize}
              processingTime={result.processingTime}
              onSave={() => {}}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}