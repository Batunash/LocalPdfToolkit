import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';
import { PdfRangeVisualizer } from '../components/PdfRangeVisualizer';
import { RangeInputEditor } from '../components/RangeInputEditor';
import type { PageRange } from '../components/RangeInputEditor';

interface SplitToolProps {
  onBack: () => void;
}

export const SplitTool: React.FC<SplitToolProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'by_every' | 'by_ranges'>('by_every');
  const [nPages, setNPages] = useState<number>(1);
  const [rangeList, setRangeList] = useState<PageRange[]>([{ id: '1', from: 1, to: 2 }]);
  const { t } = useTranslation();

  const getRangesString = () => rangeList.map(r => `${r.from}-${r.to}`).join(', ');

  const handleSplit = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    
    
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(30, 'Analyzing pages...');
    const file = files[0];
    setProgress(60, 'Splitting PDF pages...');
    const outputDir = `${tempDir}\\split_${Date.now()}`;
    const paths = await tauriAdapter.split(
      file.path,
      outputDir,
      mode,
      mode === 'by_ranges' ? getRangesString() : undefined,
      mode === 'by_every' ? nPages : undefined,
      true
    );
    
    setProgress(100, 'Split completed!');
    return paths;
  };

  return (
    <ToolWrapper
      toolId="split"
      title={t('categories.organize') + " > " + t('options.splitMode')}
      description={t('categories.organize')}
      multipleFiles={false}
      onRun={handleSplit}
      onBack={onBack}
      optionsPanel={(files) => (
        <div className="space-y-4">
          <div>
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block mb-2">{t('options.splitMode')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('by_every')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  mode === 'by_every'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'bg-transparent text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                {t('options.everyNPages')}
              </button>
              <button
                type="button"
                onClick={() => setMode('by_ranges')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  mode === 'by_ranges'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'bg-transparent text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                {t('options.customRanges')}
              </button>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            {mode === 'by_every' ? (
              <div className="space-y-2.5">
                <label className="text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5">
                  <Icons.Layers className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  {t('options.splitInterval')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={nPages}
                    onChange={(e) => setNPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-650"
                  />
                  <span className="text-zinc-450 dark:text-zinc-500 text-[10px] font-medium">{t('options.pagesPerSplit')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <label className="text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5">
                  <Icons.Hash className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  {t('options.pageRanges')}
                </label>
                <RangeInputEditor 
                  ranges={rangeList} 
                  onChange={setRangeList} 
                  maxPages={files[0]?.pages}
                />
                {files[0] && (
                  <PdfRangeVisualizer 
                    filePath={files[0].path} 
                    selectedRanges={getRangesString()} 
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
};
