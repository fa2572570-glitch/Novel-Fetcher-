import React from 'react';
import { BookOpen, Settings, History, Globe, Sparkles, Sun, Moon, Coffee } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light' | 'sepia';
  setTheme: (t: 'dark' | 'light' | 'sepia') => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenParsersModal: () => void;
  totalChapters: number;
  successChapters: number;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  onOpenSettings,
  onOpenHistory,
  onOpenParsersModal,
  totalChapters,
  successChapters,
  historyCount
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* App Title & Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Novel Chapter Fetcher
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50">
                v2.0 Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Extractor for web novels, clean chapters & multi-select copy engine
            </p>
          </div>
        </div>

        {/* Right Action Icons & Badge Stats */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Active Chapters Stats Pill */}
          {totalChapters > 0 && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{successChapters} / {totalChapters} Fetched</span>
            </div>
          )}

          {/* Supported Parsers Button */}
          <button
            onClick={onOpenParsersModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="View Supported Website Parsers"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Parsers</span>
          </button>

          {/* History Sessions Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="View Saved Sessions & History"
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'light'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'dark'
                  ? 'bg-slate-700 text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Dark Obsidian Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'sepia'
                  ? 'bg-amber-100 text-amber-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Sepia Reading Mode"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Extraction & Retry Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
