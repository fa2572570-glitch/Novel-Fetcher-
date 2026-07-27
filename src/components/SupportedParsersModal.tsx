import React, { useState } from 'react';
import { X, Globe, CheckCircle2, Shield, PlusCircle, FlaskConical, Play, Check, AlertCircle, Clock, FileCode, Terminal, ChevronRight } from 'lucide-react';
import { ParserInfo, ParserTestResult } from '../types';
import { runParserTest } from '../services/api';

interface SupportedParsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsers: ParserInfo[];
}

export const SupportedParsersModal: React.FC<SupportedParsersModalProps> = ({
  isOpen,
  onClose,
  parsers
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'tester'>('list');

  // Parser Tester State
  const [testUrl, setTestUrl] = useState('https://www.69shuba.com/txt/51232/36924720');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ParserTestResult | null>(null);
  const [previewTab, setPreviewTab] = useState<'cleaned' | 'raw' | 'headers'>('cleaned');

  if (!isOpen) return null;

  const handleRunTest = async (urlToTest?: string) => {
    const target = urlToTest || testUrl;
    if (!target || !target.startsWith('http')) return;

    setIsTesting(true);
    setTestResult(null);

    const res = await runParserTest(target);
    setTestResult(res);
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Supported Novel Websites & Parsers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modular parser engine dynamically matches domain signatures
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

        {/* Modal Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 p-1.5 gap-2 px-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Registered Parsers ({parsers.length})
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'tester'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
            <span>Parser Testing Utility</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: REGISTERED PARSERS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-1">
                <p className="font-semibold flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-sky-500" />
                  <span>Extensible Modular Architecture</span>
                </p>
                <p>
                  Every novel site uses its own dedicated parser module (e.g. <code>69shuba.ts</code>, <code>RoyalRoad.ts</code>, <code>NovelBin.ts</code>). If a domain is not explicitly registered, our <strong>Generic Extractor</strong> automatically analyzes DOM density to extract clean novel chapters!
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {parsers.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-sky-400 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>{p.name}</span>
                      </h3>
                      
                      <button
                        onClick={() => {
                          const exampleUrl = p.domains[0] ? `https://www.${p.domains[0]}` : 'https://www.69shuba.com/txt/51232/36924720';
                          setTestUrl(exampleUrl);
                          setActiveTab('tester');
                          handleRunTest(exampleUrl);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center space-x-1"
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Test Parser</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {p.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400">Domains:</span>
                      {p.domains.map((dom, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-500" />
                  <span>Adding a New Site Parser</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adding support for a new website requires creating only one TypeScript parser module in <code>/src/parsers/</code> implementing the <code>NovelParser</code> interface.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PARSER TESTING UTILITY */}
          {activeTab === 'tester' && (
            <div className="space-y-5">
              
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Enter Novel Chapter URL to Test Parser
                </label>

                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://www.69shuba.com/txt/51232/36924720"
                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={() => handleRunTest()}
                    disabled={isTesting || !testUrl.trim()}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {isTesting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isTesting ? 'Testing...' : 'Run Test'}</span>
                  </button>
                </div>
              </div>

              {/* TEST RESULTS DISPLAY */}
              {testResult && (
                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  
                  {/* Status Summary Banner */}
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                    testResult.success
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}>
                    <div className="flex items-center space-x-2 font-bold">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      )}
                      <span>
                        {testResult.success ? 'Parser Executed Successfully' : `Test Failed (${testResult.error || 'Error'})`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 font-mono text-[11px]">
                      <span>HTTP {testResult.httpStatus}</span>
                      <span>•</span>
                      <span>{testResult.responseTimeMs}ms</span>
                      <span>•</span>
                      <span>Encoding: {testResult.encodingDetected}</span>
                      <span>•</span>
                      <span className="font-bold">{testResult.parserName}</span>
                    </div>
                  </div>

                  {/* Metadata extraction card */}
                  {testResult.success && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Chapter Title:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{testResult.title}</p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Novel Title:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{testResult.novelTitle || 'None'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Word / Char Count:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{testResult.wordCount} words / {testResult.charCount} chars</p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">Discovered Next Chapter URL:</span>
                        <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                          {testResult.nextUrl || 'None detected'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Code / Content Preview Tabs */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1 gap-1 text-xs font-semibold">
                      <button
                        onClick={() => setPreviewTab('cleaned')}
                        className={`px-3 py-1.5 rounded-lg ${previewTab === 'cleaned' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                      >
                        Cleaned Content Preview
                      </button>
                      <button
                        onClick={() => setPreviewTab('raw')}
                        className={`px-3 py-1.5 rounded-lg ${previewTab === 'raw' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                      >
                        Raw HTML Sample
                      </button>
                      <button
                        onClick={() => setPreviewTab('headers')}
                        className={`px-3 py-1.5 rounded-lg ${previewTab === 'headers' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                      >
                        Emulated Headers
                      </button>
                    </div>

                    <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {previewTab === 'cleaned' && (testResult.cleanedContent || 'No extracted content.')}
                      {previewTab === 'raw' && (testResult.rawHtmlSample || 'No raw HTML sample available.')}
                      {previewTab === 'headers' && JSON.stringify(testResult.headersSent || {}, null, 2)}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

