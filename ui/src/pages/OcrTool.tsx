import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';

interface OcrToolProps {
  onBack: () => void;
}

export const OcrTool: React.FC<OcrToolProps> = ({ onBack }) => {
  const [language, setLanguage] = useState<string>('eng');
  const [dpi, setDpi] = useState<number>(300);
  const { t } = useTranslation();

  const handleOcr = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    if (files.length === 0) throw new Error('No file selected');

    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(25, 'Analyzing image layout...');
    const file = files[0];
    const outputPath = `${tempDir}\\ocr_${Date.now()}.pdf`;
    
    setProgress(50, 'Running OCR engine. Statically linking Tesseract... This may take a while.');
    const resultPath = await tauriAdapter.ocr(file.path, outputPath, language, dpi, true);
    
    setProgress(100, 'OCR completed!');
    return resultPath;
  };

  const languages = [
    { id: 'eng', label: t('options.langEng') },
    { id: 'tur', label: t('options.langTur') },
    { id: 'eng+tur', label: t('options.langEngTur') }
  ];

  const dpis = [150, 300, 450];

  return (
    <ToolWrapper
      toolId="ocr"
      title={t('categories.ocr') + " > OCR"}
      description={t('categories.ocr')}
      multipleFiles={false}
      onRun={handleOcr}
      onBack={onBack}
      optionsPanel={
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.docLanguage')}</label>
            <div className="space-y-1.5">
              {languages.map((lang) => {
                const isActive = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id)}
                    className={`w-full text-left px-3 py-2 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-350 dark:border-zinc-700'
                        : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.resolution')}</label>
            <div className="grid grid-cols-3 gap-2">
              {dpis.map((val) => {
                const isActive = dpi === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDpi(val)}
                    className={`py-1.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-350 dark:border-zinc-700'
                        : 'bg-transparent text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30'
                    }`}
                  >
                    {val} DPI
                  </button>
                );
              })}
            </div>
            <p className="text-zinc-450 dark:text-zinc-550 text-[10px] block leading-normal mt-1.5 font-medium">
              {t('options.ocrResolutionDesc')}
            </p>
          </div>
        </div>
      }
    />
  );
};
