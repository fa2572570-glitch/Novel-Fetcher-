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
  chapterHeaderTemplate: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  fetchMode: 'standard' | 'browser_assisted';
  cleaningRules: CleaningRules;
}

export type ChapterStatus = 'pending' | 'fetching' | 'success' | 'error';

export interface FetchDiagnostics {
  url: string;
  httpStatus: number;
  attemptsMade: number;
  fetchMethod: string;
  fetchMode: 'standard' | 'browser_assisted';
  htmlSource: 'server_http' | 'browser_session';
  parserUsed: string;
  protectionDetected: boolean;
  protectionType?: string;
  timeTakenMs: number;
  cause: string;
  possibleCauses: string[];
  suggestedAction: string;
  headersUsed?: Record<string, string>;
  encodingDetected?: string;
  responseHeaders?: Record<string, string>;
}

export interface ChapterVerification {
  verified: boolean;
  reason?: string;
}

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
  nextUrl?: string;
  prevUrl?: string;
  diagnostics?: FetchDiagnostics;
  verification?: ChapterVerification;
}

export interface SiteProfile {
  requiredHeaders?: Record<string, string>;
  encoding?: string;
  contentSelector?: string;
  titleSelector?: string;
  nextChapterSelector?: string;
  prevChapterSelector?: string;
  adRemovalRules?: string[];
  cookieRequirements?: string;
  retryStrategy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface ParserInfo {
  id: string;
  name: string;
  domains: string[];
  description: string;
  exampleUrl: string;
  siteProfile?: SiteProfile;
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
  mode?: 'standard' | 'follow_next' | 'placeholder_range';
  currentChapterLabel?: string;
  nextChapterUrl?: string;
  lastStepLog?: string;
}

export interface SavedSession {
  id: string;
  name: string;
  createdAt: number;
  chapters: ChapterItem[];
}

export interface FetchBatchRequest {
  mode: 'urls' | 'placeholder' | 'follow_next';
  urls?: string[];
  firstUrl?: string;
  startChapter?: number;
  endChapter?: number;
}

export interface ParserTestResult {
  success: boolean;
  url: string;
  httpStatus: number;
  responseTimeMs: number;
  encodingDetected: string;
  parserName: string;
  parserId: string;
  title?: string;
  novelTitle?: string;
  chapterNum?: number;
  nextUrl?: string;
  prevUrl?: string;
  wordCount: number;
  charCount: number;
  cleanedContent?: string;
  rawHtmlSample?: string;
  detectedSelectors: {
    titleSelector?: string;
    contentSelector?: string;
    nextSelector?: string;
  };
  headersSent?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  error?: string;
  diagnostics?: FetchDiagnostics;
}

