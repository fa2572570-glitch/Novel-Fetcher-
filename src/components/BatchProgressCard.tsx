import React from 'react';
import { Play, Pause, XCircle, RotateCcw, CheckCircle2, AlertTriangle, Loader2, Gauge, Clock, Activity } from 'lucide-react';
import { BatchStats } from '../types';

interface BatchProgressCardProps {
  stats: BatchStats;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
}

export const BatchProgressCard: React.FC<BatchProgressCardProps> = ({
  stats,
  isPaused,
  onPause,
  onResume,
  onCancel,
  onRetryFailed
}) => {
  const completedCount = stats.success + stats.failed;
  const progressPercent = stats.total > 0 ? Math.round((completedCount / stats.total) * 100) : 0;

  const formatTime = (ms: number) => {
    if (ms <= 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-5 shadow-xl shadow-indigo-500/5 space-y-4">
      
      {/* Top Header: Progress Status + Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
            {stats.fetching > 0 ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : stats.failed > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span>
                {stats.fetching > 0
                  ? isPaused
                    ? 'Batch Fetch Paused'
                    : 'Fetching Chapter Batch...'
                  : 'Batch Operation Complete'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {progressPercent}%
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completedCount} of {stats.total} Chapters processed ({stats.success} succeeded, {stats.failed} failed)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {stats.fetching > 0 && (
            <>
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center space-x-1 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}

          {stats.failed > 0 && stats.fetching === 0 && (
            <button
              onClick={onRetryFailed}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry {stats.failed} Failed</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${stats.total > 0 ? (stats.success / stats.total) * 100 : 0}%` }}
          title={`Success: ${stats.success}`}
        />
        <div
          className="bg-rose-500 h-full transition-all duration-300"
          style={{ width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%` }}
          title={`Failed: ${stats.failed}`}
        />
        <div
          className="bg-indigo-500 h-full animate-pulse"
          style={{ width: `${stats.total > 0 ? (stats.fetching / stats.total) * 100 : 0}%` }}
          title={`Fetching: ${stats.fetching}`}
        />
      </div>

      {/* Telemetry Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        
        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-0.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Success / Total</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {stats.success} <span className="text-xs text-slate-400 font-normal">/ {stats.total}</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Elapsed Time</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {formatTime(stats.elapsedTimeMs)}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-0.5">
            <Gauge className="w-3.5 h-3.5 text-sky-500" />
            <span>Avg Speed</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {stats.avgSpeedChapPerSec.toFixed(1)} <span className="text-xs text-slate-400 font-normal">ch/s</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-0.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>EST Remaining</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {stats.pending > 0 ? formatTime(stats.estRemainingTimeMs) : '0s'}
          </div>
        </div>

      </div>

      {/* Active Threads Live URLs snippet */}
      {stats.currentActiveUrls.length > 0 && (
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-100 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          <span className="text-indigo-500 font-sans font-semibold mr-2">Fetching:</span>
          {stats.currentActiveUrls.join(', ')}
        </div>
      )}

    </div>
  );
};
