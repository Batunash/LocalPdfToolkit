import React from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';

interface MergeToolProps {
  onBack: () => void;
}

export const MergeTool: React.FC<MergeToolProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const handleMerge = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(30, 'Preparing PDF files...');
    const inputPaths = files.map(f => f.path);
    const outputPath = `${tempDir}\\merged_${Date.now()}.pdf`;
    
    setProgress(60, 'Merging PDF files...');
    const resultPath = await tauriAdapter.merge(inputPaths, outputPath, true);
    
    setProgress(100, 'Merging complete!');
    return resultPath;
  };

  return (
    <ToolWrapper
      toolId="merge"
      title={t('categories.organize') + " > " + t('options.standardAppend')}
      description={t('options.standardAppendDesc')}
      multipleFiles={true}
      onRun={handleMerge}
      onBack={onBack}
      optionsPanel={
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block mb-1">
              {t('options.mergeStrategy')}
            </span>
            <span className="text-zinc-800 dark:text-zinc-200 text-xs font-bold block mt-1">
              {t('options.standardAppend')}
            </span>
            <p className="text-zinc-450 dark:text-zinc-500 text-[10px] mt-1.5 leading-relaxed font-medium">
              {t('options.standardAppendDesc')}
            </p>
          </div>
        </div>
      }
    />
  );
};
