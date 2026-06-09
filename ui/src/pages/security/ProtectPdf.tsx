import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { ProgressCard } from '../../components/ProgressCard';
import { ResultCard } from '../../components/ResultCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { pdfProtect } from '../../lib/tauri';

export function ProtectPdf() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [canPrint, setCanPrint] = useState(true);
  const [canModify, setCanModify] = useState(false);
  const [canExtract, setCanExtract] = useState(true);
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

  const handleProtect = async () => {
    if (!file || !userPassword) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStage('Encrypting PDF');
    setProgressMessage('Applying protection...');

    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 50, 90));
      }, 400);

      const permissions = { print: canPrint, modify: canModify, extract: canExtract, annotate: false };
      const output = await pdfProtect(file.file.name, file.file.name.replace('.pdf', '_protected.pdf'), userPassword, ownerPassword || undefined, permissions, true);

      clearInterval(interval);
      setProgress(100);
      setResult({ outputPath: output });
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Protection failed');
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
          label="User Password (required)"
          type="password"
          placeholder="Enter password for opening the PDF"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          disabled={!file}
        />

        <Input
          label="Owner Password (optional)"
          type="password"
          placeholder="Enter owner password (for full permissions)"
          value={ownerPassword}
          onChange={(e) => setOwnerPassword(e.target.value)}
          disabled={!file}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">Permissions</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={canPrint} onChange={(e) => setCanPrint(e.target.checked)} disabled={!file} />
            <span className="text-sm text-text-primary">Allow Printing</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={canModify} onChange={(e) => setCanModify(e.target.checked)} disabled={!file} />
            <span className="text-sm text-text-primary">Allow Modifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={canExtract} onChange={(e) => setCanExtract(e.target.checked)} disabled={!file} />
            <span className="text-sm text-text-primary">Allow Content Extraction</span>
          </label>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleProtect}
        disabled={!file || !userPassword || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Protecting...' : 'Protect PDF'}
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