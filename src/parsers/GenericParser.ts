import type { CheerioAPI } from 'cheerio';
import { NovelParser, ParsedChapterResult } from './base';

export const GenericParser: NovelParser = {
  id: 'generic',
  name: 'Generic Novel Extractor',
  domains: ['*'],
  description: 'Smart AI/Heuristic fallback extractor for any web novel site.',
  exampleUrl: 'https://any-novel-site.com/chapter-1',

  canParse(_url: string): boolean {
    return true; // Always available as fallback
  },

  parse($: CheerioAPI, _url: string): ParsedChapterResult {
    // 1. Try finding page title
    let title = $('h1').first().text().trim() ||
                $('h2.chapter-title, .entry-title, .post-title').first().text().trim();

    if (!title) {
      const fullTitle = $('title').text().trim();
      title = fullTitle.split(/[-|_]/)[0].trim() || 'Chapter Content';
    }

    // 2. Clone body to safely evaluate candidate containers
    const body = $('body').clone();

    // Clean obvious non-content blocks from body clone
    body.find('script, style, iframe, nav, header, footer, aside, .comments, #comments, .sidebar, .menu, .nav, .navigation, .ad, .ads, .social-share').remove();

    // Candidate selectors common in web novels
    const candidateSelectors = [
      '#chapter-content',
      '#content',
      '.chapter-content',
      '.entry-content',
      '.post-content',
      '.read-content',
      '.text-content',
      'article',
      'main',
      '.content',
      '.txtnav',
      '#txtnav'
    ];

    let bestContainer = null;
    let maxTextLen = 0;

    // Check candidate selectors first
    for (const selector of candidateSelectors) {
      const el = body.find(selector).first();
      if (el.length > 0) {
        const textLen = el.text().trim().length;
        if (textLen > maxTextLen) {
          maxTextLen = textLen;
          bestContainer = el;
        }
      }
    }

    // If no candidate selector was found or text length is short (<300 chars), evaluate all divs/sections
    if (!bestContainer || maxTextLen < 300) {
      body.find('div, section, article, main').each((_, elem) => {
        const el = $(elem);
        // Ensure element has multiple paragraphs or substantial text density
        const pCount = el.find('p').length;
        const text = el.text().trim();
        if (text.length > maxTextLen && (pCount >= 2 || text.length > 500)) {
          maxTextLen = text.length;
          bestContainer = el;
        }
      });
    }

    if (!bestContainer) {
      bestContainer = body;
    }

    // Convert <br> tags to newlines and handle <p> tags
    bestContainer.find('br').replaceWith('\n');
    bestContainer.find('p').each((_, el) => {
      $(el).append('\n\n');
    });

    let extractedText = bestContainer.text().trim();

    // If title appears right at the start of extracted text, strip it
    if (title && extractedText.startsWith(title)) {
      extractedText = extractedText.substring(title.length).trim();
    }

    const chapNumMatch = title.match(/(?:第|chapter\s*)\s*(\d+)/i);
    const chapterNum = chapNumMatch ? parseInt(chapNumMatch[1], 10) : undefined;

    return {
      title,
      content: extractedText,
      chapterNum
    };
  }
};
