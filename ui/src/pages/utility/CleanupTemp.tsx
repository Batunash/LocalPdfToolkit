import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { cleanTemp } from '../../lib/tauri';

export function CleanupTemp() {
  const [cleaning, setCleaning] = useState(false);
  const [filesCleaned, setFilesCleaned] = useState(0);
  const [message, setMessage] = useState('');

  const handleClean = async () => {
    setCleaning(true);
    setMessage('Cleaning temporary files...');

    try {
      const count = await cleanTemp();
      setFilesCleaned(count);
      setMessage(`Cleaned ${count} temporary file${count !== 1 ? 's' : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cleanup failed');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-surface border border-border rounded-lg">
        <h3 className="font-medium text-text-primary mb-2">Temporary Files Cleanup</h3>
        <p className="text-sm text-text-secondary">
          This will remove all temporary files created by LocalPdfToolkit during previous operations.
          Your original files are not affected.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleClean}
        disabled={cleaning}
        className="w-full"
      >
        {cleaning ? 'Cleaning...' : 'Clean Temporary Files'}
      </Button>

      {message && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="p-4 bg-surface border border-border rounded-lg">
            <p className="text-text-primary">{message}</p>
            {filesCleaned > 0 && <p className="text-sm text-success mt-1">Successfully freed disk space!</p>}
          </div>
        </motion.div>
      )}
    </div>
  );
}