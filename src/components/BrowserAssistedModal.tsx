import React, { useState } from 'react';
import { X, ExternalLink, Globe, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Clipboard, Play } from 'lucide-react';
import { FetchSettings, ChapterItem } from '../types';
import { parseHtmlFromBrowser } from '../services/api';

interface BrowserAssistedModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  settings: FetchSettings;
  onSuccess: (chapter: Partial<ChapterItem>) => void;
}

export const BrowserAssistedModal: React.FC<BrowserAssistedModalProps> = ({
  isOpen,
  onClose,
  url,
  settings,
  onSuccess
}) => {
  const [targetUrl, setTargetUrl] = useState(url);
  const [htmlInput, setHtmlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenInBrowser = () => {
    window.open(targetUrl || url, '_blank', 'noopener,noreferrer');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setHtmlInput(text);
        setErrorMsg(null);
      }
    } catch (err) {
      setErrorMsg('Clipboard permission denied. Please paste HTML source manually using Ctrl+V / Cmd+V.');
    }
  };

  const handleParseBrowserHtml = async () => {
    if (!htmlInput.trim()) {
      setErrorMsg('Please paste the rendered HTML source from your browser session.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const result = await parseHtmlFromBrowser(htmlInput, targetUrl || url, settings);
    setIsProcessing(false);

    if (result.success) {
      onSuccess({
        title: result.title,
        content: result.content,
        rawContent: result.rawContent,
        novelTitle: result.novelTitle,
        chapterNum: result.chapterNum,
        nextUrl: result.nextUrl,
        prevUrl: result.prevUrl,
        wordCount: result.wordCount,
        charCount: result.charCount,
        parserName: result.parserName || 'Generic Extractor',
        status: 'success',
        diagnostics: result.diagnostics
      });
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to extract content from provided HTML source.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/60 dark:bg-indigo-950/30">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Browser-Assisted Fetch</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Interactive Mode
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extract chapter source directly from your verified browser session
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200">
          
          {/* Workflow Steps Indicator */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="block font-bold text-indigo-600 dark:text-indigo-400">Step 1</span>
              <span className="text-[11px] text-slate-500">Open Page in Tab</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="block font-bold text-indigo-600 dark:text-indigo-400">Step 2</span>
              <span className="text-[11px] text-slate-500">Pass Security Check</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="block font-bold text-indigo-600 dark:text-indigo-400">Step 3</span>
              <span className="text-[11px] text-slate-500">Parse Rendered HTML</span>
            </div>
          </div>

          {/* Target URL Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Novel Page URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={handleOpenInBrowser}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
              >
                <span>Open Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rendered HTML Paste Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paste Page Source Code (HTML)
              </label>

              <button
                onClick={handlePasteClipboard}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste from Clipboard</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={htmlInput}
              onChange={(e) => {
                setHtmlInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Right click chapter page in browser → 'View Page Source' or inspect element → Copy HTML source code and paste here..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error Message display */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Protection tip banner */}
          <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              Once you complete any CAPTCHA or security verification in your browser tab, copy the page source or DOM content and paste it above. Our site parsers will automatically clean and format the chapter text!
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleParseBrowserHtml}
            disabled={isProcessing || !htmlInput.trim()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isProcessing ? 'Processing HTML...' : 'Parse & Extract Chapter'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
