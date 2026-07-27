import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { getParserForUrl, getParserList } from './src/parsers/index';
import { cleanChapterContent, countWordsAndChars } from './src/services/cleaner';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: Fetch and parse a single web novel chapter
  app.post('/api/fetch', async (req, res) => {
    const { url, timeoutMs = 12000, userAgent, customRules } = req.body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ success: false, error: 'Valid HTTP/HTTPS URL is required' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const headers: Record<string, string> = {
        'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `HTTP ${response.status} ${response.statusText}`
        });
      }

      // Fetch as ArrayBuffer to handle non-UTF-8 character encodings (e.g. GBK, GB2312 for Chinese novel sites like 69shuba)
      const buffer = Buffer.from(await response.arrayBuffer());

      // Detect charset from headers or HTML meta tag
      const contentType = response.headers.get('content-type') || '';
      let encoding = 'utf-8';

      if (contentType.toLowerCase().includes('gbk') || contentType.toLowerCase().includes('gb2312')) {
        encoding = 'gbk';
      } else {
        // Inspect raw HTML start for meta charset
        const headSnippet = buffer.slice(0, 1024).toString('ascii').toLowerCase();
        if (headSnippet.includes('charset=gbk') || headSnippet.includes('charset="gbk"') || headSnippet.includes('charset=gb2312')) {
          encoding = 'gbk';
        } else if (headSnippet.includes('charset=big5')) {
          encoding = 'big5';
        }
      }

      let htmlString: string;
      if (encoding !== 'utf-8' && iconv.encodingExists(encoding)) {
        htmlString = iconv.decode(buffer, encoding);
      } else {
        htmlString = buffer.toString('utf-8');
      }

      // Load into Cheerio
      const $ = cheerio.load(htmlString);

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
        parserName: parser.name,
        parserId: parser.id,
        wordCount: stats.wordCount,
        charCount: stats.charCount
      });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: `Request timed out after ${timeoutMs / 1000}s`
        });
      }

      return res.status(500).json({
        success: false,
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
      description: parser.description
    });
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
