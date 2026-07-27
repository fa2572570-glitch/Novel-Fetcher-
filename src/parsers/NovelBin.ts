import type { CheerioAPI } from 'cheerio';
import { NovelParser, ParsedChapterResult, extractNextChapterUrl } from './base';

export const NovelBinParser: NovelParser = {
  id: 'novelbin',
  name: 'NovelBin / NovelFull',
  domains: ['novelbin.me', 'novelbin.com', 'novelbin.net', 'novelbin.org', 'novelfull.com', 'novelfull.net'],
  description: 'Specialized scraper for NovelBin and NovelFull chapters with watermark removal.',
  exampleUrl: 'https://novelbin.me/novel-book/novel-title/chapter-1',
  siteProfile: {
    encoding: 'utf-8',
    contentSelector: '#chr-content, .chr-c, #chapter-content',
    titleSelector: '.chr-title, .chapter-title, h2, h1',
    nextChapterSelector: '#next_chap, a.btn-next, a:contains("Next")',
    prevChapterSelector: '#prev_chap, a.btn-prev, a:contains("Prev")',
    adRemovalRules: ['.pirate', 'script', 'style', '.ads', '.adsbygoogle', '.nav-buttons', 'div[class*="ad"]']
  },

  canParse(url: string): boolean {
    const lower = url.toLowerCase();
    return this.domains.some(domain => lower.includes(domain));
  },

  parse($: CheerioAPI, url: string): ParsedChapterResult {
    const nextUrl = extractNextChapterUrl($, url, this.siteProfile?.nextChapterSelector);

    let title = $('.chr-title, .chapter-title, h2, h1').first().text().trim();
    if (!title) {
      title = $('title').text().split('-')[0].trim();
    }

    let novelTitle = $('.novel-title, a.novel-title').first().text().trim();

    const contentEl = $('#chr-content, .chr-c, #chapter-content').first().clone();

    // Remove anti-piracy text, watermarks, ads
    contentEl.find('.pirate, script, style, .ads, .adsbygoogle, .nav-buttons, div[class*="ad"]').remove();
    contentEl.find('p').each((_, el) => {
      const text = $(el).text();
      if (text.includes('novelbin') || text.includes('novelfull') || text.includes('If you find any errors')) {
        $(el).remove();
      } else {
        $(el).append('\n\n');
      }
    });
    contentEl.find('br').replaceWith('\n');

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

