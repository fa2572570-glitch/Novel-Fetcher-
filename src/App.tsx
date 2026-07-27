import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { FetchInputPanel } from './components/FetchInputPanel';
import { BatchProgressCard } from './components/BatchProgressCard';
import { Toolbar } from './components/Toolbar';
import { ChapterCard } from './components/ChapterCard';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SupportedParsersModal } from './components/SupportedParsersModal';
import { CopyPreviewModal } from './components/CopyPreviewModal';

import {
  ChapterItem,
  FetchSettings,
  BatchStats,
  SavedSession,
  ParserInfo,
  FetchBatchRequest
} from './types';
import {
  loadSettings,
  saveSettings,
  loadCurrentSession,
  saveCurrentSession,
  loadSavedHistory,
  saveSessionToHistory,
  deleteHistorySession,
  DEFAULT_SETTINGS
} from './services/storage';
import { fetchChapterFromApi, fetchParsersList } from './services/api';
import { formatChapterOutput } from './services/cleaner';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  // Theme & Preferences
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [settings, setSettings] = useState<FetchSettings>(loadSettings);

  // Chapter Collection State
  const [chapters, setChapters] = useState<ChapterItem[]>(loadCurrentSession);

  // Filters & Searching & Sorting
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'selected' | 'unselected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'asc' | 'desc' | 'words_desc' | 'words_asc'>('asc');

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isParsersOpen, setIsParsersOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Parsers List & Saved History
  const [parsers, setParsers] = useState<ParserInfo[]>([]);
  const [savedHistory, setSavedHistory] = useState<SavedSession[]>(loadSavedHistory);

  // Batch Queue Engine State
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const cancelRequestedRef = useRef(false);

  const [batchStats, setBatchStats] = useState<BatchStats>({
    total: 0,
    pending: 0,
    fetching: 0,
    success: 0,
    failed: 0,
    startTime: null,
    endTime: null,
    elapsedTimeMs: 0,
    avgSpeedChapPerSec: 0,
    estRemainingTimeMs: 0,
    currentActiveUrls: []
  });

  // Apply Theme Classes to html/body
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'sepia-mode');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('sepia-mode');
    }
  }, [theme]);

  // Save chapters to localStorage on update
  useEffect(() => {
    saveCurrentSession(chapters);
  }, [chapters]);

  // Load supported parsers list on startup
  useEffect(() => {
    fetchParsersList().then(setParsers);
  }, []);

  // Save settings when changed
  const handleUpdateSettings = (newSettings: FetchSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Toast / Notification banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Universal Batch Fetch Queue Engine
   */
  const startBatchFetch = async (request: string[] | FetchBatchRequest) => {
    let urls: string[] = [];

    if (Array.isArray(request)) {
      urls = request;
    } else if (request.mode === 'urls' || request.mode === 'placeholder') {
      urls = request.urls || [];
    } else if (request.mode === 'follow_next' && request.firstUrl) {
      // Handled sequentially below
      urls = [request.firstUrl];
    }

    if (urls.length === 0) return;

    cancelRequestedRef.current = false;
    setIsPaused(false);
    setIsFetchingBatch(true);

    const startTime = Date.now();
    const isFollowNextMode = !Array.isArray(request) && request.mode === 'follow_next';
    const targetChapterCount = isFollowNextMode && request.startChapter && request.endChapter
      ? (request.endChapter - request.startChapter + 1)
      : urls.length;

    // Initialize Batch Telemetry Stats
    setBatchStats({
      total: targetChapterCount,
      pending: targetChapterCount,
      fetching: 0,
      success: 0,
      failed: 0,
      startTime,
      endTime: null,
      elapsedTimeMs: 0,
      avgSpeedChapPerSec: 0,
      estRemainingTimeMs: 0,
      currentActiveUrls: []
    });

    let completedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    if (isFollowNextMode && !Array.isArray(request) && request.firstUrl) {
      // METHOD 2: Follow Next Chapter Links Sequential Crawler Engine
      let currentUrl: string | undefined = request.firstUrl;
      let chapterIndex = request.startChapter || 1;

      while (currentUrl && completedCount < targetChapterCount) {
        if (cancelRequestedRef.current) break;

        while (isPausedRef.current && !cancelRequestedRef.current) {
          await new Promise(r => setTimeout(r, 200));
        }

        if (cancelRequestedRef.current) break;

        const chapId = 'chap_' + Date.now() + '_' + completedCount + '_' + Math.random().toString(36).substr(2, 4);
        
        // Add stub to UI
        const stubItem: ChapterItem = {
          id: chapId,
          url: currentUrl,
          title: `Chapter ${chapterIndex}`,
          content: '',
          status: 'fetching',
          wordCount: 0,
          charCount: 0,
          parserName: 'Detecting...',
          selected: true,
          chapterNum: chapterIndex
        };

        setChapters(prev => [...prev, stubItem]);

        setBatchStats(prev => ({
          ...prev,
          fetching: 1,
          pending: Math.max(0, targetChapterCount - completedCount - 1),
          currentActiveUrls: [currentUrl!]
        }));

        // Execute fetch with retries
        let attempts = 0;
        let result = null;
        const maxRetries = settings.retryCount || 2;

        while (attempts <= maxRetries) {
          attempts++;
          result = await fetchChapterFromApi(currentUrl, settings);
          if (result.success) break;
          if (attempts <= maxRetries) {
            await new Promise(r => setTimeout(r, 500 * attempts));
          }
        }

        if (settings.delayMs > 0) {
          await new Promise(r => setTimeout(r, settings.delayMs));
        }

        if (result && result.success) {
          successCount++;
          setChapters(prev =>
            prev.map(c =>
              c.id === chapId
                ? {
                    ...c,
                    title: result.title || c.title,
                    content: result.content || '',
                    rawContent: result.rawContent,
                    novelTitle: result.novelTitle,
                    chapterNum: result.chapterNum || c.chapterNum,
                    status: 'success',
                    wordCount: result.wordCount || 0,
                    charCount: result.charCount || 0,
                    parserName: result.parserName || 'Generic Extractor',
                    diagnostics: result.diagnostics,
                    fetchedAt: Date.now()
                  }
                : c
            )
          );

          // Get next chapter URL from parser
          currentUrl = result.nextUrl;
        } else {
          failedCount++;
          setChapters(prev =>
            prev.map(c =>
              c.id === chapId
                ? {
                    ...c,
                    status: 'error',
                    errorReason: result?.error || 'Failed to extract content',
                    diagnostics: result?.diagnostics
                  }
                : c
            )
          );
          // Stop chain if next URL cannot be determined
          currentUrl = undefined;
        }

        completedCount++;
        chapterIndex++;

        const elapsed = Date.now() - startTime;
        const speed = completedCount > 0 ? completedCount / (elapsed / 1000) : 0;
        const remaining = targetChapterCount - completedCount;
        const estTime = speed > 0 ? (remaining / speed) * 1000 : 0;

        setBatchStats(prev => ({
          ...prev,
          fetching: 0,
          success: successCount,
          failed: failedCount,
          elapsedTimeMs: elapsed,
          avgSpeedChapPerSec: speed,
          estRemainingTimeMs: estTime,
          currentActiveUrls: []
        }));
      }

    } else {
      // Standard Concurrent Batch Queue Engine
      const newItems: ChapterItem[] = urls.map((url, index) => {
        const numMatch = url.match(/(?:chapter|chap|txt|id)[-/]?(\d+)/i);
        const chapterNum = numMatch ? parseInt(numMatch[1], 10) : undefined;

        return {
          id: 'chap_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 4),
          url,
          title: chapterNum ? `Chapter ${chapterNum}` : `Chapter ${chapters.length + index + 1}`,
          content: '',
          status: 'pending',
          wordCount: 0,
          charCount: 0,
          parserName: 'Detecting...',
          selected: true,
          chapterNum
        };
      });

      setChapters(prev => [...prev, ...newItems]);

      const queue = [...newItems];
      const concurrency = settings.concurrency || 3;

      const worker = async () => {
        while (queue.length > 0) {
          if (cancelRequestedRef.current) break;

          while (isPausedRef.current && !cancelRequestedRef.current) {
            await new Promise(r => setTimeout(r, 200));
          }

          if (cancelRequestedRef.current) break;

          const item = queue.shift();
          if (!item) break;

          setChapters(prev =>
            prev.map(c => (c.id === item.id ? { ...c, status: 'fetching' } : c))
          );

          setBatchStats(prev => ({
            ...prev,
            pending: Math.max(0, prev.pending - 1),
            fetching: prev.fetching + 1,
            currentActiveUrls: [...prev.currentActiveUrls, item.url]
          }));

          let attempts = 0;
          let result = null;
          const maxRetries = settings.retryCount || 2;

          while (attempts <= maxRetries) {
            attempts++;
            result = await fetchChapterFromApi(item.url, settings);
            if (result.success) break;
            if (attempts <= maxRetries) {
              await new Promise(r => setTimeout(r, 500 * attempts));
            }
          }

          if (settings.delayMs > 0) {
            await new Promise(r => setTimeout(r, settings.delayMs));
          }

          if (result && result.success) {
            successCount++;
            setChapters(prev =>
              prev.map(c =>
                c.id === item.id
                  ? {
                      ...c,
                      title: result.title || c.title,
                      content: result.content || '',
                      rawContent: result.rawContent,
                      novelTitle: result.novelTitle,
                      chapterNum: result.chapterNum || c.chapterNum,
                      status: 'success',
                      wordCount: result.wordCount || 0,
                      charCount: result.charCount || 0,
                      parserName: result.parserName || 'Generic Extractor',
                      diagnostics: result.diagnostics,
                      fetchedAt: Date.now()
                    }
                  : c
              )
            );
          } else {
            failedCount++;
            setChapters(prev =>
              prev.map(c =>
                c.id === item.id
                  ? {
                      ...c,
                      status: 'error',
                      errorReason: result?.error || 'Failed to extract content',
                      diagnostics: result?.diagnostics
                    }
                  : c
              )
            );
          }

          completedCount++;

          const elapsed = Date.now() - startTime;
          const speed = completedCount > 0 ? completedCount / (elapsed / 1000) : 0;
          const remaining = urls.length - completedCount;
          const estTime = speed > 0 ? (remaining / speed) * 1000 : 0;

          setBatchStats(prev => ({
            ...prev,
            fetching: Math.max(0, prev.fetching - 1),
            success: successCount,
            failed: failedCount,
            elapsedTimeMs: elapsed,
            avgSpeedChapPerSec: speed,
            estRemainingTimeMs: estTime,
            currentActiveUrls: prev.currentActiveUrls.filter(u => u !== item.url)
          }));
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
      await Promise.all(workers);
    }

    setIsFetchingBatch(false);
    showToast(`Batch completed: ${successCount} fetched, ${failedCount} failed.`);
  };

  // Re-fetch individual chapter
  const refetchChapter = async (id: string) => {
    const target = chapters.find(c => c.id === id);
    if (!target) return;

    setChapters(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'fetching', errorReason: undefined } : c))
    );

    const result = await fetchChapterFromApi(target.url, settings);

    if (result.success) {
      setChapters(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                title: result.title || c.title,
                content: result.content || '',
                rawContent: result.rawContent,
                novelTitle: result.novelTitle,
                chapterNum: result.chapterNum || c.chapterNum,
                status: 'success',
                wordCount: result.wordCount || 0,
                charCount: result.charCount || 0,
                parserName: result.parserName || 'Generic Extractor',
                fetchedAt: Date.now()
              }
            : c
        )
      );
      showToast(`Refetched "${target.title}" successfully`);
    } else {
      setChapters(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                status: 'error',
                errorReason: result.error || 'Failed to fetch'
              }
            : c
        )
      );
      showToast(`Failed to refetch "${target.title}": ${result.error}`);
    }
  };

  // Batch Control Handlers
  const handlePauseBatch = () => setIsPaused(true);
  const handleResumeBatch = () => setIsPaused(false);
  const handleCancelBatch = () => {
    cancelRequestedRef.current = true;
    setIsFetchingBatch(false);
    showToast('Batch fetching cancelled');
  };

  const handleRetryFailedBatch = () => {
    const failedUrls = chapters.filter(c => c.status === 'error').map(c => c.url);
    // Remove failed chapters and re-run batch
    setChapters(prev => prev.filter(c => c.status !== 'error'));
    startBatchFetch(failedUrls);
  };

  // Selection Actions
  const toggleSelectChapter = (id: string) => {
    setChapters(prev =>
      prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectAll = () => setChapters(prev => prev.map(c => ({ ...c, selected: true })));
  const deselectAll = () => setChapters(prev => prev.map(c => ({ ...c, selected: false })));
  const invertSelection = () => setChapters(prev => prev.map(c => ({ ...c, selected: !c.selected })));

  const deleteChapter = (id: string) => {
    setChapters(prev => prev.filter(c => c.id !== id));
  };

  const clearAllChapters = () => {
    if (confirm('Are you sure you want to clear all fetched chapters?')) {
      setChapters([]);
    }
  };

  // Copy Operations
  const handleCopySelected = async () => {
    const selected = chapters.filter(c => c.selected && c.status === 'success');
    if (selected.length === 0) return;

    const merged = selected
      .map(c => formatChapterOutput(c.title, c.content, settings.copyFormat, settings.chapterHeaderTemplate))
      .join('\n\n');

    await navigator.clipboard.writeText(merged);
    showToast(`Copied ${selected.length} selected chapters to clipboard!`);
  };

  const handleCopyAll = async () => {
    const successOnly = chapters.filter(c => c.status === 'success');
    if (successOnly.length === 0) return;

    const merged = successOnly
      .map(c => formatChapterOutput(c.title, c.content, settings.copyFormat, settings.chapterHeaderTemplate))
      .join('\n\n');

    await navigator.clipboard.writeText(merged);
    showToast(`Copied all ${successOnly.length} chapters to clipboard!`);
  };

  // Download Operations
  const handleDownloadSelected = (extFormat: 'txt' | 'md' | 'json') => {
    const target = chapters.filter(c => c.selected && c.status === 'success').length > 0
      ? chapters.filter(c => c.selected && c.status === 'success')
      : chapters.filter(c => c.status === 'success');

    if (target.length === 0) return;

    let contentStr = '';
    let mimeType = 'text/plain';

    if (extFormat === 'json') {
      contentStr = JSON.stringify(target, null, 2);
      mimeType = 'application/json';
    } else {
      const fmt = extFormat === 'md' ? 'markdown' : settings.copyFormat;
      contentStr = target
        .map(c => formatChapterOutput(c.title, c.content, fmt, settings.chapterHeaderTemplate))
        .join('\n\n');
    }

    const blob = new Blob([contentStr], { type: `${mimeType};charset=utf-8` });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `novel_chapters_export_${Date.now()}.${extFormat}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);

    showToast(`Downloaded ${target.length} chapters as .${extFormat}`);
  };

  // History Session Handlers
  const handleSaveCurrentSession = (sessionName: string) => {
    const saved = saveSessionToHistory(sessionName, chapters);
    setSavedHistory(loadSavedHistory());
    showToast(`Saved session "${saved.name}" to browser history!`);
  };

  const handleLoadSession = (session: SavedSession) => {
    setChapters(session.chapters);
    showToast(`Loaded session "${session.name}" (${session.chapters.length} chapters)`);
  };

  const handleDeleteHistorySession = (id: string) => {
    const updated = deleteHistorySession(id);
    setSavedHistory(updated);
    showToast('Session deleted from history');
  };

  // Filtered and Sorted Chapters list
  const filteredChapters = chapters.filter(c => {
    if (filter === 'success') return c.status === 'success';
    if (filter === 'error') return c.status === 'error';
    if (filter === 'selected') return c.selected;
    if (filter === 'unselected') return !c.selected;
    return true; // 'all'
  }).filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q) || (c.novelTitle && c.novelTitle.toLowerCase().includes(q));
  });

  const sortedChapters = [...filteredChapters].sort((a, b) => {
    if (sortBy === 'asc') {
      return (a.chapterNum || 0) - (b.chapterNum || 0);
    }
    if (sortBy === 'desc') {
      return (b.chapterNum || 0) - (a.chapterNum || 0);
    }
    if (sortBy === 'words_desc') {
      return b.wordCount - a.wordCount;
    }
    if (sortBy === 'words_asc') {
      return a.wordCount - b.wordCount;
    }
    return 0;
  });

  const selectedCount = chapters.filter(c => c.selected).length;
  const successCount = chapters.filter(c => c.status === 'success').length;

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark'
        ? 'bg-slate-950 text-slate-100'
        : theme === 'sepia'
        ? 'bg-[#fbf7ee] text-[#3a2e22]'
        : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Navigation Header */}
      <Header
        theme={theme}
        setTheme={setTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenParsersModal={() => setIsParsersOpen(true)}
        totalChapters={chapters.length}
        successChapters={successCount}
        historyCount={savedHistory.length}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Fetch Input Panel */}
        <FetchInputPanel
          onStartFetch={startBatchFetch}
          isFetching={isFetchingBatch}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* 2. Batch Progress & Telemetry Card (Visible during or after batch operations) */}
        {batchStats.total > 0 && (
          <BatchProgressCard
            stats={batchStats}
            isPaused={isPaused}
            onPause={handlePauseBatch}
            onResume={handleResumeBatch}
            onCancel={handleCancelBatch}
            onRetryFailed={handleRetryFailedBatch}
          />
        )}

        {/* 3. Main Toolbar & Batch Operations */}
        <Toolbar
          chapters={chapters}
          selectedCount={selectedCount}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          copyFormat={settings.copyFormat}
          setCopyFormat={(fmt) => handleUpdateSettings({ ...settings, copyFormat: fmt })}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onInvertSelection={invertSelection}
          onCopySelected={handleCopySelected}
          onCopyAll={handleCopyAll}
          onDownloadSelected={handleDownloadSelected}
          onClearAll={clearAllChapters}
          onOpenPreview={() => setIsPreviewOpen(true)}
        />

        {/* 4. Fetched Chapters List */}
        {chapters.length > 0 ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {sortedChapters.length} of {chapters.length} Chapters</span>
              {searchQuery && (
                <span>Matching search: "<strong className="text-indigo-500">{searchQuery}</strong>"</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5">
              {sortedChapters.map((chapter) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  settings={settings}
                  searchQuery={searchQuery}
                  onToggleSelect={toggleSelectChapter}
                  onRefresh={refetchChapter}
                  onDelete={deleteChapter}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No Chapters Fetched Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Paste a single URL, multiple chapter links, or generate a chapter range above to extract clean chapter text automatically!
            </p>
          </div>
        )}

      </main>

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onResetDefaults={() => handleUpdateSettings(DEFAULT_SETTINGS)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedSessions={savedHistory}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteHistorySession}
        onSaveCurrentSession={handleSaveCurrentSession}
        currentChapters={chapters}
      />

      <SupportedParsersModal
        isOpen={isParsersOpen}
        onClose={() => setIsParsersOpen(false)}
        parsers={parsers}
      />

      <CopyPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        chapters={chapters}
        settings={settings}
      />

    </div>
  );
}
