import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';

interface UnlockToolProps {
  onBack: () => void;
}

export const UnlockTool: React.FC<UnlockToolProps> = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const handleUnlock = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    if (files.length === 0) throw new Error('No file selected');
    if (!password) throw new Error('Password cannot be empty');

    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    
    setProgress(30, 'Preparing PDF file...');
    const file = files[0];
    const outputPath = `${tempDir}\\unlocked_${Date.now()}.pdf`;
    
    setProgress(70, 'Removing password protection...');
    const resultPath = await tauriAdapter.unlock(file.path, outputPath, password, true);
    
    setProgress(100, 'Decryption complete!');
    return resultPath;
  };

  return (
    <ToolWrapper
      toolId="unlock"
      title={t('categories.security') + " > " + t('options.encryption')}
      description={t('categories.security')}
      multipleFiles={false}
      onRun={handleUnlock}
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
            <p className="text-zinc-455 dark:text-zinc-500 text-[10px] leading-normal pt-2 font-medium">
              {t('options.unlockDesc')}
            </p>
          </div>
        </div>
      }
    />
  );
};
