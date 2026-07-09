import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';
import { PdfRangeVisualizer } from '../components/PdfRangeVisualizer';
import { RangeInputEditor } from '../components/RangeInputEditor';
import type { PageRange } from '../components/RangeInputEditor';

interface RotateToolProps {
  onBack: () => void;
}

export const RotateTool: React.FC<RotateToolProps> = ({ onBack }) => {
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [targetPages, setTargetPages] = useState<'all' | 'custom'>('all');
  const [rangeList, setRangeList] = useState<PageRange[]>([{ id: '1', from: 1, to: 1 }]);
  const { t } = useTranslation();

  const getRangesString = () => rangeList.map(r => r.from === r.to ? `${r.from}` : `${r.from}-${r.to}`).join(', ');

  const handleRotate = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    

    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(30, 'Analyzing pages...');
    const file = files[0];
    const outputPath = `${tempDir}\\rotated_${Date.now()}.pdf`;
    
    let pagesToRotate: number[] | null = null;
    if (targetPages === 'custom') {
      const pageRangesStr = getRangesString();
      if (pageRangesStr) {
        pagesToRotate = [];
        const parts = pageRangesStr.split(',');
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(p => parseInt(p.trim()));
          if (start && end) {
            for (let i = start; i <= end; i++) pagesToRotate.push(i);
          }
        } else {
          const p = parseInt(part.trim());
          if (p) pagesToRotate.push(p);
        }
      }
    }
    }

    setProgress(65, 'Rotating page matrix...');
    const resultPath = await tauriAdapter.rotate(file.path, outputPath, pagesToRotate, angle, true);
    
    setProgress(100, 'Rotation complete!');
    return resultPath;
  };

  const angles = [
    { value: 90 as const, label: t('options.rotate90'), icon: Icons.RotateCw },
    { value: 180 as const, label: t('options.rotate180'), icon: Icons.MoveDown },
    { value: 270 as const, label: t('options.rotate270'), icon: Icons.RotateCcw }
  ];

  return (
    <ToolWrapper
      toolId="rotate"
      title={t('sidebar.edit') + " > " + t('options.rotationAngle')}
      description={t('sidebar.edit')}
      multipleFiles={false}
      onRun={handleRotate}
      onBack={onBack}
      optionsPanel={(files) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-505 dark:text-zinc-400 text-xs font-semibold block">{t('options.rotationAngle')}</label>
            <div className="space-y-1.5">
              {angles.map((ang) => {
                const isActive = angle === ang.value;
                const IconComp = ang.icon;
                return (
                  <button
                    key={ang.value}
                    type="button"
                    onClick={() => setAngle(ang.value)}
                    className={`w-full text-left px-3 py-2.5 border rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-350 dark:border-zinc-700'
                        : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 text-inherit" />
                    {ang.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-505 dark:text-zinc-400 text-xs font-semibold block">{t('options.pagesToRotate')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetPages('all')}
                className={`py-1.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                  targetPages === 'all'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'bg-transparent text-zinc-550 dark:text-zinc-450 border-zinc-200 dark:border-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                {t('options.allPages')}
              </button>
              <button
                type="button"
                onClick={() => setTargetPages('custom')}
                className={`py-1.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                  targetPages === 'custom'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                    : 'bg-transparent text-zinc-550 dark:text-zinc-450 border-zinc-200 dark:border-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                {t('options.specificPages')}
              </button>
            </div>

            {targetPages === 'custom' && (
              <div className="pt-2">
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
