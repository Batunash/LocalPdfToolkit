import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History } from 'lucide-react';
import { TOOLS, type ToolDefinition } from '../config/tools';
import { useTranslation } from '../i18n';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (pageId: string) => void;
}

interface RecentFile {
  id: string;
  path: string;
  timestamp: number;
  toolUsed: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { t } = useTranslation();

  // Recent files from localStorage
  const recentFiles: RecentFile[] = useMemo(() => {
    const stored = localStorage.getItem('localpdf_recent_files');
    return stored ? JSON.parse(stored) : [];
  }, []);

  const toolResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return TOOLS.filter(tool =>
      tool.title.toLowerCase().includes(q) ||
      tool.description?.toLowerCase().includes(q) ||
      tool.id.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const recentResults = useMemo(() => {
    if (!query.trim()) return recentFiles.slice(0, 4);
    const q = query.toLowerCase();
    return recentFiles
      .filter(f =>
        f.path.toLowerCase().includes(q) ||
        f.toolUsed.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [query, recentFiles]);

  const allResults = useMemo(() => {
    if (!query.trim()) {
      return recentFiles.slice(0, 5).map(f => ({ type: 'recent' as const, data: f }));
    }
    return [
      ...toolResults.map(tool => ({ type: 'tool' as const, data: tool })),
      ...recentResults.map(file => ({ type: 'recent' as const, data: file })),
    ];
  }, [query, toolResults, recentResults, recentFiles]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) {
        if (e.ctrlKey && e.key === 'k') {
          e.preventDefault();
        }
        return;
      }
      if (e.key === 'Escape') {
        onClose();
        setQuery('');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = allResults[selectedIndex];
        if (item?.type === 'tool') {
          onNavigate(item.data.id);
          onClose();
          setQuery('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, allResults, selectedIndex, onNavigate, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [open]);

  const handleSelectTool = (tool: ToolDefinition) => {
    onNavigate(tool.id);
    onClose();
    setQuery('');
  };

  const handleSelectRecent = (_file: RecentFile) => {
    onNavigate('dashboard');
    onClose();
    setQuery('');
  };

  const renderIcon = (type: 'tool' | 'recent') => {
    if (type === 'tool') {
      return <Search className="w-4 h-4 text-zinc-400" />;
    }
    return <History className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={(changed) => {
          if (!changed) return;
          onClose();
          setQuery('');
        }}>
          <DialogOverlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />
          <DialogContent
            className="fixed top-20 left-1/2 -translate-x-1/2 w-[560px] max-h-[400px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-0"
            onPointerDownOutside={(e) => {
              e.preventDefault();
              onClose();
            }}
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('commandPalette.placeholder')}
                className="flex-1 bg-transparent border-0 outline-none text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400"
              />
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">Enter</kbd>
                <span>select</span>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {allResults.length === 0 && query.trim() && (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  {t('commandPalette.noResults')}
                </div>
              )}

              {allResults.length === 0 && !query.trim() && (
                <div className="px-4 py-4 text-center text-sm text-zinc-400">
                  {t('commandPalette.noRecent')}
                </div>
              )}

              {allResults.map((item, index) => (
                <motion.button
                  key={`${item.type}-${index}`}
                  onClick={() => item.type === 'tool'
                    ? handleSelectTool(item.data)
                    : handleSelectRecent(item.data)
                  }
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    index === selectedIndex
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {renderIcon(item.type)}
                  <div className="flex-1 text-left">
                    <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {item.type === 'tool' ? item.data.title : item.data.path}
                    </div>
                    {item.type === 'recent' && (
                      <div className="text-xs text-zinc-400">
                        Used {item.data.toolUsed}
                      </div>
                    )}
                  </div>
                  {item.type === 'tool' && (
                    <span className="text-xs text-zinc-400">{item.data.description}</span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span><kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">↑↓</kbd> navigate</span>
                <span><kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">Esc</kbd> close</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};