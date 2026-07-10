import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SelectedFile, PageId } from '../types';
import { DropZone } from './DropZone';
import { BatchDropZone } from './BatchDropZone';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';

interface ToolWrapperProps {
  toolId: PageId;
  title: string;
  description: string;
  multipleFiles?: boolean;
  acceptExtensions?: string[];
  optionsPanel?: React.ReactNode | ((files: SelectedFile[], setFiles: React.Dispatch<React.SetStateAction<SelectedFile[]>>) => React.ReactNode);
  onRun: (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => Promise<string | string[]>;
  onBack: () => void;
}

export const ToolWrapper: React.FC<ToolWrapperProps> = ({
  toolId,
  title,
  description,
  multipleFiles = false,
  acceptExtensions = ['pdf'],
  optionsPanel,
  onRun,
  onBack
}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [outputFilePath, setOutputFilePath] = useState<string | string[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { t } = useTranslation();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFilesSelected = (newFiles: SelectedFile[]) => {
    if (multipleFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
    setErrorMsg(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setFiles([]);
    setOutputFilePath(null);
    setErrorMsg(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    try {
      setIsProcessing(true);
      setProgressPercent(0);
      setProgressMessage(t('common.processing'));
      setErrorMsg(null);

      const result = await onRun(files, (pct, msg) => {
        setProgressPercent(pct);
        if (msg) setProgressMessage(msg);
      });

      setOutputFilePath(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.toString() || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAs = async () => {
    if (!outputFilePath) return;

    try {
      if (Array.isArray(outputFilePath)) {
        const folder = await tauriAdapter.selectFolder();
        if (folder) {
          for (const file of outputFilePath) {
            const fileName = file.split(/[\\/]/).pop() || `processed_${Date.now()}.pdf`;
            // Using basic path join that works on Windows/Unix
            const separator = folder.includes('\\') ? '\\' : '/';
            await tauriAdapter.copyFile(file, `${folder}${separator}${fileName}`);
          }
          alert(t('common.savedSuccess') + folder);
        }
      } else {
        const defaultName = outputFilePath.split(/[\\/]/).pop() || `processed_${toolId}.pdf`;
        const savePath = await tauriAdapter.getSavePath(defaultName);

        if (savePath) {
          await tauriAdapter.copyFile(outputFilePath, savePath);
          alert(t('common.savedSuccess') + savePath);
        }
      }
    } catch (err: any) {
      alert('Error saving file: ' + err.toString());
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tool Header */}
      <div className="flex items-center gap-4 flex-shrink-0 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-750 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all shadow-sm cursor-pointer"
        >
          <Icons.ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-none m-0!">
            {title}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1 font-medium">{description}</p>
        </div>
      </div>

      {/* Main Container Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 relative">
        <AnimatePresence mode="wait">
          {/* Life Cycle 1: Processing Loader screen */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-8 z-30"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Loader2 className="w-5 h-5 text-zinc-700 dark:text-zinc-300 animate-spin" />
              </div>
              <h3 className="text-zinc-800 dark:text-zinc-100 font-bold text-sm">{t('common.processing')}</h3>
              <p className="text-zinc-450 dark:text-zinc-500 text-xs mt-2 text-center max-w-sm">
                {progressMessage}
              </p>

              {/* Progress bar */}
              <div className="w-64 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-6 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
                <motion.div
                  className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ ease: 'easeInOut' }}
                />
              </div>
              <span className="text-zinc-800 dark:text-zinc-200 text-xs font-bold mt-2">{progressPercent}%</span>
            </motion.div>
          )}

          {/* Life Cycle 2: Success Result Screen */}
          {outputFilePath && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10 rounded-xl p-8 text-center shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-500 dark:text-emerald-400 shadow-sm animate-pulse">
                <Icons.CheckCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-50">{t('common.completed')}</h2>
              <p className="text-zinc-450 dark:text-zinc-500 text-xs mt-2 max-w-md break-all font-medium">
                {t('common.outputPath')} {Array.isArray(outputFilePath) ? outputFilePath.join(', ') : outputFilePath}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleSaveAs}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold rounded-xl shadow-sm hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Icons.Download className="w-4 h-4" />
                  {t('common.export')}
                </button>
                <button
                  onClick={handleClear}
                  className="px-5 py-2.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:text-zinc-800 dark:text-zinc-350 dark:hover:text-zinc-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  {t('common.convertAnother')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Life Cycle 3: Error screen */}
          {errorMsg && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white dark:bg-zinc-950 rounded-xl border border-rose-500/10 flex flex-col items-center justify-center p-8 z-25 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 text-rose-500 shadow-sm">
                <Icons.AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <h3 className="text-zinc-800 dark:text-zinc-100 font-bold text-sm">{t('common.failed')}</h3>
              <p className="text-rose-600 dark:text-rose-400/90 text-xs mt-2 max-w-md bg-rose-500/5 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4 rounded-xl font-mono">
                {errorMsg}
              </p>
              <button
                onClick={() => setErrorMsg(null)}
                className="mt-6 px-5 py-2 bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:text-zinc-800 dark:text-zinc-350 dark:hover:text-zinc-100 text-xs font-semibold rounded-xl cursor-pointer"
              >
                {t('common.retry')}
              </button>
            </motion.div>
          )}

          {/* Life Cycle 4: Idle Uploading state */}
          {!outputFilePath && !isProcessing && !errorMsg && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0"
            >
              {/* Main Options Panel (Rendered prominently on the left if files are selected, otherwise full dropzone) */}
              {files.length > 0 ? (
                <div className="flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/10 rounded-xl p-6 shadow-sm min-h-0">
                  <h3 className="text-zinc-755 dark:text-zinc-205 font-extrabold text-sm mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center gap-2">
                    <Icons.SlidersHorizontal className="w-4 h-4 text-zinc-550" />
                    {t('common.settings')}
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6">
                    {typeof optionsPanel === 'function' ? optionsPanel(files, setFiles) : optionsPanel}
                  </div>

                  <button
                    onClick={handleProcess}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
                  >
                    <Icons.Play className="w-4 h-4 fill-current" />
                    {t('common.process')}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  {multipleFiles ? (
                    <BatchDropZone
                      onFilesSelected={handleFilesSelected}
                      acceptExtensions={acceptExtensions}
                      descriptionText={t('common.dropzoneText')}
                    />
                  ) : (
                    <DropZone
                      onFilesSelected={handleFilesSelected}
                      multiple={false}
                      acceptExtensions={acceptExtensions}
                      descriptionText={t('common.dropzoneText')}
                    />
                  )}
                </div>
              )}

              {/* Side File List (Rendered on the right if files are selected) */}
              {files.length > 0 && (
                <div className="w-full lg:w-80 flex flex-col border border-zinc-200 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/10 rounded-xl p-5 flex-shrink-0 min-h-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800/60">
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold flex items-center gap-2">
                      <Icons.FileStack className="w-3.5 h-3.5" />
                      {t('common.filesSelected', { count: files.length })}
                    </span>
                    <button
                      onClick={handleClear}
                      className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                      <span>{t('common.clearAll')}</span>
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-zinc-105 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                            <Icons.File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-zinc-800 dark:text-zinc-200 text-xs font-bold truncate pr-2">
                              {file.name}
                            </h4>
                            <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-[10px] mt-0.5 font-medium">
                              <span>{formatSize(file.size)}</span>
                              {file.pages !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{file.pages} {t('options.totalPages').toLowerCase()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 rounded-lg text-zinc-450 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0"
                        >
                          <Icons.X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {multipleFiles && (
                    <button
                      onClick={async () => {
                        const paths = await tauriAdapter.selectFile(acceptExtensions, true);
                        if (paths) {
                          const fileArray = Array.isArray(paths) ? paths : [paths];
                          const loaded = await Promise.all(fileArray.map(async (filePath) => {
                            const name = filePath.split(/[\\/]/).pop() || 'document.pdf';
                            let pages = undefined;
                            let size = 1024 * 150;
                            try {
                              const info = await tauriAdapter.getPdfInfo(filePath);
                              pages = info.pages;
                              size = info.sizeBytes;
                            } catch (e) {
                              console.warn("Failed to get file info:", e);
                            }
                            return { name, path: filePath, size, pages };
                          }));
                          handleFilesSelected(loaded);
                        }
                      }}
                      className="mt-4 py-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/40 dark:bg-zinc-900/10 hover:bg-white dark:hover:bg-zinc-900/30 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                    >
                      <Icons.Plus className="w-3.5 h-3.5" />
                      {t('common.addMore')}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
