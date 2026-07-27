import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { getParserForUrl, getParserList } from './src/parsers/index';
import { cleanChapterContent, countWordsAndChars } from './src/services/cleaner';
import { FetchDiagnostics, ParserTestResult } from './src/types';

/**
 * Execute Smart Pipeline (4 Attempts) for fetching protected novel pages
 */
async function executeSmartPipeline(
  url: string,
  options: { timeoutMs?: number; customUserAgent?: string } = {}
) {
  const { timeoutMs = 12000, customUserAgent } = options;
  const startTime = Date.now();

  let targetOrigin = '';
  try {
    const parsedUrl = new URL(url);
    targetOrigin = parsedUrl.origin;
  } catch {
    targetOrigin = 'https://' + url.split('/')[2];
  }

  const parser = getParserForUrl(url);
  const siteProfile = parser.siteProfile;

  // Browser Header Emulation Sets
  const attemptConfigs = [
    // Attempt 1: Direct Fetch with basic browser headers
    {
      name: 'Attempt 1: Direct Fetch',
      headers: {
        'User-Agent': customUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    },
    // Attempt 2: Backend Fetch with Site Profile Custom Headers & Referer
    {
      name: 'Attempt 2: Backend Server Fetch (Site Profile)',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': targetOrigin + '/',
        'Origin': targetOrigin,
        'Cache-Control': 'max-age=0',
        ...(siteProfile?.requiredHeaders || {})
      }
    },
    // Attempt 3: Retry with Full Realistic Browser Emulation (Sec-Fetch-*)
    {
      name: 'Attempt 3: Full Browser Header Emulation',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6',
        'Referer': targetOrigin + '/',
        'Origin': targetOrigin,
        'Sec-Ch-Ua': '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...(siteProfile?.requiredHeaders || {})
      }
    },
    // Attempt 4: Alternate User-Agent & Spoofed Search Referer
    {
      name: 'Attempt 4: Alternate Browser Identity & Search Referer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        ...(siteProfile?.requiredHeaders || {})
      }
    }
  ];

  let lastStatus = 500;
  let lastErrorMsg = 'Unknown network error';
  let lastResponseHeaders: Record<string, string> = {};
  let lastHeadersSent: Record<string, string> = {};

  for (let i = 0; i < attemptConfigs.length; i++) {
    const config = attemptConfigs[i];
    lastHeadersSent = config.headers;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: config.headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      // Capture response headers
      const respHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });
      lastResponseHeaders = respHeaders;

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());

        // Automatic Encoding Detection Logic
        const contentType = response.headers.get('content-type') || '';
        let encoding = siteProfile?.encoding && siteProfile.encoding !== 'auto' ? siteProfile.encoding : 'utf-8';

        const ctypeLower = contentType.toLowerCase();
        if (ctypeLower.includes('gbk') || ctypeLower.includes('gb2312')) {
          encoding = 'gbk';
        } else if (ctypeLower.includes('big5')) {
          encoding = 'big5';
        } else if (ctypeLower.includes('shift_jis') || ctypeLower.includes('shift-jis')) {
          encoding = 'shift-jis';
        } else {
          // Inspect head snippet of raw HTML for meta charset
          const headSnippet = buffer.slice(0, 2048).toString('ascii').toLowerCase();
          if (headSnippet.includes('charset=gbk') || headSnippet.includes('charset="gbk"') || headSnippet.includes('charset=gb2312')) {
            encoding = 'gbk';
          } else if (headSnippet.includes('charset=big5') || headSnippet.includes('charset="big5"')) {
            encoding = 'big5';
          } else if (headSnippet.includes('charset=shift_jis') || headSnippet.includes('charset=shift-jis')) {
            encoding = 'shift-jis';
          }
        }

        let htmlString: string;
        if (encoding !== 'utf-8' && iconv.encodingExists(encoding)) {
          htmlString = iconv.decode(buffer, encoding);
        } else {
          htmlString = buffer.toString('utf-8');
        }

        return {
          ok: true,
          status: response.status,
          buffer,
          encoding,
          htmlString,
          responseHeaders: lastResponseHeaders,
          lastHeadersSent,
          attemptsMade: i + 1,
          timeTakenMs: Date.now() - startTime,
          methodUsed: config.name
        };
      }

      lastErrorMsg = `HTTP ${response.status} ${response.statusText}`;

      // If status is 404 Not Found, don't retry non-existent page
      if (response.status === 404) {
        break;
      }

      // Small backoff before next attempt
      await new Promise(r => setTimeout(r, 250 * (i + 1)));

    } catch (err: any) {
      if (err.name === 'AbortError') {
        lastErrorMsg = `Request timed out after ${timeoutMs / 1000}s`;
        lastStatus = 504;
      } else {
        lastErrorMsg = err.message || 'Network connection failed';
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // All attempts failed: Construct Detailed Diagnostics Report
  const timeTakenMs = Date.now() - startTime;
  const is403 = lastStatus === 403;

  const diagnostics: FetchDiagnostics = {
    url,
    httpStatus: lastStatus,
    attemptsMade: 4,
    fetchMethod: 'Smart 4-Stage Resilient Pipeline',
    parserUsed: parser.name,
    timeTakenMs,
    cause: is403
      ? 'Website rejected request (HTTP 403 Forbidden).'
      : `Failed after 4 attempts (${lastErrorMsg}).`,
    possibleCauses: is403
      ? [
          'Anti-bot firewall protection active (Cloudflare / Incapsula / Custom WAF)',
          'Missing browser headers or fingerprint validation failure',
          'IP address rate limiting or regional access restriction',
          'Interactive cookie or browser challenge required by website'
        ]
      : [
          'Server timeout or temporary downtime',
          'Invalid URL or chapter page removed',
          'Network connection interrupted during backend request'
        ],
    suggestedAction: is403
      ? 'The site profile for this website may need updated custom headers or cookies, or the site restricts automated access.'
      : 'Check the URL validity or retry with increased timeout settings.',
    headersUsed: lastHeadersSent,
    responseHeaders: lastResponseHeaders
  };

  return {
    ok: false,
    status: lastStatus,
    encoding: 'utf-8',
    responseHeaders: lastResponseHeaders,
    lastHeadersSent,
    attemptsMade: 4,
    timeTakenMs,
    lastErrorMsg,
    diagnostics
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: Fetch and parse a single web novel chapter via Smart Pipeline
  app.post('/api/fetch', async (req, res) => {
    const { url, timeoutMs = 12000, userAgent, customRules } = req.body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ success: false, error: 'Valid HTTP/HTTPS URL is required' });
    }

    try {
      const pipelineResult = await executeSmartPipeline(url, { timeoutMs, customUserAgent: userAgent });

      if (!pipelineResult.ok || !pipelineResult.htmlString) {
        return res.status(pipelineResult.status || 500).json({
          success: false,
          url,
          error: pipelineResult.lastErrorMsg || 'Fetch failed',
          diagnostics: pipelineResult.diagnostics
        });
      }

      // Load into Cheerio
      const $ = cheerio.load(pipelineResult.htmlString);

      // Detect Parser
      const parser = getParserForUrl(url);

      // Execute Parser
      const parsedResult = parser.parse($, url);

      // Clean Content using Cleaner Engine
      const cleanedText = cleanChapterContent(parsedResult.content, customRules);

      // Count stats
      const stats = countWordsAndChars(cleanedText);

      return res.json({
        success: true,
        url,
        title: parsedResult.title || 'Untitled Chapter',
        content: cleanedText,
        rawContent: parsedResult.content,
        novelTitle: parsedResult.novelTitle,
        chapterNum: parsedResult.chapterNum,
        nextUrl: parsedResult.nextUrl,
        prevUrl: parsedResult.prevUrl,
        parserName: parser.name,
        parserId: parser.id,
        wordCount: stats.wordCount,
        charCount: stats.charCount,
        diagnostics: {
          url,
          httpStatus: 200,
          attemptsMade: pipelineResult.attemptsMade,
          fetchMethod: pipelineResult.methodUsed || 'Smart Pipeline',
          parserUsed: parser.name,
          timeTakenMs: pipelineResult.timeTakenMs,
          cause: 'Success',
          possibleCauses: [],
          suggestedAction: 'Chapter content extracted and cleaned successfully.',
          encodingDetected: pipelineResult.encoding,
          headersUsed: pipelineResult.lastHeadersSent,
          responseHeaders: pipelineResult.responseHeaders
        }
      });

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        url,
        error: err.message || 'Failed to fetch chapter'
      });
    }
  });

  // API 2: Get list of active parsers
  app.get('/api/parsers', (_req, res) => {
    res.json({ parsers: getParserList() });
  });

  // API 3: Detect parser for URL
  app.post('/api/test-parser', (req, res) => {
    const { url } = req.body;
    const parser = getParserForUrl(url || '');
    res.json({
      parserId: parser.id,
      parserName: parser.name,
      description: parser.description,
      siteProfile: parser.siteProfile
    });
  });

  // API 4: Full Parser Testing Tool & Debugger API
  app.post('/api/test-parser-full', async (req, res) => {
    const { url, timeoutMs = 10000, customRules } = req.body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ success: false, error: 'Valid URL is required' });
    }

    try {
      const pipelineResult = await executeSmartPipeline(url, { timeoutMs });
      const parser = getParserForUrl(url);

      if (!pipelineResult.ok || !pipelineResult.htmlString) {
        const testResult: ParserTestResult = {
          success: false,
          url,
          httpStatus: pipelineResult.status,
          responseTimeMs: pipelineResult.timeTakenMs,
          encodingDetected: pipelineResult.encoding,
          parserName: parser.name,
          parserId: parser.id,
          wordCount: 0,
          charCount: 0,
          detectedSelectors: {
            titleSelector: parser.siteProfile?.titleSelector,
            contentSelector: parser.siteProfile?.contentSelector,
            nextSelector: parser.siteProfile?.nextChapterSelector
          },
          headersSent: pipelineResult.lastHeadersSent,
          responseHeaders: pipelineResult.responseHeaders,
          error: pipelineResult.lastErrorMsg || 'Request failed',
          diagnostics: pipelineResult.diagnostics
        };
        return res.json(testResult);
      }

      const $ = cheerio.load(pipelineResult.htmlString);
      const parsedResult = parser.parse($, url);
      const cleanedText = cleanChapterContent(parsedResult.content, customRules);
      const stats = countWordsAndChars(cleanedText);

      const testResult: ParserTestResult = {
        success: true,
        url,
        httpStatus: 200,
        responseTimeMs: pipelineResult.timeTakenMs,
        encodingDetected: pipelineResult.encoding,
        parserName: parser.name,
        parserId: parser.id,
        title: parsedResult.title,
        novelTitle: parsedResult.novelTitle,
        chapterNum: parsedResult.chapterNum,
        nextUrl: parsedResult.nextUrl,
        prevUrl: parsedResult.prevUrl,
        wordCount: stats.wordCount,
        charCount: stats.charCount,
        cleanedContent: cleanedText.slice(0, 4000), // Return sample for preview
        rawHtmlSample: pipelineResult.htmlString.slice(0, 4000),
        detectedSelectors: {
          titleSelector: parser.siteProfile?.titleSelector,
          contentSelector: parser.siteProfile?.contentSelector,
          nextSelector: parser.siteProfile?.nextChapterSelector
        },
        headersSent: pipelineResult.lastHeadersSent,
        responseHeaders: pipelineResult.responseHeaders
      };

      return res.json(testResult);

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Testing failed'
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

