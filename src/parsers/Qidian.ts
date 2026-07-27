import type { CheerioAPI } from 'cheerio';
import { NovelParser, ParsedChapterResult, extractNextChapterUrl } from './base';

export const QidianParser: NovelParser = {
  id: 'qidian',
  name: 'Qidian / Webnovel',
  domains: ['qidian.com', 'webnovel.com'],
  description: 'Parser for Qidian and Webnovel web chapter pages.',
  exampleUrl: 'https://www.webnovel.com/book/12345/67890',
  siteProfile: {
    encoding: 'utf-8',
    contentSelector: '.main-text-wrap, .chapter-content, .read-content, .cha-content',
    titleSelector: '.chapter-title, .chapter-name, h1.j_chapterName, h1',
    nextChapterSelector: '#j_chapterNext, a.next-chap, a:contains("Next")',
    prevChapterSelector: '#j_chapterPrev, a.prev-chap, a:contains("Previous")',
    adRemovalRules: ['script', 'style', '.pirate', '.author-say', '.ad-box', '.chapter-control']
  },

  canParse(url: string): boolean {
    const lower = url.toLowerCase();
    return this.domains.some(domain => lower.includes(domain));
  },

  parse($: CheerioAPI, url: string): ParsedChapterResult {
    const nextUrl = extractNextChapterUrl($, url, this.siteProfile?.nextChapterSelector);

    let title = $('.chapter-title, .chapter-name, h1.j_chapterName, h1').first().text().trim();
    if (!title) {
      title = $('title').text().split('-')[0].trim();
    }

    let novelTitle = $('.book-title, .book-name, a.j_bookName').first().text().trim();

    const contentEl = $('.main-text-wrap, .chapter-content, .read-content, .cha-content').first().clone();

    contentEl.find('script, style, .pirate, .author-say, .ad-box, .chapter-control').remove();
    contentEl.find('br').replaceWith('\n');
    contentEl.find('p').each((_, el) => {
      $(el).append('\n\n');
    });

    const rawText = contentEl.text().trim();

    const chapNumMatch = title.match(/(?:第|chapter\s*)\s*(\d+)/i);
    const chapterNum = chapNumMatch ? parseInt(chapNumMatch[1], 10) : undefined;

    return {
      title,
      content: rawText,
      novelTitle: novelTitle || undefined,
      chapterNum,
      nextUrl
    };
  }
};

