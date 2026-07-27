import React, { useState } from 'react';
import { X, Copy, Download, Check, Eye, FileText } from 'lucide-react';
import { ChapterItem, FetchSettings } from '../types';
import { formatChapterOutput } from '../services/cleaner';

interface CopyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterItem[];
  settings: FetchSettings;
}

export const CopyPreviewModal: React.FC<CopyPreviewModalProps> = ({
  isOpen,
  onClose,
  chapters,
  settings
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Selected or all success chapters
  const targetChapters = chapters.filter(c => c.selected && c.status === 'success').length > 0
    ? chapters.filter(c => c.selected && c.status === 'success')
    : chapters.filter(c => c.status === 'success');

  const combinedText = targetChapters
    .map(c => formatChapterOutput(c.title, c.content, settings.copyFormat, settings.chapterHeaderTemplate))
    .join('\n\n');

  const totalWords = targetChapters.reduce((acc, c) => acc + c.wordCount, 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const ext = settings.copyFormat === 'markdown' ? 'md' : settings.copyFormat === 'html' ? 'html' : 'txt';
    const mime = settings.copyFormat === 'html' ? 'text/html' : 'text/plain';

    const blob = new Blob([combinedText], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel_chapters_export_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Merged Chapters Preview</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {targetChapters.length} Chapters ({totalWords.toLocaleString()} words)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format: <span className="uppercase font-semibold">{settings.copyFormat}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Preview Box */}
        <div className="p-6">
          <div className="p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 font-mono text-xs max-h-[50vh] overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
            {combinedText || 'No content to display'}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download File</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy All Text'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
