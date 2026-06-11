import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { SelectedFile } from '../types';
import { DropZone } from '../components/DropZone';
import { tauriAdapter, type PdfMetadata } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';

interface InfoToolProps {
  onBack: () => void;
}

export const InfoTool: React.FC<InfoToolProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleFileSelected = async (files: SelectedFile[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const info = await tauriAdapter.getPdfInfo(file.path);
      setMetadata(info);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.toString() || 'Failed to retrieve PDF metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClear = () => {
    setSelectedFile(null);
    setMetadata(null);
    setErrorMsg(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tool Header */}
      <div className="flex items-center gap-4 flex-shrink-0 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all shadow-sm cursor-pointer"
        >
          <Icons.ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-none m-0!">
            {t('options.properties')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1 font-medium">
            {t('dashboard.desc')}
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm rounded-3xl border border-zinc-200 dark:border-zinc-850 flex flex-col items-center justify-center p-8 z-20">
            <Icons.Loader2 className="w-8 h-8 text-zinc-700 dark:text-zinc-300 animate-spin mb-4" />
            <span className="text-zinc-700 dark:text-zinc-300 text-xs font-bold">{t('common.processing')}</span>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 bg-white dark:bg-zinc-950 rounded-3xl border border-rose-500/10 flex flex-col items-center justify-center p-8 z-15 text-center">
            <Icons.AlertTriangle className="w-8 h-8 text-rose-500 mb-4" />
            <h3 className="text-zinc-800 dark:text-zinc-100 font-bold text-base">{t('common.failed')}</h3>
            <p className="text-rose-550 dark:text-rose-400/90 text-xs mt-2 max-w-md bg-rose-500/5 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 p-4 rounded-xl font-mono">
              {errorMsg}
            </p>
            <button
              onClick={handleClear}
              className="mt-6 px-5 py-2 bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:text-zinc-800 dark:text-zinc-350 dark:hover:text-zinc-100 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {!selectedFile && !isLoading && !errorMsg ? (
          <div className="w-full max-w-2xl">
            <DropZone
              onFilesSelected={handleFileSelected}
              multiple={false}
              descriptionText={t('options.selectAnalyze')}
            />
          </div>
        ) : (
          metadata && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl h-full overflow-y-auto bg-white/50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-850/60 rounded-3xl p-6 flex flex-col space-y-6 shadow-sm"
            >
              {/* Top Summary Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-850/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 flex items-center justify-center text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    <Icons.File className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-zinc-800 dark:text-zinc-250 font-bold text-sm truncate pr-2">
                      {selectedFile?.name}
                    </h3>
                    <p className="text-zinc-450 dark:text-zinc-500 text-xs mt-0.5 truncate max-w-md break-all font-medium">
                      {selectedFile?.path}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-550 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-150 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.RefreshCw className="w-3.5 h-3.5" />
                  {t('options.refreshFile')}
                </button>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Icons.BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase block font-bold">{t('options.totalPages')}</span>
                    <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200">{metadata.pages}</span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Icons.HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase block font-bold">{t('options.fileSize')}</span>
                    <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200">{formatSize(metadata.sizeBytes)}</span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    metadata.isEncrypted ? 'bg-rose-500/10 border-rose-550/20 text-rose-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {metadata.isEncrypted ? <Icons.Lock className="w-5 h-5" /> : <Icons.Unlock className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase block font-bold">{t('options.encryption')}</span>
                    <span className={`text-xs font-bold ${metadata.isEncrypted ? 'text-rose-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {metadata.isEncrypted ? 'AES Password Encrypted' : 'None (Unprotected)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Info Sheet */}
              <div className="border border-zinc-250 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-850">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{t('options.properties')}</h4>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-850/60 text-xs">
                  <div className="grid grid-cols-3 px-4 py-3">
                    <span className="text-zinc-450 dark:text-zinc-500 font-bold">{t('options.title')}</span>
                    <span className="col-span-2 text-zinc-800 dark:text-zinc-200 font-bold break-words">{metadata.title || 'Untitled'}</span>
                  </div>
                  <div className="grid grid-cols-3 px-4 py-3">
                    <span className="text-zinc-455 dark:text-zinc-500 font-bold">{t('options.author')}</span>
                    <span className="col-span-2 text-zinc-850 dark:text-zinc-200 font-bold break-words">{metadata.author || 'Unknown'}</span>
                  </div>
                  <div className="grid grid-cols-3 px-4 py-3">
                    <span className="text-zinc-455 dark:text-zinc-500 font-bold">{t('options.creator')}</span>
                    <span className="col-span-2 text-zinc-850 dark:text-zinc-200 font-bold break-words">{metadata.creator || 'Not Specified'}</span>
                  </div>
                  <div className="grid grid-cols-3 px-4 py-3">
                    <span className="text-zinc-455 dark:text-zinc-500 font-bold">{t('options.producer')}</span>
                    <span className="col-span-2 text-zinc-850 dark:text-zinc-200 font-bold break-words">{metadata.producer || 'Not Specified'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
};
