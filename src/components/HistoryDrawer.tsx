import React, { useState } from 'react';
import { X, History, Trash2, FolderOpen, Save, Download, Upload, Calendar, BookOpen } from 'lucide-react';
import { ChapterItem, SavedSession } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedSessions: SavedSession[];
  onLoadSession: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
  onSaveCurrentSession: (name: string) => void;
  currentChapters: ChapterItem[];
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedSessions,
  onLoadSession,
  onDeleteSession,
  onSaveCurrentSession,
  currentChapters
}) => {
  const [sessionNameInput, setSessionNameInput] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentChapters.length === 0) return;
    onSaveCurrentSession(sessionNameInput.trim() || `Session (${currentChapters.length} Chapters)`);
    setSessionNameInput('');
  };

  const exportBackupJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedSessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `novel_fetcher_history_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end transition-all">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Session History & Backups
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Saved locally in browser storage
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

        {/* Save Current Session Form */}
        {currentChapters.length > 0 && (
          <form onSubmit={handleSave} className="p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Save Current Fetch Session ({currentChapters.length} Chapters)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={sessionNameInput}
                onChange={(e) => setSessionNameInput(e.target.value)}
                placeholder="Session Name (e.g., Lord of Mysteries 1-50)"
                className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>
        )}

        {/* Saved Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No saved sessions yet.</p>
              <p className="text-[11px]">Fetch chapters and click save to preserve your work!</p>
            </div>
          ) : (
            savedSessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 hover:border-amber-400 transition-all space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>{session.name}</span>
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span>•</span>
                      <span>{session.chapters.length} Chapters</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Delete Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    onLoadSession(session);
                    onClose();
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                >
                  <span>Reopen Session ({session.chapters.length} Chapters)</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Backup Action */}
        {savedSessions.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <button
              onClick={exportBackupJSON}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Sessions JSON Backup</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
