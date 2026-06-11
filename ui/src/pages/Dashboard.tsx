import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageId } from '../types';
import { TOOLS, CATEGORIES } from '../config/tools';
import { DynamicIcon } from '../components/Layout';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { t } = useTranslation();

  // Filter tools based on search and category selection
  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // Framer Motion layout config
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      {/* Hero Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 m-0! leading-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            {t('dashboard.desc')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder={t('dashboard.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-700 rounded-xl outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-650 text-zinc-800 dark:text-zinc-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Icons.X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0 scrollbar-none border-b border-zinc-200 dark:border-zinc-900">
        {CATEGORIES.map(category => {
          const isActive = activeCategory === category.id;
          const dictKey = `categories.${category.id}` as any;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                  : 'bg-transparent text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40'
              }`}
            >
              {t(dictKey) || category.title}
            </button>
          );
        })}
      </div>

      {/* Grid containing Tools */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredTools.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredTools.map(tool => (
                <motion.div
                  key={tool.id}
                  variants={itemVariants}
                  layout
                  className="group"
                >
                  <button
                    onClick={() => onNavigate(tool.id)}
                    className="h-full w-full flex flex-col text-left p-5 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden shadow-sm hover:shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-sm group-hover:scale-[1.01] transition-transform duration-200">
                      <DynamicIcon name={tool.icon} className={`w-4 h-4 ${tool.color}`} />
                    </div>

                    <h3 className="text-zinc-800 dark:text-zinc-200 font-bold text-xs group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                      {t(`tools.${tool.id}.title` as any) || tool.title}
                    </h3>
                    
                    <p className="text-zinc-450 dark:text-zinc-500 text-[11px] mt-1.5 leading-relaxed flex-grow group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                      {t(`tools.${tool.id}.desc` as any) || tool.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 w-full flex items-center justify-end text-[9px] font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 gap-1">
                      <span>{t('dashboard.openTool')}</span>
                      <Icons.ChevronRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-100/10 dark:bg-zinc-900/5 px-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center mb-3 text-zinc-500">
              <Icons.SearchX className="w-5 h-5" />
            </div>
            <h3 className="text-zinc-700 dark:text-zinc-355 font-bold text-xs">{t('dashboard.noTools')}</h3>
            <p className="text-zinc-450 dark:text-zinc-500 text-[11px] mt-1 max-w-sm">
              {t('dashboard.noToolsDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
