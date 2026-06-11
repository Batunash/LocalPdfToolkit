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
    if (files.length === 0) throw new Error('No file selected');
    if (!password) throw new Error('Password cannot be empty');

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
            
            <label className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-250 transition-colors cursor-pointer py-0.5 font-medium">
              <input
                type="checkbox"
                checked={allowPrint}
                onChange={(e) => setAllowPrint(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:ring-zinc-400/30 w-4 h-4 bg-white dark:bg-zinc-900 outline-none"
              />
              <span className="text-xs">{t('options.allowPrint')}</span>
            </label>

            <label className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-250 transition-colors cursor-pointer py-0.5 font-medium">
              <input
                type="checkbox"
                checked={allowModify}
                onChange={(e) => setAllowModify(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:ring-zinc-400/30 w-4 h-4 bg-white dark:bg-zinc-900 outline-none"
              />
              <span className="text-xs">{t('options.allowModify')}</span>
            </label>

            <label className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-250 transition-colors cursor-pointer py-0.5 font-medium">
              <input
                type="checkbox"
                checked={allowCopy}
                onChange={(e) => setAllowCopy(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:ring-zinc-400/30 w-4 h-4 bg-white dark:bg-zinc-900 outline-none"
              />
              <span className="text-xs">{t('options.allowCopy')}</span>
            </label>

            <label className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-250 transition-colors cursor-pointer py-0.5 font-medium">
              <input
                type="checkbox"
                checked={allowAnnotate}
                onChange={(e) => setAllowAnnotate(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:ring-zinc-400/30 w-4 h-4 bg-white dark:bg-zinc-900 outline-none"
              />
              <span className="text-xs">{t('options.allowAnnotate')}</span>
            </label>
          </div>
        </div>
      }
    />
  );
};
