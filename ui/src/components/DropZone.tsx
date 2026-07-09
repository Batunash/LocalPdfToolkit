import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import type { SelectedFile } from '../types';

interface DropZoneProps {
  onFilesSelected: (files: SelectedFile[]) => void;
  multiple?: boolean;
  acceptExtensions?: string[];
  descriptionText?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  multiple = false,
  acceptExtensions = ['pdf'],
  descriptionText
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const { t } = useTranslation();

  const isTauriEnv = typeof window !== 'undefined' && (
    (window as any).__TAURI_INTERNALS__ !== undefined ||
    (window as any).__TAURI__ !== undefined
  );

  useEffect(() => {
    let active = true;
    let deregisterFn: (() => void) | null = null;
    
    const setupTauriDrop = async () => {
      if (isTauriEnv) {
        try {
          const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
          const appWindow = getCurrentWebviewWindow();
          
          const deregister = await appWindow.onDragDropEvent((event) => {
            if (!active) return;
            if (event.payload.type === 'enter' || event.payload.type === 'over') {
              setIsDragActive(true);
            } else if (event.payload.type === 'leave') {
              setIsDragActive(false);
            } else if (event.payload.type === 'drop') {
              setIsDragActive(false);
              const paths = event.payload.paths;
              if (paths && paths.length > 0) {
                const validPaths = paths.filter((filePath) => {
                  const ext = filePath.split('.').pop()?.toLowerCase();
                  return ext && acceptExtensions.includes(ext);
                });

                if (validPaths.length > 0) {
                  const pathsToProcess = multiple ? validPaths : [validPaths[0]];
                  
                  Promise.all(
                    pathsToProcess.map(async (filePath) => {
                      const name = filePath.split(/[\\/]/).pop() || 'document.pdf';
                      let pages = undefined;
                      let size = 1024 * 150;
                      
                      try {
                        const info = await tauriAdapter.getPdfInfo(filePath);
                        pages = info.pages;
                        size = info.sizeBytes;
                      } catch (err) {
                        console.error('Failed to get PDF info:', err);
                      }

                      return { name, path: filePath, size, pages };
                    })
                  ).then((selectedFiles) => {
                    if (active) {
                      onFilesSelected(selectedFiles);
                    }
                  });
                }
              }
            }
          });
          
          if (!active) {
            deregister();
          } else {
            deregisterFn = deregister;
          }
        } catch (err) {
          console.error('Failed to bind Tauri drag-drop:', err);
        }
      }
    };

    setupTauriDrop();

    return () => {
      active = false;
      if (deregisterFn) {
        deregisterFn();
      }
    };
  }, [multiple, acceptExtensions, onFilesSelected, isTauriEnv]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Ignore HTML drag events inside Tauri (handled by native listener)
    if (isTauriEnv) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    // Ignore HTML drop events inside Tauri (handled by native listener)
    if (isTauriEnv) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles: SelectedFile[] = [];
      const fileCount = multiple ? e.dataTransfer.files.length : 1;

      for (let i = 0; i < fileCount; i++) {
        const file = e.dataTransfer.files[i];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext && acceptExtensions.includes(ext)) {
          droppedFiles.push({
            name: file.name,
            path: (file as any).path || file.name,
            size: file.size
          });
        }
      }

      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    }
  };

  const handleBrowse = async () => {
    if (isSelecting) return;
    try {
      setIsSelecting(true);
      const paths = await tauriAdapter.selectFile(acceptExtensions, multiple);
      if (paths) {
        const fileArray = Array.isArray(paths) ? paths : [paths];
        const enrichedFiles: SelectedFile[] = await Promise.all(
          fileArray.map(async (filePath) => {
            const name = filePath.split(/[\\/]/).pop() || 'document.pdf';
            let pages = undefined;
            let size = 1024 * 150;
            
            try {
              const info = await tauriAdapter.getPdfInfo(filePath);
              pages = info.pages;
              size = info.sizeBytes;
            } catch (err) {
              console.error('Failed to get PDF info:', err);
            }

            return { name, path: filePath, size, pages };
          })
        );
        onFilesSelected(enrichedFiles);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <motion.button
      type="button"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleBrowse}
      disabled={isSelecting}
      animate={{
        borderColor: isDragActive ? 'var(--color-zinc-400)' : 'var(--color-zinc-200)',
        backgroundColor: isDragActive ? 'rgba(120, 120, 120, 0.05)' : 'rgba(255, 255, 255, 0.03)',
        scale: isDragActive ? 1.002 : 1
      }}
      className="w-full py-16 px-6 border border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-shadow hover:shadow-sm outline-none group border-zinc-200 dark:border-zinc-855 bg-white/5 dark:bg-zinc-900/10 hover:border-zinc-300 dark:hover:border-zinc-800"
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-[1.01] transition-transform duration-200 shadow-sm">
        {isSelecting ? (
          <Icons.Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        ) : (
          <Icons.UploadCloud className="w-5 h-5 text-zinc-450 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
        )}
      </div>

      <h3 className="text-zinc-800 dark:text-zinc-200 font-bold text-xs">
        {isSelecting ? t('common.loadingFile') : t('common.browse')}
      </h3>
      <p className="text-zinc-450 dark:text-zinc-500 text-[11px] mt-1.5 max-w-sm leading-relaxed font-medium">
        {descriptionText || t('common.dropzoneText')}
      </p>

      {!isSelecting && (
        <span className="mt-4 px-3 py-1.5 text-[9px] font-bold text-zinc-550 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group-hover:bg-zinc-50 dark:group-hover:bg-zinc-850 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-all shadow-sm">
          {t('common.browse')}
        </span>
      )}
    </motion.button>
  );
};
