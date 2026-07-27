import React, { useRef, useState } from 'react';
import { X, Copy, Check, Download, FileText, CheckSquare, Sparkles } from 'lucide-react';
import { downloadTextFile, sanitizeTextForCopy } from '../utils/copyUtils';

interface CopyFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  onToast?: (msg: string) => void;
}

export const CopyFallbackModal: React.FC<CopyFallbackModalProps> = ({
  isOpen,
  onClose,
  title,
  text,
  onToast
}) => {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const cleanText = sanitizeTextForCopy(text);

  const handleSelectAll = () => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
      textAreaRef.current.setSelectionRange(0, textAreaRef.current.value.length);
      setSelected(true);
      if (onToast) onToast('Text selected! Tap Copy or Ctrl+C / Cmd+C');
      setTimeout(() => setSelected(false), 2000);
    }
  };

  const handleManualCopy = () => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
      try {
        const success = document.execCommand('copy');
        if (success) {
          setCopied(true);
          if (onToast) onToast('✓ Chapter copied successfully');
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      } catch {
        // Fallback
      }
    }
    if (onToast) onToast('Please long-press the selected text below and choose "Copy"');
  };

  const handleDownload = () => {
    const filename = `${title.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_')}_chapter.txt`;
    downloadTextFile(filename, cleanText);
    if (onToast) onToast(`✓ Downloaded ${filename}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                Copy Chapter Text
              </h3>
              <p className="text-[11px] text-slate-500">
                Android Clipboard Assistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            If automatic clipboard access was restricted by your browser, use the options below to copy or download the chapter text:
          </p>

          <textarea
            ref={textAreaRef}
            readOnly
            rows={10}
            value={cleanText}
            onClick={handleSelectAll}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-indigo-500 selection:bg-indigo-500 selection:text-white"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                {selected ? <Check className="w-4 h-4 text-emerald-500" /> : <CheckSquare className="w-4 h-4" />}
                <span>Select All</span>
              </button>

              <button
                onClick={handleManualCopy}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Selected Text'}</span>
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download .TXT File</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
