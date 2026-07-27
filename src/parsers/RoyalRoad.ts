import type { CheerioAPI } from 'cheerio';
import { NovelParser, ParsedChapterResult, extractNextChapterUrl } from './base';

export const RoyalRoadParser: NovelParser = {
  id: 'royalroad',
  name: 'RoyalRoad',
  domains: ['royalroad.com'],
  description: 'Clean extraction for RoyalRoad fiction chapters.',
  exampleUrl: 'https://www.royalroad.com/fiction/12345/novel-title/chapter/67890/chapter-1',
  siteProfile: {
    encoding: 'utf-8',
    contentSelector: '.chapter-inner, .chapter-content',
    titleSelector: '.chapter-container h1, h1',
    nextChapterSelector: 'a.btn:contains("Next"), a[rel="next"]',
    prevChapterSelector: 'a.btn:contains("Previous")',
    adRemovalRules: ['.author-note-portlet', 'script', 'style', '.portlet', '.clear', '.chapter-footer']
  },

  canParse(url: string): boolean {
    return url.toLowerCase().includes('royalroad.com');
  },

  parse($: CheerioAPI, url: string): ParsedChapterResult {
    const nextUrl = extractNextChapterUrl($, url, this.siteProfile?.nextChapterSelector);

    let title = $('.chapter-container h1, h1').first().text().trim();
    if (!title) {
      title = $('title').text().split('-')[0].trim();
    }

    let novelTitle = $('h2 a[href*="/fiction/"]').first().text().trim() ||
                     $('.fiction-title').text().trim();

    const contentEl = $('.chapter-inner, .chapter-content').first().clone();

    // Remove author notes, donate links, rating boxes
    contentEl.find('.author-note-portlet, script, style, .portlet, .clear, .chapter-footer').remove();
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

