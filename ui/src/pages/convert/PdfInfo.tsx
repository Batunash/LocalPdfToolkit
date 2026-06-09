import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone, FileWithPreview } from '../../components/DropZone';
import { Card } from '../../components/ui/Card';
import { pdfInfo } from '../../lib/tauri';

interface PdfMetadata {
  file_path: string;
  file_size: number;
  file_size_formatted: string;
  page_count: number;
  encrypted: boolean;
  pdf_version: string;
  creator?: string;
  producer?: string;
  creation_date?: string;
  modification_date?: string;
}

export function PdfInfo() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileDropped = async (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile({
        file: f,
        preview: URL.createObjectURL(f),
        path: f.name,
      });
      setLoading(true);
      setError('');
      setMetadata(null);

      try {
        const info = await pdfInfo(f.name);
        setMetadata(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get PDF info');
      } finally {
        setLoading(false);
      }
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

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <p className="text-text-secondary">Loading PDF information...</p>
          </Card>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <p className="text-error">{error}</p>
          </Card>
        </motion.div>
      )}

      {metadata && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">File Size</p>
                  <p className="font-medium">{metadata.file_size_formatted}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Page Count</p>
                  <p className="font-medium">{metadata.page_count}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">PDF Version</p>
                  <p className="font-medium">{metadata.pdf_version}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Encrypted</p>
                  <p className="font-medium">{metadata.encrypted ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {metadata.creator && (
                <div>
                  <p className="text-sm text-text-secondary">Creator</p>
                  <p className="font-medium">{metadata.creator}</p>
                </div>
              )}

              {metadata.producer && (
                <div>
                  <p className="text-sm text-text-secondary">Producer</p>
                  <p className="font-medium">{metadata.producer}</p>
                </div>
              )}

              {metadata.creation_date && (
                <div>
                  <p className="text-sm text-text-secondary">Created</p>
                  <p className="font-medium">{metadata.creation_date}</p>
                </div>
              )}

              {metadata.modification_date && (
                <div>
                  <p className="text-sm text-text-secondary">Modified</p>
                  <p className="font-medium">{metadata.modification_date}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}