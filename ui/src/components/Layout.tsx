import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import type { PageId } from '../types';
import { TOOLS } from '../config/tools';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import type { Language } from '../i18n';

// Dynamic Icon rendering utility
export const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.HelpCircle className={className} />;
  return <IconComponent className={className} />;
};

interface LayoutProps {
  children: React.ReactNode;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [appVersion, setAppVersion] = useState('0.1.0');
  const [isCleaning, setIsCleaning] = useState(false);
  
  // Theme state: light or dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('localpdf_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const { language, setLanguage, t } = useTranslation();

  useEffect(() => {
    tauriAdapter.appVersion().then(setAppVersion);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('localpdf_theme', next);
  };

  const toggleLanguage = () => {
    const next: Language = language === 'en' ? 'tr' : 'en';
    setLanguage(next);
  };

  const handleCleanTemp = async () => {
    try {
      setIsCleaning(true);
      const cleanedCount = await tauriAdapter.cleanTemp();
      alert(t('sidebar.cleanSuccess', { count: cleanedCount }));
    } catch (err: any) {
      console.error(err);
      alert(t('sidebar.cleanFailed') + err.toString());
    } finally {
      setIsCleaning(false);
    }
  };

  const organizeTools = TOOLS.filter(t => t.category === 'organize');
  const editTools = TOOLS.filter(t => t.category === 'edit');
  const securityTools = TOOLS.filter(t => t.category === 'security');
  const ocrTools = TOOLS.filter(t => t.category === 'ocr' || t.category === 'convert' || t.category === 'utility');

  const renderSidebarItem = (tool: typeof TOOLS[0]) => {
    const isActive = activePage === tool.id;
    return (
      <button
        key={tool.id}
        onClick={() => onNavigate(tool.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-150 group relative cursor-pointer ${
          isActive
            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-bold'
            : 'text-zinc-500 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 border border-transparent font-medium'
        }`}
      >
        <DynamicIcon 
          name={tool.icon} 
          className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600'}`} 
        />
        {!sidebarCollapsed && <span className="truncate">{tool.title}</span>}
        
        {/* Tooltip for collapsed mode */}
        {sidebarCollapsed && (
          <div className="absolute left-14 hidden group-hover:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs py-1.5 px-3 rounded-md shadow-xl whitespace-nowrap z-50">
            {tool.title}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={`h-screen w-screen flex overflow-hidden select-none transition-colors duration-200 ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100 dark' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Sidebar */}
      <aside
        className={`h-full border-r flex flex-col transition-all duration-300 z-10 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${
          theme === 'dark' 
            ? 'border-zinc-800 bg-zinc-900/60' 
            : 'border-zinc-200 bg-white'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center border border-zinc-800 dark:border-zinc-300">
              <Icons.FileText className="w-4 h-4 text-white dark:text-zinc-950" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-base tracking-tight text-zinc-800 dark:text-zinc-100">
                {t('brand.name')}
              </span>
            )}
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="mx-auto p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Dashboard Home link */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 group relative cursor-pointer ${
              activePage === 'dashboard'
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-bold'
                : 'text-zinc-500 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 border border-transparent font-semibold'
            }`}
          >
            <Icons.LayoutDashboard className="w-4 h-4 flex-shrink-0 text-zinc-550 dark:text-zinc-400" />
            {!sidebarCollapsed && <span>{t('sidebar.dashboard')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-14 hidden group-hover:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs py-1.5 px-3 rounded-md shadow-xl whitespace-nowrap z-50">
                {t('sidebar.dashboard')}
              </div>
            )}
          </button>

          {/* Group 1: Organize */}
          <div className="space-y-1.5">
            {!sidebarCollapsed && <div className="px-3 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('sidebar.organize')}</div>}
            <div className="space-y-1">
              {organizeTools.map(renderSidebarItem)}
            </div>
          </div>

          {/* Group 2: Edit */}
          <div className="space-y-1.5">
            {!sidebarCollapsed && <div className="px-3 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('sidebar.edit')}</div>}
            <div className="space-y-1">
              {editTools.map(renderSidebarItem)}
            </div>
          </div>

          {/* Group 3: Security */}
          <div className="space-y-1.5">
            {!sidebarCollapsed && <div className="px-3 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('sidebar.security')}</div>}
            <div className="space-y-1">
              {securityTools.map(renderSidebarItem)}
            </div>
          </div>

          {/* Group 4: OCR & Conversions */}
          <div className="space-y-1.5">
            {!sidebarCollapsed && <div className="px-3 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('sidebar.ocr')}</div>}
            <div className="space-y-1">
              {ocrTools.map(renderSidebarItem)}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2.5">
          {/* Theme & Language control toggles */}
          <div className={`flex items-center justify-between gap-2 ${sidebarCollapsed ? 'flex-col' : 'flex-row'}`}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer flex items-center justify-center flex-1"
            >
              {theme === 'dark' ? <Icons.Sun className="w-3.5 h-3.5" /> : <Icons.Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleLanguage}
              title="Switch Language"
              className="px-2 py-1 text-[10px] font-bold uppercase rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer flex-1 text-center"
            >
              {language === 'en' ? 'EN' : 'TR'}
            </button>
          </div>

          <button
            onClick={handleCleanTemp}
            disabled={isCleaning}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isCleaning ? (
              <Icons.Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
            ) : (
              <>
                <Icons.Trash className="w-3 h-3 flex-shrink-0" />
                {!sidebarCollapsed && <span>{t('sidebar.cleanCache')}</span>}
              </>
            )}
          </button>
          {!sidebarCollapsed && (
            <div className="text-[9px] text-zinc-400 dark:text-zinc-650 text-center font-medium">
              v{appVersion} • 100% Offline
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-1 bg-zinc-50 dark:bg-zinc-950">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/10 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
              {t('brand.mode')}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              {t('brand.securityNotice')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold flex items-center gap-1.5">
              <Icons.ShieldAlert className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>{t('brand.privacyNotice')}</span>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <div className="flex-1 overflow-y-auto relative p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
