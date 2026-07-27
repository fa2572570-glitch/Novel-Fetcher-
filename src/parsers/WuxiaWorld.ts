import type { CheerioAPI } from 'cheerio';
import { NovelParser, ParsedChapterResult, extractNextChapterUrl } from './base';

export const WuxiaWorldParser: NovelParser = {
  id: 'wuxiaworld',
  name: 'WuxiaWorld',
  domains: ['wuxiaworld.com', 'wuxiaworld.site'],
  description: 'Parser for WuxiaWorld chapters.',
  exampleUrl: 'https://www.wuxiaworld.com/novel/novel-title/chapter-1',
  siteProfile: {
    encoding: 'utf-8',
    contentSelector: '.p-15, .chapter-content, #chapter-content',
    titleSelector: '.caption h4, h1, h2',
    nextChapterSelector: 'a.next-post, a.btn-next, a:contains("Next")',
    prevChapterSelector: 'a.prev-post, a.btn-prev, a:contains("Previous")',
    adRemovalRules: ['script', 'style', '.nav-buttons', '.section-comment', 'div[id*="ad"]']
  },

  canParse(url: string): boolean {
    const lower = url.toLowerCase();
    return this.domains.some(domain => lower.includes(domain));
  },

  parse($: CheerioAPI, url: string): ParsedChapterResult {
    const nextUrl = extractNextChapterUrl($, url, this.siteProfile?.nextChapterSelector);

    let title = $('.caption h4, h1, h2').first().text().trim();
    if (!title) {
      title = $('title').text().split('-')[0].trim();
    }

    let novelTitle = $('.breadcrumb a').eq(1).text().trim() || $('a[href*="/novel/"]').first().text().trim();

    const contentEl = $('.p-15, .chapter-content, #chapter-content').first().clone();

    contentEl.find('script, style, .nav-buttons, .section-comment, div[id*="ad"]').remove();
    contentEl.find('br').replaceWith('\n');
    contentEl.find('p').each((_, el) => {
      $(el).append('\n\n');
    });

    const rawText = contentEl.text().trim();

    const chapNumMatch = title.match(/chapter\s*(\d+)/i);
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

