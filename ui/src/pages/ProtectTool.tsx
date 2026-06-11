import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';

interface ProtectToolProps {
  onBack: () => void;
}

export const ProtectTool: React.FC<ProtectToolProps> = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowModify, setAllowModify] = useState(false);
  const [allowCopy, setAllowCopy] = useState(false);
  const [allowAnnotate, setAllowAnnotate] = useState(false);
  const { t } = useTranslation();

  const handleProtect = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    if (files.length === 0) throw new Error(t('common.noFileSelected'));
    if (!password) throw new Error(t('common.passwordEmpty'));

    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(30, 'Preparing PDF file...');
    const file = files[0];
    const outputPath = `${tempDir}\\protected_${Date.now()}.pdf`;
    
    setProgress(70, 'Encrypting document (AES-256)...');
    const resultPath = await tauriAdapter.protect(
      file.path,
      outputPath,
      password,
      undefined,
      allowPrint,
      allowModify,
      allowCopy,
      allowAnnotate,
      true
    );
    
    setProgress(100, 'Encryption complete!');
    return resultPath;
  };

  return (
    <ToolWrapper
      toolId="protect"
      title={t('categories.security') + " > " + t('options.permissions')}
      description={t('categories.security')}
      multipleFiles={false}
      onRun={handleProtect}
      onBack={onBack}
      optionsPanel={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('options.enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-850 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-650"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                {showPassword ? <Icons.EyeOff className="w-3.5 h-3.5" /> : <Icons.Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <label className="text-zinc-750 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-850/60 pb-2 mb-2">
              <Icons.ShieldAlert className="w-4 h-4 text-zinc-500" />
              {t('options.permissions')}
            </label>
            
            <label className="flex items-center justify-between cursor-pointer py-2 group">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">{t('options.allowPrint')}</span>
              <div className="relative">
                <input type="checkbox" checked={allowPrint} onChange={(e) => setAllowPrint(e.target.checked)} className="sr-only" />
                <div className={`block w-9 h-5 rounded-full transition-colors ${allowPrint ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowPrint ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer py-2 group">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">{t('options.allowModify')}</span>
              <div className="relative">
                <input type="checkbox" checked={allowModify} onChange={(e) => setAllowModify(e.target.checked)} className="sr-only" />
                <div className={`block w-9 h-5 rounded-full transition-colors ${allowModify ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowModify ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer py-2 group">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">{t('options.allowCopy')}</span>
              <div className="relative">
                <input type="checkbox" checked={allowCopy} onChange={(e) => setAllowCopy(e.target.checked)} className="sr-only" />
                <div className={`block w-9 h-5 rounded-full transition-colors ${allowCopy ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowCopy ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer py-2 group">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">{t('options.allowAnnotate')}</span>
              <div className="relative">
                <input type="checkbox" checked={allowAnnotate} onChange={(e) => setAllowAnnotate(e.target.checked)} className="sr-only" />
                <div className={`block w-9 h-5 rounded-full transition-colors ${allowAnnotate ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowAnnotate ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      }
    />
  );
};
