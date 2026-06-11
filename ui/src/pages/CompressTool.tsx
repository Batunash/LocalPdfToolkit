import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';

interface CompressToolProps {
  onBack: () => void;
}

type CompressionLevel = 'maximum' | 'high' | 'balanced' | 'low';

export const CompressTool: React.FC<CompressToolProps> = ({ onBack }) => {
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const { t } = useTranslation();

  const handleCompress = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    if (files.length === 0) throw new Error('No file selected');
    
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(30, 'Analyzing file layout...');
    const file = files[0];
    const outputPath = `${tempDir}\\compressed_${Date.now()}.pdf`;
    
    setProgress(55, 'Recompressing images & stream buffers...');
    const resultPath = await tauriAdapter.compress(file.path, outputPath, level, true);
    
    setProgress(100, 'Compression complete!');
    return resultPath;
  };

  const levels: { id: CompressionLevel; titleKey: any; descKey: any; icon: any }[] = [
    {
      id: 'maximum',
      titleKey: 'options.compressExtreme',
      descKey: 'options.compressExtremeDesc',
      icon: Icons.TrendingDown
    },
    {
      id: 'high',
      titleKey: 'options.compressHigh',
      descKey: 'options.compressHighDesc',
      icon: Icons.Zap
    },
    {
      id: 'balanced',
      titleKey: 'options.compressBalanced',
      descKey: 'options.compressBalancedDesc',
      icon: Icons.Award
    },
    {
      id: 'low',
      titleKey: 'options.compressLow',
      descKey: 'options.compressLowDesc',
      icon: Icons.ShieldCheck
    }
  ];

  return (
    <ToolWrapper
      toolId="compress"
      title={t('categories.organize') + " > " + t('options.compressionLevel')}
      description={t('categories.organize')}
      multipleFiles={false}
      onRun={handleCompress}
      onBack={onBack}
      optionsPanel={
        <div className="space-y-3">
          <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block mb-1">{t('options.compressionLevel')}</label>
          <div className="space-y-2">
            {levels.map((lvl) => {
              const isActive = level === lvl.id;
              const IconComp = lvl.icon;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setLevel(lvl.id)}
                  className={`w-full text-left p-3 border rounded-2xl transition-all cursor-pointer flex gap-3.5 relative overflow-hidden ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 font-bold shadow-sm'
                      : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    isActive ? 'bg-white dark:bg-zinc-900 border-zinc-350 dark:border-zinc-750' : 'bg-zinc-50 dark:bg-zinc-905 border-zinc-200 dark:border-zinc-800'
                  }`}>
                    <IconComp className="w-4 h-4 text-inherit" />
                  </div>
                  <div>
                    <h4 className="text-xs text-zinc-800 dark:text-zinc-200">{t(lvl.titleKey)}</h4>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 leading-normal font-medium">{t(lvl.descKey)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
};
