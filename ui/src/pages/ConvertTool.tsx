import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';

interface ConvertToolProps {
  onBack: () => void;
}

type TargetFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'jpg' | 'png' | 'html';

export const ConvertTool: React.FC<ConvertToolProps> = ({ onBack }) => {
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('docx');
  const [dpi, setDpi] = useState<number>(300);
  const [quality, setQuality] = useState<number>(85);
  const { t } = useTranslation();

  // Run conversion
  const handleConvert = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    if (files.length === 0) throw new Error('No file selected');
    
    const isPdfInput = files[0].path.toLowerCase().endsWith('.pdf');
    const actualTargetFormat = isPdfInput ? targetFormat : 'pdf';

    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(30, 'Preparing conversion buffers...');
    const file = files[0];
    const ext = actualTargetFormat.toLowerCase();
    const outputPath = `${tempDir}\\converted_${Date.now()}.${ext}`;
    
    setProgress(55, `Running converter to ${actualTargetFormat.toUpperCase()}...`);
    const resultPath = await tauriAdapter.convert(
      file.path,
      outputPath,
      actualTargetFormat,
      dpi,
      quality,
      true
    );
    
    setProgress(100, 'Conversion complete!');
    return resultPath;
  };

  return (
    <ToolWrapper
      toolId="convert"
      title={t('categories.convert') + " > " + t('options.conversionFlow')}
      description={t('categories.convert')}
      multipleFiles={false}
      acceptExtensions={['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'html']}
      onRun={handleConvert}
      onBack={onBack}
      optionsPanel={(files) => {
        const isPdfInput = files.length === 0 || files[0].path.toLowerCase().endsWith('.pdf');
        return (
        <div className="space-y-4">
          {/* Dynamic instruction based on file selection */}
          <div className="p-3 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase block tracking-wider">{t('options.conversionFlow')}</span>
            <span className="text-xs text-zinc-800 dark:text-zinc-200 font-bold block mt-1">
              {isPdfInput ? 'PDF → Office / Images' : 'Office / Image / Web → PDF'}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('formats.targetFormat')}</label>
            <div className="space-y-1.5">
              {isPdfInput ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('docx')}
                    className={`w-full text-left px-3 py-2 border rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                      targetFormat === 'docx' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700' : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{t('formats.word')}</span>
                    <Icons.FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('xlsx')}
                    className={`w-full text-left px-3 py-2 border rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                      targetFormat === 'xlsx' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700' : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{t('formats.excel')}</span>
                    <Icons.Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('pptx')}
                    className={`w-full text-left px-3 py-2 border rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                      targetFormat === 'pptx' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700' : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{t('formats.powerpoint')}</span>
                    <Icons.Presentation className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('html')}
                    className={`w-full text-left px-3 py-2 border rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                      targetFormat === 'html' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700' : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{t('formats.html')}</span>
                    <Icons.Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('jpg')}
                    className={`w-full text-left px-3 py-2 border rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                      targetFormat === 'jpg' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700' : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{t('formats.jpeg')}</span>
                    <Icons.Image className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('png')}
                    className={`w-full text-left px-3 py-2 border rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                      targetFormat === 'png' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700' : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{t('formats.png')}</span>
                    <Icons.Image className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full text-left px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-bold flex items-center justify-between"
                >
                  <span>{t('formats.pdf')}</span>
                  <Icons.FileText className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {isPdfInput && (targetFormat === 'jpg' || targetFormat === 'png') && (
            <div className="p-3 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold block">{t('options.imageOptions')}</span>
              <div className="space-y-1">
                <label className="text-zinc-500 dark:text-zinc-450 text-[10px] block">{t('options.resolution')}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[150, 300, 450].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDpi(val)}
                      className={`py-1 text-[10px] font-bold rounded border cursor-pointer ${
                        dpi === val ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-450 dark:text-zinc-500'
                      }`}
                    >
                      {val} DPI
                    </button>
                  ))}
                </div>
              </div>

              {targetFormat === 'jpg' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-450">
                    <span>{t('options.jpegQuality')}</span>
                    <span>{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-700 dark:accent-zinc-300"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        );
      }}
    />
  );
};
