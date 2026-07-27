import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Trash2,
  ExternalLink,
  AlertCircle,
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Activity,
  Globe,
  Sparkles
} from 'lucide-react';
import { ChapterItem, FetchSettings } from '../types';
import { formatChapterOutput } from '../services/cleaner';
import { FetchDiagnosticsModal } from './FetchDiagnosticsModal';
import { BrowserAssistedModal } from './BrowserAssistedModal';
import { CopyFallbackModal } from './CopyFallbackModal';
import { performCopyToClipboard } from '../utils/copyUtils';

interface ChapterCardProps {
  chapter: ChapterItem;
  settings: FetchSettings;
  searchQuery?: string;
  onToggleSelect: (id: string) => void;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateChapter?: (id: string, updated: Partial<ChapterItem>) => void;
  onToast?: (msg: string) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  settings,
  searchQuery,
  onToggleSelect,
  onRefresh,
  onDelete,
  onUpdateChapter,
  onToast
}) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isBrowserModalOpen, setIsBrowserModalOpen] = useState(false);
  const [isCopyFallbackOpen, setIsCopyFallbackOpen] = useState(false);

  // Format content for display
  const formattedText = formatChapterOutput(
    chapter.title,
    chapter.content,
    settings.copyFormat,
    settings.chapterHeaderTemplate
  );

  const handleCopy = async () => {
    const res = await performCopyToClipboard(formattedText);
    if (res.success) {
      setCopied(true);
      if (onToast) onToast('✓ Chapter copied successfully');
      setTimeout(() => setCopied(false), 2000);
    } else {
      setIsCopyFallbackOpen(true);
      if (onToast) onToast('✗ Automatic copy restricted. Use the copy assistant below.');
    }
  };

  const isProtectionDetected = chapter.diagnostics?.protectionDetected || 
    (chapter.errorReason && chapter.errorReason.toLowerCase().includes('website protection'));

  // Font size mapping
  const fontSizeClasses = {
    sm: 'text-xs leading-relaxed',
    md: 'text-sm leading-relaxed',
    lg: 'text-base leading-relaxed',
    xl: 'text-lg leading-loose'
  }[settings.fontSize || 'md'];

  // Search highlighting helper
  const renderHighlightedContent = (text: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return text;
    }

    const query = searchQuery.trim();
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));

    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={index} className="bg-amber-300 dark:bg-amber-500/60 text-slate-900 dark:text-white px-0.5 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return (
    <>
      <div
        className={`group rounded-2xl border transition-all duration-200 overflow-hidden ${
          chapter.selected
            ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500'
            : chapter.status === 'error'
            ? 'bg-rose-50/50 dark:bg-slate-900 border-rose-300 dark:border-rose-900/60 shadow-md'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        
        {/* Chapter Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800/80">
          
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            
            {/* Multi-Select Checkbox */}
            <input
              type="checkbox"
              checked={chapter.selected}
              onChange={() => onToggleSelect(chapter.id)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />

            {/* Chapter Title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {chapter.title || 'Untitled Chapter'}
                </h3>

                {chapter.novelTitle && (
                  <span className="hidden md:inline-block text-xs font-normal text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    ({chapter.novelTitle})
                  </span>
                )}
              </div>

              {/* Sub-info Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
                  {chapter.parserName || 'Generic Extractor'}
                </span>

                {chapter.status === 'success' && (
                  <>
                    <span>•</span>
                    <span>{chapter.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>{chapter.charCount.toLocaleString()} chars</span>
                  </>
                )}

                {chapter.status === 'error' && (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Failed ({chapter.errorReason || 'Error'})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Action Buttons */}
          <div className="flex items-center space-x-1.5">
            
            {/* View Diagnostics Button for Failed Requests */}
            {chapter.status === 'error' && (
              <button
                onClick={() => setIsDiagnosticsOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-colors flex items-center space-x-1"
                title="View Detailed Error Diagnostics Report"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>
            )}

            {/* Source Link */}
            <a
              href={chapter.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Open Original Web Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Re-fetch / Refresh Chapter */}
            <button
              onClick={() => onRefresh(chapter.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Re-fetch / Refresh Chapter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Individual Copy Chapter */}
            {chapter.status === 'success' && (
              <button
                onClick={handleCopy}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            )}

            {/* Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title={collapsed ? 'Expand Content' : 'Collapse Content'}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {/* Delete Chapter */}
            <button
              onClick={() => onDelete(chapter.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
              title="Remove Chapter"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>

        {/* Main Chapter Content Box */}
        {!collapsed && (
          <div className="p-5 sm:p-6 space-y-4">
            
            {chapter.status === 'success' ? (
              <div className="relative">
                
                {/* Output Box as requested in spec with separator line */}
                <div className="font-mono text-xs text-slate-400 mb-2 select-none">
                  --------------------------------
                </div>

                <div className={`whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 ${fontSizeClasses}`}>
                  {renderHighlightedContent(chapter.content)}
                </div>

                <div className="font-mono text-xs text-slate-400 mt-4 select-none">
                  --------------------------------
                </div>

              </div>
            ) : chapter.status === 'fetching' ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Fetching chapter content from web...</p>
              </div>
            ) : isProtectionDetected ? (
              /* Protection Page Detected Box with Prompt & Action */
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Website Protection Detected</span>
                  </div>

                  <button
                    onClick={() => setIsDiagnosticsOpen(true)}
                    className="text-[11px] underline font-mono text-amber-700 dark:text-amber-300 hover:text-amber-900"
                  >
                    View Error Report
                  </button>
                </div>

                <p className="text-xs font-medium">
                  Website protection detected. This website requires a browser session before chapter content can be extracted.
                </p>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => setIsBrowserModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Browser-Assisted Fetch</span>
                  </button>

                  <button
                    onClick={() => onRefresh(chapter.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Standard</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Chapter Extraction Failed</span>
                  </div>

                  <button
                    onClick={() => setIsDiagnosticsOpen(true)}
                    className="text-[11px] underline font-mono text-rose-700 dark:text-rose-300 hover:text-rose-900"
                  >
                    View Error Report
                  </button>
                </div>
                <p className="text-xs font-mono text-rose-700 dark:text-rose-300">
                  Reason: {chapter.errorReason || 'Unknown extraction error'}
                </p>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                  URL: {chapter.url}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => onRefresh(chapter.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Chapter Fetch</span>
                  </button>

                  <button
                    onClick={() => setIsBrowserModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Browser-Assisted Fetch</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Diagnostics Modal */}
      <FetchDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        diagnostics={chapter.diagnostics}
        url={chapter.url}
        errorReason={chapter.errorReason}
        onRetry={() => onRefresh(chapter.id)}
        onBrowserAssistedFetch={() => setIsBrowserModalOpen(true)}
      />

      {/* Browser Assisted Fetch Modal */}
      <BrowserAssistedModal
        isOpen={isBrowserModalOpen}
        onClose={() => setIsBrowserModalOpen(false)}
        url={chapter.url}
        settings={settings}
        onSuccess={(updatedFields) => {
          if (onUpdateChapter) {
            onUpdateChapter(chapter.id, updatedFields);
          }
        }}
      />

      {/* Android Copy Fallback Modal */}
      <CopyFallbackModal
        isOpen={isCopyFallbackOpen}
        onClose={() => setIsCopyFallbackOpen(false)}
        title={chapter.title}
        text={formattedText}
        onToast={onToast}
      />
    </>
  );
};

