import { FetchDiagnostics, FetchSettings, ParserInfo, ParserTestResult } from '../types';

export interface FetchApiResponse {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  rawContent?: string;
  novelTitle?: string;
  chapterNum?: number;
  nextUrl?: string;
  prevUrl?: string;
  parserName?: string;
  parserId?: string;
  wordCount?: number;
  charCount?: number;
  error?: string;
  diagnostics?: FetchDiagnostics;
}

export async function parseHtmlFromBrowser(
  html: string,
  url: string,
  settings: FetchSettings
): Promise<FetchApiResponse> {
  try {
    const response = await fetch('/api/parse-html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html,
        url,
        customRules: settings.cleaningRules
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        url,
        error: data.error || `HTTP ${response.status}`,
        diagnostics: data.diagnostics
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      url,
      error: err.message || 'Failed to process browser HTML'
    };
  }
}

export async function fetchChapterFromApi(
  url: string,
  settings: FetchSettings
): Promise<FetchApiResponse> {
  // If settings.fetchMode is browser_assisted, attempt direct in-browser fetch first if possible
  if (settings.fetchMode === 'browser_assisted') {
    try {
      // Attempt browser fetch directly in user's browser runtime
      const startTime = Date.now();
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 100) {
          const parsedRes = await parseHtmlFromBrowser(text, url, settings);
          if (parsedRes.success) {
            return parsedRes;
          }
        }
      }
    } catch (err) {
      // Client-side fetch failed (e.g. CORS block or browser session required)
      // Fall through to server fetch endpoint which will detect protection if present
    }
  }

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
        error: data.error || `HTTP ${response.status}`,
        diagnostics: data.diagnostics
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

export async function runParserTest(url: string, settings?: FetchSettings): Promise<ParserTestResult> {
  try {
    const res = await fetch('/api/test-parser-full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        timeoutMs: settings?.timeoutMs || 10000,
        customRules: settings?.cleaningRules
      })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      url,
      httpStatus: 500,
      responseTimeMs: 0,
      encodingDetected: 'utf-8',
      parserName: 'Unknown',
      parserId: 'unknown',
      wordCount: 0,
      charCount: 0,
      detectedSelectors: {},
      error: err.message || 'Network call failed'
    };
  }
}

