import { ChapterItem, FetchSettings, ParserInfo } from '../types';

export interface FetchApiResponse {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  rawContent?: string;
  novelTitle?: string;
  chapterNum?: number;
  parserName?: string;
  parserId?: string;
  wordCount?: number;
  charCount?: number;
  error?: string;
}

export async function fetchChapterFromApi(
  url: string,
  settings: FetchSettings
): Promise<FetchApiResponse> {
  try {
    const response = await fetch('/api/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        timeoutMs: settings.timeoutMs,
        userAgent: settings.userAgent,
        customRules: settings.cleaningRules
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        url,
        error: data.error || `HTTP ${response.status}`
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      url,
      error: err.message || 'Network error or connection refused'
    };
  }
}

export async function fetchParsersList(): Promise<ParserInfo[]> {
  try {
    const res = await fetch('/api/parsers');
    if (!res.ok) return [];
    const data = await res.json();
    return data.parsers || [];
  } catch {
    return [];
  }
}

export async function detectParserForUrl(url: string): Promise<{ parserName: string; parserId: string }> {
  try {
    const res = await fetch('/api/test-parser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) return { parserName: 'Generic Extractor', parserId: 'generic' };
    const data = await res.json();
    return { parserName: data.parserName, parserId: data.parserId };
  } catch {
    return { parserName: 'Generic Extractor', parserId: 'generic' };
  }
}
