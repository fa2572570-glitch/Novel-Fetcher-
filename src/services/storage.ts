import { ChapterItem, FetchSettings, SavedSession } from '../types';
import { DEFAULT_CLEANING_RULES } from './cleaner';

const SETTINGS_KEY = 'novel_fetcher_settings_v1';
const CURRENT_SESSION_KEY = 'novel_fetcher_current_session_v1';
const HISTORY_SESSIONS_KEY = 'novel_fetcher_history_sessions_v1';

export const DEFAULT_SETTINGS: FetchSettings = {
  retryCount: 2,
  timeoutMs: 12000,
  concurrency: 3,
  delayMs: 300,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  autoClean: true,
  copyFormat: 'plaintext',
  chapterHeaderTemplate: '--------------------------------\n{title}\n--------------------------------\n\n',
  fontSize: 'md',
  cleaningRules: DEFAULT_CLEANING_RULES
};

export function loadSettings(): FetchSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: FetchSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadCurrentSession(): ChapterItem[] {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCurrentSession(chapters: ChapterItem[]): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(chapters));
  } catch (err) {
    console.error('Failed to save current session:', err);
  }
}

export function loadSavedHistory(): SavedSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSessionToHistory(sessionName: string, chapters: ChapterItem[]): SavedSession {
  const history = loadSavedHistory();
  const newSession: SavedSession = {
    id: 'session_' + Date.now(),
    name: sessionName || `Fetch Session ${new Date().toLocaleDateString()}`,
    createdAt: Date.now(),
    chapters
  };
  const updated = [newSession, ...history].slice(0, 20); // Keep last 20 sessions
  try {
    localStorage.setItem(HISTORY_SESSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save session history:', err);
  }
  return newSession;
}

export function deleteHistorySession(id: string): SavedSession[] {
  const history = loadSavedHistory();
  const updated = history.filter(s => s.id !== id);
  try {
    localStorage.setItem(HISTORY_SESSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete history session:', err);
  }
  return updated;
}
