export interface CleaningRules {
  removeAds: boolean;
  removeNavLinks: boolean;
  removeWatermarks: boolean;
  decodeEntities: boolean;
  normalizeQuotes: boolean;
  removeEmptyLines: boolean;
  preserveMarkdownFormatting: boolean;
  customRegexes: string[];
}

export interface FetchSettings {
  retryCount: number;
  timeoutMs: number;
  concurrency: number;
  delayMs: number;
  userAgent: string;
  autoClean: boolean;
  copyFormat: 'plaintext' | 'markdown' | 'html';
  chapterHeaderTemplate: string; // e.g. "--------------------------------\n{title}\n--------------------------------\n\n"
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  cleaningRules: CleaningRules;
}

export type ChapterStatus = 'pending' | 'fetching' | 'success' | 'error';

export interface ChapterItem {
  id: string;
  url: string;
  title: string;
  content: string;
  rawContent?: string;
  status: ChapterStatus;
  errorReason?: string;
  retryAttempts?: number;
  fetchedAt?: number;
  wordCount: number;
  charCount: number;
  parserName: string;
  selected: boolean;
  novelTitle?: string;
  chapterNum?: number;
}

export interface ParserInfo {
  id: string;
  name: string;
  domains: string[];
  description: string;
  exampleUrl: string;
}

export interface BatchStats {
  total: number;
  pending: number;
  fetching: number;
  success: number;
  failed: number;
  startTime: number | null;
  endTime: number | null;
  elapsedTimeMs: number;
  avgSpeedChapPerSec: number;
  estRemainingTimeMs: number;
  currentActiveUrls: string[];
}

export interface SavedSession {
  id: string;
  name: string;
  createdAt: number;
  chapters: ChapterItem[];
}
