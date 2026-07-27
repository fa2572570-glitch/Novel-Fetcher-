import React, { useState, useEffect } from 'react';
import { Link2, ListPlus, Hash, Play, Zap, Shield, HelpCircle, Layers } from 'lucide-react';
import { detectParserForUrl } from '../services/api';
import { FetchSettings } from '../types';

interface FetchInputPanelProps {
  onStartFetch: (urls: string[]) => void;
  isFetching: boolean;
  settings: FetchSettings;
  onUpdateSettings: (newSettings: FetchSettings) => void;
}

export const FetchInputPanel: React.FC<FetchInputPanelProps> = ({
  onStartFetch,
  isFetching,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'multiple' | 'range'>('single');

  // Single URL state
  const [singleUrl, setSingleUrl] = useState('');
  const [detectedParser, setDetectedParser] = useState<{ parserName: string; parserId: string } | null>(null);

  // Multiple URLs state
  const [multipleUrls, setMultipleUrls] = useState('');

  // Chapter Range state
  const [baseUrlPattern, setBaseUrlPattern] = useState('https://novelbin.me/novel-book/my-novel-title/chapter-{number}');
  const [startChapter, setStartChapter] = useState<number>(1);
  const [endChapter, setEndChapter] = useState<number>(10);
  const [paddingDigits, setPaddingDigits] = useState<number>(0); // 0 = none (1), 2 = 01, 3 = 001

  // Detect parser dynamically when single URL changes
  useEffect(() => {
    if (!singleUrl || !singleUrl.startsWith('http')) {
      setDetectedParser(null);
      return;
    }
    const timer = setTimeout(async () => {
      const info = await detectParserForUrl(singleUrl);
      setDetectedParser(info);
    }, 250);
    return () => clearTimeout(timer);
  }, [singleUrl]);

  // Handle Single Chapter Submission
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl.trim()) return;
    onStartFetch([singleUrl.trim()]);
  };

  // Handle Multiple URLs Submission
  const handleMultipleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = multipleUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && u.startsWith('http'));

    if (urls.length === 0) return;
    onStartFetch(urls);
  };

  // Handle Chapter Range Submission
  const handleRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseUrlPattern.includes('{number}') && !baseUrlPattern.includes('{num}')) {
      alert('Please include "{number}" placeholder inside your Base URL pattern.\nExample: https://example.com/chapter-{number}');
      return;
    }

    const start = Math.min(startChapter, endChapter);
    const end = Math.max(startChapter, endChapter);
    const placeholder = baseUrlPattern.includes('{number}') ? '{number}' : '{num}';

    const generatedUrls: string[] = [];
    for (let i = start; i <= end; i++) {
      let numStr = i.toString();
      if (paddingDigits > 0) {
        numStr = numStr.padStart(paddingDigits, '0');
      }
      const url = baseUrlPattern.replace(placeholder, numStr);
      generatedUrls.push(url);
    }

    if (generatedUrls.length === 0) return;
    onStartFetch(generatedUrls);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
      
      {/* Mode Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-1.5 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'single'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Single Chapter</span>
        </button>

        <button
          onClick={() => setActiveTab('multiple')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'multiple'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ListPlus className="w-4 h-4" />
          <span>Paste Multiple URLs</span>
        </button>

        <button
          onClick={() => setActiveTab('range')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'range'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Chapter Range Generator</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5 sm:p-6">
        
        {/* 1. SINGLE CHAPTER TAB */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Chapter URL
              </label>
              <div className="relative flex items-center">
                <input
                  type="url"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="https://www.69shuba.com/txt/12345/67890 or https://royalroad.com/..."
                  required
                  className="w-full pl-4 pr-32 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={isFetching || !singleUrl.trim()}
                  className="absolute right-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isFetching ? 'Fetching...' : 'Fetch Chapter'}</span>
                </button>
              </div>
            </div>

            {/* Detected Parser Feedback */}
            {detectedParser && (
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Detected Parser:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {detectedParser.parserName}
                </span>
              </div>
            )}
          </form>
        )}

        {/* 2. MULTIPLE URLS TAB */}
        {activeTab === 'multiple' && (
          <form onSubmit={handleMultipleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Paste Multiple Chapter URLs (One per line)
                </label>
                <span className="text-xs text-slate-400">
                  {multipleUrls.split('\n').filter(u => u.trim().startsWith('http')).length} URLs detected
                </span>
              </div>
              <textarea
                value={multipleUrls}
                onChange={(e) => setMultipleUrls(e.target.value)}
                placeholder={`https://example.com/chapter-101\nhttps://example.com/chapter-102\nhttps://example.com/chapter-103`}
                rows={5}
                required
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isFetching || !multipleUrls.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Fetch All URLs Batch</span>
            </button>
          </form>
        )}

        {/* 3. CHAPTER RANGE GENERATOR TAB */}
        {activeTab === 'range' && (
          <form onSubmit={handleRangeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Base URL Pattern (Use <code className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1 py-0.5 rounded">{'{number}'}</code> as placeholder)
              </label>
              <input
                type="text"
                value={baseUrlPattern}
                onChange={(e) => setBaseUrlPattern(e.target.value)}
                placeholder="https://example.com/novel-book/chapter-{number}"
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Chapter #
                </label>
                <input
                  type="number"
                  value={startChapter}
                  onChange={(e) => setStartChapter(parseInt(e.target.value) || 1)}
                  min={1}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  End Chapter #
                </label>
                <input
                  type="number"
                  value={endChapter}
                  onChange={(e) => setEndChapter(parseInt(e.target.value) || 1)}
                  min={1}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Number Padding
                </label>
                <select
                  value={paddingDigits}
                  onChange={(e) => setPaddingDigits(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value={0}>None (1, 2, 3)</option>
                  <option value={2}>2 Digits (01, 02)</option>
                  <option value={3}>3 Digits (001, 002)</option>
                  <option value={4}>4 Digits (0001, 0002)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Will generate <strong className="text-indigo-600 dark:text-indigo-400">{Math.max(0, Math.abs(endChapter - startChapter) + 1)}</strong> chapter URLs
              </span>

              <button
                type="submit"
                disabled={isFetching}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Layers className="w-4 h-4" />
                <span>Generate & Fetch Batch</span>
              </button>
            </div>
          </form>
        )}

        {/* Batch Engine Quick Parameters Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Parallel Workers */}
            <div className="flex items-center space-x-2">
              <span>Parallel Workers:</span>
              <select
                value={settings.concurrency}
                onChange={(e) => onUpdateSettings({ ...settings, concurrency: parseInt(e.target.value) })}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value={1}>1 (Sequential)</option>
                <option value={2}>2 Threads</option>
                <option value={3}>3 Threads (Default)</option>
                <option value={5}>5 Threads (Fast)</option>
                <option value={8}>8 Threads (Ultra)</option>
              </select>
            </div>

            {/* Request Delay */}
            <div className="flex items-center space-x-2">
              <span>Delay:</span>
              <select
                value={settings.delayMs}
                onChange={(e) => onUpdateSettings({ ...settings, delayMs: parseInt(e.target.value) })}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value={0}>0ms (No delay)</option>
                <option value={300}>300ms (Safe)</option>
                <option value={800}>800ms (Anti-block)</option>
                <option value={1500}>1.5s (Stealth)</option>
              </select>
            </div>

            {/* Auto Cleaning Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.autoClean}
                onChange={(e) => onUpdateSettings({ ...settings, autoClean: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-Clean Ads & Nav Noise</span>
            </label>
          </div>

          <div className="flex items-center space-x-1 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Proxy CORS bypass active</span>
          </div>
        </div>

      </div>
    </div>
  );
};
