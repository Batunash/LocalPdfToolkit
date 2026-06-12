import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Monitor, FolderOpen, FileText, Globe, RefreshCw } from 'lucide-react';
import { useTranslation } from '../i18n';

export interface AppSettings {
  defaultOutputDir: string;
  compressionLevel: 'extreme' | 'high' | 'balanced' | 'low';
  ocrLanguage: 'eng' | 'tur' | 'eng+tur';
  autoUpdate: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'tr';
}

const defaultSettings: AppSettings = {
  defaultOutputDir: '',
  compressionLevel: 'balanced',
  ocrLanguage: 'eng',
  autoUpdate: true,
  theme: 'system',
  language: 'en',
};

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isDirty, setIsDirty] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    // Load settings from localStorage on mount
    const stored = localStorage.getItem('localpdf_settings');
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Update language when settings change
    if (settings.language !== language) {
      setLanguage(settings.language);
    }
  }, [settings.language, language, setLanguage]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    localStorage.setItem('localpdf_settings', JSON.stringify(settings));
    setIsDirty(false);
    onClose();
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('localpdf_settings');
    setIsDirty(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 z-[70] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t('common.settings')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Appearance */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Appearance
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                      <Monitor className="w-4 h-4" />
                      Theme
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', e.target.value as AppSettings['theme'])}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Language */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Language & Region
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                      <Globe className="w-4 h-4" />
                      Interface Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value as AppSettings['language'])}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="en">English</option>
                      <option value="tr">Türkçe</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                      <FileText className="w-4 h-4" />
                      OCR Language
                    </label>
                    <select
                      value={settings.ocrLanguage}
                      onChange={(e) => updateSetting('ocrLanguage', e.target.value as AppSettings['ocrLanguage'])}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="eng">English</option>
                      <option value="tur">Turkish</option>
                      <option value="eng+tur">English + Turkish</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Processing */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Processing
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                      <FolderOpen className="w-4 h-4" />
                      Default Output Directory
                    </label>
                    <input
                      type="text"
                      value={settings.defaultOutputDir}
                      onChange={(e) => updateSetting('defaultOutputDir', e.target.value)}
                      placeholder="Leave empty for same as input"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                      <Save className="w-4 h-4" />
                      Default Compression Level
                    </label>
                    <select
                      value={settings.compressionLevel}
                      onChange={(e) => updateSetting('compressionLevel', e.target.value as AppSettings['compressionLevel'])}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="extreme">Extreme (Lowest Quality)</option>
                      <option value="high">High Compression</option>
                      <option value="balanced">Balanced (Recommended)</option>
                      <option value="low">Low (Highest Quality)</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Updates */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Updates
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Auto-check for updates</span>
                    </div>
                    <button
                      onClick={() => updateSetting('autoUpdate', !settings.autoUpdate)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.autoUpdate ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.autoUpdate ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <button
                onClick={handleReset}
                disabled={!isDirty}
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset to Defaults
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="px-4 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};