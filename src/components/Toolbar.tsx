import React from 'react';
import {
  CheckSquare,
  Square,
  Copy,
  Download,
  Trash2,
  Search,
  ArrowUpDown,
  Filter,
  FileText,
  Code,
  FileCode,
  Eye,
  ListChecks
} from 'lucide-react';
import { ChapterItem } from '../types';

interface ToolbarProps {
  chapters: ChapterItem[];
  selectedCount: number;
  filter: 'all' | 'success' | 'error' | 'selected' | 'unselected';
  setFilter: (f: 'all' | 'success' | 'error' | 'selected' | 'unselected') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'asc' | 'desc' | 'words_desc' | 'words_asc';
  setSortBy: (s: 'asc' | 'desc' | 'words_desc' | 'words_asc') => void;
  copyFormat: 'plaintext' | 'markdown' | 'html';
  setCopyFormat: (f: 'plaintext' | 'markdown' | 'html') => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  onCopySelected: () => void;
  onCopyAll: () => void;
  onDownloadSelected: (format: 'txt' | 'md' | 'json') => void;
  onClearAll: () => void;
  onOpenPreview: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  chapters,
  selectedCount,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  copyFormat,
  setCopyFormat,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onCopySelected,
  onCopyAll,
  onDownloadSelected,
  onClearAll,
  onOpenPreview,
}) => {
  const totalCount = chapters.length;
  const successCount = chapters.filter(c => c.status === 'success').length;
  const failedCount = chapters.filter(c => c.status === 'error').length;

  if (totalCount === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg space-y-3.5 transition-all">
      
      {/* Top Row: Search + Filter Tabs + Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within chapter titles or content..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({totalCount})
          </button>

          <button
            onClick={() => setFilter('success')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'success'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Fetched ({successCount})
          </button>

          {failedCount > 0 && (
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === 'error'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Failed ({failedCount})
            </button>
          )}

          <button
            onClick={() => setFilter('selected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'selected'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Selected ({selectedCount})
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2 self-start lg:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="asc">Sort: Ascending (Chap 1 → N)</option>
            <option value="desc">Sort: Descending (Chap N → 1)</option>
            <option value="words_desc">Sort: Longest Word Count</option>
            <option value="words_asc">Sort: Shortest Word Count</option>
          </select>
        </div>

      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-800/80" />

      {/* Bottom Row: Selection Controls + Copy & Download Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Selection Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSelectAll}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
            <span>Select All</span>
          </button>

          <button
            onClick={onDeselectAll}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
            <span>Deselect All</span>
          </button>

          <button
            onClick={onInvertSelection}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
          >
            <ListChecks className="w-3.5 h-3.5 text-amber-500" />
            <span>Invert</span>
          </button>

          {/* Format Selector */}
          <div className="flex items-center ml-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCopyFormat('plaintext')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                copyFormat === 'plaintext'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="Plain Text Format"
            >
              Plain
            </button>
            <button
              onClick={() => setCopyFormat('markdown')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                copyFormat === 'markdown'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="Markdown Format (# Title)"
            >
              Markdown
            </button>
            <button
              onClick={() => setCopyFormat('html')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                copyFormat === 'html'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="HTML Format (<article><p>...)"
            >
              HTML
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Copy Selected */}
          <button
            onClick={onCopySelected}
            disabled={selectedCount === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white dark:disabled:text-slate-600 text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Selected ({selectedCount})</span>
          </button>

          {/* Copy All */}
          <button
            onClick={onCopyAll}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Copy All</span>
          </button>

          {/* Preview Combined */}
          <button
            onClick={onOpenPreview}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
            title="Preview Combined Output"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Download Options Dropdown */}
          <div className="relative group">
            <button
              onClick={() => onDownloadSelected('txt')}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download TXT</span>
            </button>
          </div>

          {/* Clear All */}
          <button
            onClick={onClearAll}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all"
            title="Clear All Chapters"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
};
