import React, { useState } from 'react';
import { X, ShieldAlert, Bug, Terminal, Activity, CheckCircle2, Clock, Server, FileCode, Copy, Check, Globe, Shield, Sparkles } from 'lucide-react';
import { FetchDiagnostics } from '../types';

interface FetchDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics?: FetchDiagnostics;
  url: string;
  errorReason?: string;
  onRetry?: () => void;
  onBrowserAssistedFetch?: () => void;
}

export const FetchDiagnosticsModal: React.FC<FetchDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  diagnostics,
  url,
  errorReason,
  onRetry,
  onBrowserAssistedFetch
}) => {
  const [copied, setCopied] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  if (!isOpen) return null;

  const handleCopyDiagnostics = async () => {
    const report = JSON.stringify(
      {
        url,
        errorReason,
        diagnostics: diagnostics || 'No detailed diagnostics available'
      },
      null,
      2
    );
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProtection = diagnostics?.protectionDetected || diagnostics?.httpStatus === 403 || diagnostics?.httpStatus === 503;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          isProtection 
            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60' 
            : 'bg-rose-50/50 dark:bg-rose-950/20 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              isProtection ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Detailed Fetch & Error Diagnostics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Smart Pipeline Execution & Security Report
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
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          
          {/* Target URL & HTTP Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Target URL
              </span>
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {url}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                HTTP Status Code
              </span>
              <span className={`inline-flex items-center space-x-1 font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                diagnostics?.httpStatus === 200
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900'
              }`}>
                <span>{diagnostics?.httpStatus || 403}</span>
                <span>{diagnostics?.httpStatus === 200 ? 'OK' : 'Failed'}</span>
              </span>
            </div>
          </div>

          {/* Protection Detected Notice Banner */}
          {isProtection && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-xs">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Website Protection Detected</span>
              </div>

              <p className="text-xs font-medium">
                Website protection detected. This website requires a browser session before chapter content can be extracted.
              </p>

              {onBrowserAssistedFetch && (
                <button
                  onClick={() => {
                    onClose();
                    onBrowserAssistedFetch();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Retry using Browser-Assisted Fetch</span>
                </button>
              )}
            </div>
          )}

          {/* Detailed Error Report Section */}
          <div className="space-y-3 bg-rose-50/60 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/60">
            <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
              <Bug className="w-4 h-4 text-rose-500" />
              <span>Failure Cause</span>
            </div>
            <p className="text-xs font-mono text-rose-900 dark:text-rose-200 font-semibold">
              {diagnostics?.cause || errorReason || 'Website protection detected or HTTP request blocked'}
            </p>

            <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Possible Causes:
              </span>
              <ul className="list-disc list-inside text-xs text-rose-800 dark:text-rose-300 space-y-1">
                {(diagnostics?.possibleCauses || [
                  'Website Anti-Bot Protection (Cloudflare / Incapsula) is active',
                  'Request headers lacked realistic browser TLS/HTTP fingerprint',
                  'Website requires valid session cookies to read chapter'
                ]).map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Suggested Action: </span>
              <span className="text-slate-600 dark:text-slate-400">
                {diagnostics?.suggestedAction || 'Use Browser-Assisted Fetch mode to render chapter with real browser session.'}
              </span>
            </div>
          </div>

          {/* Pipeline Execution Metadata Grid with Required Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Fetch Mode</span>
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                {diagnostics?.fetchMode === 'browser_assisted' ? 'Browser-Assisted Fetch' : 'Standard Fetch'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Server className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">HTML Source</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {diagnostics?.htmlSource === 'browser_session' ? 'Browser Session' : 'Direct Server HTTP'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <FileCode className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Parser Used</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                {diagnostics?.parserUsed || 'Generic Extractor'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Protection Detected</span>
              </div>
              <span className={`font-bold ${
                isProtection ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isProtection ? 'Yes (' + (diagnostics?.protectionType || 'Active WAF') + ')' : 'No'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Attempts Made</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {diagnostics?.attemptsMade || 1}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Time Taken</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {diagnostics?.timeTakenMs || 0} ms
              </span>
            </div>
          </div>

          {/* Request / Response Headers Toggle */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowHeaders(!showHeaders)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <span>View Emulated Headers & Raw Network Metadata</span>
              </div>
              <span>{showHeaders ? 'Hide' : 'Show Details'}</span>
            </button>

            {showHeaders && (
              <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] space-y-3 overflow-x-auto">
                <div>
                  <span className="text-indigo-400 font-bold block mb-1">Headers Sent:</span>
                  <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                    {JSON.stringify(diagnostics?.headersUsed || {}, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-emerald-400 font-bold block mb-1">Response Headers:</span>
                  <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                    {JSON.stringify(diagnostics?.responseHeaders || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={handleCopyDiagnostics}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center space-x-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Diagnostic Report' : 'Copy Diagnostic JSON'}</span>
          </button>

          <div className="flex items-center space-x-2">
            {isProtection && onBrowserAssistedFetch && (
              <button
                onClick={() => {
                  onClose();
                  onBrowserAssistedFetch();
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browser-Assisted Fetch</span>
              </button>
            )}

            {onRetry && (
              <button
                onClick={() => { onClose(); onRetry(); }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                Retry Standard
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

