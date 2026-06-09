import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface ToolCategory {
  name: string;
  icon: React.ReactNode;
  tools: { name: string; label: string; path: string; icon: React.ReactNode }[];
}

const categories: ToolCategory[] = [
  {
    name: 'Organize',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
    tools: [
      { name: 'Merge PDF', label: 'Merge PDF', path: '/organize/merge', icon: '🔗' },
      { name: 'Split PDF', label: 'Split PDF', path: '/organize/split', icon: '✂️' },
      { name: 'Remove Pages', label: 'Remove Pages', path: '/organize/remove', icon: '🗑️' },
      { name: 'Extract Pages', label: 'Extract Pages', path: '/organize/extract', icon: '📄' },
      { name: 'Organize Pages', label: 'Organize Pages', path: '/organize/organize', icon: '🔄' },
      { name: 'Compress PDF', label: 'Compress PDF', path: '/organize/compress', icon: '📦' },
    ],
  },
  {
    name: 'Edit',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
    tools: [
      { name: 'Rotate PDF', label: 'Rotate PDF', path: '/edit/rotate', icon: '🔃' },
      { name: 'Watermark', label: 'Watermark', path: '/edit/watermark', icon: '📝' },
      { name: 'Page Numbers', label: 'Page Numbers', path: '/edit/page-numbers', icon: '🔢' },
      { name: 'Crop PDF', label: 'Crop PDF', path: '/edit/crop', icon: '✂️' },
    ],
  },
  {
    name: 'Security',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    ),
    tools: [
      { name: 'Protect PDF', label: 'Protect PDF', path: '/security/protect', icon: '🔒' },
      { name: 'Unlock PDF', label: 'Unlock PDF', path: '/security/unlock', icon: '🔓' },
    ],
  },
  {
    name: 'OCR',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
    tools: [
      { name: 'OCR PDF', label: 'OCR PDF', path: '/ocr/pdf', icon: '🔤' },
      { name: 'Repair PDF', label: 'Repair PDF', path: '/ocr/repair', icon: '🔧' },
    ],
  },
  {
    name: 'Convert',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
      </svg>
    ),
    tools: [
      { name: 'Convert PDF', label: 'Convert PDF', path: '/convert/pdf', icon: '🔄' },
      { name: 'PDF Info', label: 'PDF Info', path: '/convert/info', icon: 'ℹ️' },
      { name: 'PDF Thumbnails', label: 'PDF Thumbnails', path: '/convert/thumbnails', icon: '🖼️' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useAppStore();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map((c) => c.name));

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  return (
    <div className="w-64 h-screen bg-surface border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-text-primary">LocalPdfToolkit</h1>
            <p className="text-xs text-text-secondary">v0.1.0</p>
          </div>
        </div>
      </div>

      {/* Tool Categories */}
      <nav className="flex-1 overflow-y-auto p-3">
        {categories.map((category) => (
          <div key={category.name} className="mb-2">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg transition-colors text-text-secondary hover:text-text-primary"
            >
              <div className="flex items-center gap-2">
                {category.icon}
                <span className="font-medium text-sm">{category.name}</span>
              </div>
              <motion.svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                animate={{ rotate: expandedCategories.includes(category.name) ? 90 : 0 }}
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </motion.svg>
            </button>

            <AnimatePresence>
              {expandedCategories.includes(category.name) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-1 space-y-1">
                    {category.tools.map((tool) => (
                      <li key={tool.path}>
                        <Link
                          to={tool.path}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                            location.pathname === tool.path
                              ? 'bg-primary/10 text-primary border-l-2 border-primary pl-4'
                              : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                          )}
                        >
                          <span>{tool.icon}</span>
                          <span>{tool.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-bg border border-border text-text-secondary hover:text-text-primary transition-colors"
        >
          {theme === 'light' ? (
            <>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm5 1a1 1 0 010 2h-1a1 1 0 110-2h1zM3 9a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zm11 6a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM5.05 5.05a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm8.486 8.486a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM5.05 14.95a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zm8.486-8.486a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a5 5 0 100 10 5 5 0 000-10z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Light Mode</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span className="text-sm">Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}