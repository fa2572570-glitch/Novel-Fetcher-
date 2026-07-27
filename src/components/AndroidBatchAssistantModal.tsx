import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  Clipboard,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Square,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ChapterItem, FetchSettings } from '../types';
import { parseHtmlFromBrowser } from '../services/api';
import { unescapeHtmlSource } from '../services/cleaner';

export interface BatchSessionState {
  active: boolean;
  paused: boolean;
  currentUrl: string;
  nextUrl?: string;
  prevUrl?: string;
  chapterNum?: number;
  importedCount: number;
  failedCount: number;
  targetCount: number; // 1, 10, 25, 50, 9999
  startTime: number;
  lastImportTime?: number;
  importedChapters: ChapterItem[];
}

interface AndroidBatchAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl: string;
  initialNextUrl?: string;
  initialChapterNum?: number;
  targetCount: number; // 1, 10, 25, 50, 9999
  delaySeconds: number; // 1-5s
  settings: FetchSettings;
  onAddChapter: (chapter: ChapterItem) => void;
  onToast: (msg: string) => void;
}

const LOCAL_STORAGE_BATCH_KEY = 'novelfetch_android_batch_session';

export const AndroidBatchAssistantModal: React.FC<AndroidBatchAssistantModalProps> = ({
  isOpen,
  onClose,
  initialUrl,
  initialNextUrl,
  initialChapterNum,
  targetCount,
  delaySeconds,
  settings,
  onAddChapter,
  onToast
}) => {
  const [session, setSession] = useState<BatchSessionState>(() => {
    // Try restoring saved batch session if available
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BATCH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.active) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    return {
      active: true,
      paused: false,
      currentUrl: initialUrl,
      nextUrl: initialNextUrl,
      chapterNum: initialChapterNum,
      importedCount: 0,
      failedCount: 0,
      targetCount: targetCount || 10,
      startTime: Date.now(),
      importedChapters: []
    };
  });

  const [manualInputHtml, setManualInputHtml] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to fetch next chapter');
  const [lastError, setLastError] = useState<string | null>(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  // Sync initial parameters when opening modal afresh
  useEffect(() => {
    if (isOpen && initialUrl && (!session.active || session.importedCount === 0)) {
      const newSession: BatchSessionState = {
        active: true,
        paused: false,
        currentUrl: initialUrl,
        nextUrl: initialNextUrl,
        chapterNum: initialChapterNum,
        importedCount: 0,
        failedCount: 0,
        targetCount: targetCount || 10,
        startTime: Date.now(),
        importedChapters: []
      };
      setSession(newSession);
      try {
        localStorage.setItem(LOCAL_STORAGE_BATCH_KEY, JSON.stringify(newSession));
      } catch {}
    }
  }, [isOpen, initialUrl, initialNextUrl, initialChapterNum, targetCount]);

  // Persist session to localStorage
  const saveSession = (updatedSession: BatchSessionState) => {
    setSession(updatedSession);
    try {
      localStorage.setItem(LOCAL_STORAGE_BATCH_KEY, JSON.stringify(updatedSession));
    } catch {}
  };

  // Auto-detect Clipboard HTML on window focus
  useEffect(() => {
    if (!isOpen || !session.active || session.paused || !autoDetectEnabled) return;

    const handleFocus = async () => {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
          const clipText = await navigator.clipboard.readText();
          if (clipText && clipText.trim().length > 100) {
            // Check if it looks like HTML or novel chapter source
            const unescaped = unescapeHtmlSource(clipText);
            if (
              unescaped.includes('<') && unescaped.includes('>') &&
              (unescaped.includes('html') || unescaped.includes('div') || unescaped.includes('p') || unescaped.includes('txtnav'))
            ) {
              setStatusMessage('Detected copied HTML from clipboard! Auto-parsing chapter...');
              await handleProcessHtml(clipText);
            }
          }
        }
      } catch {
        // Clipboard read permission might be denied, manual Paste & Continue available
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOpen, session.active, session.paused, autoDetectEnabled]);

  if (!isOpen) return null;

  const targetDisplay = session.targetCount >= 999 ? 'Until Stopped' : `${session.targetCount} Chapters`;
  const remainingCount = session.targetCount >= 999 ? 'Infinity' : Math.max(0, session.targetCount - session.importedCount);
  const progressPercent = session.targetCount >= 999 
    ? Math.min(100, session.importedCount * 5)
    : Math.min(100, Math.round((session.importedCount / session.targetCount) * 100));

  // Estimated remaining time calculation
  const avgTimePerChapterSec = session.importedCount > 0 
    ? Math.max(3, Math.round((Date.now() - session.startTime) / (session.importedCount * 1000)))
    : delaySeconds + 5;
  const estimatedRemainingSec = typeof remainingCount === 'number' ? remainingCount * avgTimePerChapterSec : 0;
  const estRemainingFormatted = session.targetCount >= 999 
    ? 'Dynamic'
    : `${Math.floor(estimatedRemainingSec / 60)}m ${estimatedRemainingSec % 60}s`;

  // Action 1: Open Chapter in Browser
  const handleOpenNextChapter = () => {
    const urlToOpen = session.nextUrl || session.currentUrl;
    if (!urlToOpen) {
      onToast('No chapter URL available');
      return;
    }
    window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    setStatusMessage(`Opened ${urlToOpen} in browser. Complete any Cloudflare check, copy page source, then tap "Paste & Continue".`);
  };

  // Action 2: Process Raw HTML (from clipboard or manual paste)
  const handleProcessHtml = async (rawHtmlInput?: string) => {
    let sourceHtml = rawHtmlInput || manualInputHtml;

    // If no direct input passed, attempt reading clipboard
    if (!sourceHtml && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        sourceHtml = await navigator.clipboard.readText();
      } catch {
        // Permission required
      }
    }

    if (!sourceHtml || sourceHtml.trim().length === 0) {
      setLastError('No HTML found. Please copy the page source or paste HTML into the box below.');
      onToast('✗ Clipboard empty or no HTML provided');
      return;
    }

    setIsProcessing(true);
    setLastError(null);
    setStatusMessage('Parsing chapter content...');

    try {
      const activeUrl = session.nextUrl || session.currentUrl;
      const res = await parseHtmlFromBrowser(sourceHtml, activeUrl, settings.customCleaningRules);

      if (!res.success || !res.content) {
        const err = res.error || 'Failed to extract chapter text from provided HTML';
        setLastError(err);
        onToast(`✗ ${err}`);
        setIsProcessing(false);
        return;
      }

      // Construct Chapter Item
      const newChapter: ChapterItem = {
        id: `chap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url: res.url || activeUrl,
        title: res.title || `Chapter ${session.importedCount + 1}`,
        content: res.content,
        rawContent: res.rawContent,
        novelTitle: res.novelTitle,
        chapterNum: res.chapterNum || (session.chapterNum ? session.chapterNum + 1 : session.importedCount + 1),
        fetchedAt: Date.now(),
        status: 'success',
        selected: true,
        wordCount: res.wordCount || res.content.length,
        charCount: res.charCount || res.content.length,
        parserName: res.parserName || 'Browser Assistant',
        nextUrl: res.nextUrl,
        prevUrl: res.prevUrl
      };

      // Add chapter to global state immediately
      onAddChapter(newChapter);

      // Update local batch session
      const nextCount = session.importedCount + 1;
      const isFinished = session.targetCount < 999 && nextCount >= session.targetCount;

      const updatedSession: BatchSessionState = {
        ...session,
        importedCount: nextCount,
        currentUrl: activeUrl,
        nextUrl: res.nextUrl || undefined,
        chapterNum: newChapter.chapterNum,
        lastImportTime: Date.now(),
        active: !isFinished,
        importedChapters: [...session.importedChapters, newChapter]
      };

      saveSession(updatedSession);
      setManualInputHtml('');
      onToast(`✓ Chapter ${newChapter.chapterNum || nextCount} imported successfully!`);

      if (isFinished) {
        setStatusMessage(`Batch Complete! Imported ${nextCount} chapters.`);
      } else {
        setStatusMessage(`Saved Chapter ${newChapter.chapterNum || nextCount}. Next: ${res.nextUrl ? 'Ready for next chapter' : 'No next URL found'}`);
      }

    } catch (err: any) {
      const errMsg = err.message || 'Error processing HTML source';
      setLastError(errMsg);
      onToast(`✗ ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Controls: Skip, Pause, Resume, Stop, Reset
  const handleSkipChapter = () => {
    if (!session.nextUrl) {
      onToast('No next URL to skip to');
      return;
    }

    const updated: BatchSessionState = {
      ...session,
      failedCount: session.failedCount + 1,
      currentUrl: session.nextUrl,
      nextUrl: undefined
    };
    saveSession(updated);
    setStatusMessage('Skipped chapter. Tap "Open Next Chapter" or paste HTML for next link.');
    onToast('Skipped chapter');
  };

  const handleTogglePause = () => {
    const updated = { ...session, paused: !session.paused };
    saveSession(updated);
    onToast(updated.paused ? 'Batch Paused' : 'Batch Resumed');
  };

  const handleStopBatch = () => {
    const updated = { ...session, active: false };
    saveSession(updated);
    localStorage.removeItem(LOCAL_STORAGE_BATCH_KEY);
    onToast('Batch Stopped');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Android Browser Batch Assistant</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  Cloudflare Bypass
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mises, Kiwi, Chrome & Edge Android Compatibility Engine
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
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Progress Overview Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Import Progress: {session.importedCount} / {targetDisplay}</span>
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">{progressPercent}%</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Imported</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{session.importedCount}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Remaining</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{remainingCount}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Est. Time</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{estRemainingFormatted}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Skipped/Failed</span>
                <span className="font-bold text-rose-500 text-sm">{session.failedCount}</span>
              </div>
            </div>
          </div>

          {/* Current URL & Status Message */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Next Target URL:</span>
              </span>
              <span className="font-mono text-[11px] truncate max-w-xs text-indigo-700 dark:text-indigo-300">
                {session.nextUrl || session.currentUrl}
              </span>
            </div>
            <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300 leading-relaxed">
              {statusMessage}
            </p>
          </div>

          {/* Primary Action Workflow (Android Mode) */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Step-by-Step Batch Ingestion Workflow
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 Button */}
              <button
                onClick={handleOpenNextChapter}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>1. Open Next Chapter</span>
              </button>

              {/* Step 2 Button */}
              <button
                onClick={() => handleProcessHtml()}
                disabled={isProcessing}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Clipboard className="w-4 h-4" />
                )}
                <span>2. Paste & Continue</span>
              </button>
            </div>

            {/* Auto Clipboard Detection Checkbox */}
            <div className="flex items-center space-x-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                id="autoDetectCheck"
                checked={autoDetectEnabled}
                onChange={(e) => setAutoDetectEnabled(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="autoDetectCheck" className="cursor-pointer select-none">
                Automatically parse clipboard HTML when switching back to this tab
              </label>
            </div>
          </div>

          {/* Optional Manual HTML Input Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Or Paste Rendered Page HTML Manually:
            </label>
            <textarea
              rows={3}
              value={manualInputHtml}
              onChange={(e) => setManualInputHtml(e.target.value)}
              placeholder="Paste HTML or raw source code here..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Last Error Box if any */}
          {lastError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Parse Issue:</p>
                <p>{lastError}</p>
              </div>
            </div>
          )}

          {/* Control Bar: Skip, Pause/Resume, Stop */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSkipChapter}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1 transition-all"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip Chapter</span>
              </button>

              <button
                onClick={handleTogglePause}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1 transition-all"
              >
                {session.paused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                <span>{session.paused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>

            <button
              onClick={handleStopBatch}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop Batch</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
