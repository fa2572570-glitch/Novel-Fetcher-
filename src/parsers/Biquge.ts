import type { CheerioAPI } from 'cheerio';
import { NovelParser, ParsedChapterResult, extractNextChapterUrl } from './base';

export const BiqugeParser: NovelParser = {
  id: 'biquge',
  name: 'Biquge (笔趣阁)',
  domains: ['biquge.tv', 'biquge.co', 'bqg.org', 'biquge5200.net', 'biquge.com.cn', 'biquge.biz', 'xbiquge.la'],
  description: 'Parser for Biquge and clone Chinese novel sites.',
  exampleUrl: 'https://www.biquge.co/book/123/456.html',
  siteProfile: {
    encoding: 'gbk',
    contentSelector: '#content, #htmlContent, .content',
    titleSelector: '.bookname h1, h1',
    nextChapterSelector: 'a:contains("下一章"), a:contains("下一页"), #next_url, .next_page',
    prevChapterSelector: 'a:contains("上一章"), a:contains("上一页")',
    adRemovalRules: ['script', 'style', 'a', 'p[style*="color"]', 'div[id*="ad"]']
  },

  canParse(url: string): boolean {
    const lower = url.toLowerCase();
    return this.domains.some(domain => lower.includes(domain)) || lower.includes('biquge') || lower.includes('bqg');
  },

  parse($: CheerioAPI, url: string): ParsedChapterResult {
    const nextUrl = extractNextChapterUrl($, url, this.siteProfile?.nextChapterSelector);

    let title = $('.bookname h1, h1').first().text().trim();
    if (!title) {
      title = $('title').text().split('-')[0].trim();
    }

    let novelTitle = $('.con_top a').eq(2).text().trim() || $('.path a').eq(1).text().trim();

    const contentEl = $('#content, #htmlContent, .content').first().clone();

    contentEl.find('script, style, a, p[style*="color"], div[id*="ad"]').remove();
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

