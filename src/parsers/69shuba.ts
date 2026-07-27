import type { CheerioAPI } from 'cheerio';
import { NovelParser, ParsedChapterResult } from './base';

export const Shuba69Parser: NovelParser = {
  id: '69shuba',
  name: '69Shuba (69书吧)',
  domains: ['69shuba.com', '69xinshu.com', '69shuba.cx', '69shuba.pro', '69shuba.tw', '69shu.com'],
  description: 'Specialized parser for 69shuba Chinese novel platform with GBK encoding support and noise removal.',
  exampleUrl: 'https://www.69shuba.com/txt/12345/67890',

  canParse(url: string): boolean {
    const lower = url.toLowerCase();
    return this.domains.some(domain => lower.includes(domain));
  },

  parse($: CheerioAPI, url: string): ParsedChapterResult {
    // Extract title from .txtnav h1 or h1 or title tag
    let title = $('.txtnav h1').text().trim() ||
                $('#txtnav h1').text().trim() ||
                $('h1').first().text().trim();

    if (!title) {
      title = $('title').text().split('-')[0].trim() || 'Untitled Chapter';
    }

    // Novel Title extraction from breadcrumbs or meta
    let novelTitle = $('.txtnav .title a').first().text().trim() ||
                     $('.txtnav .a_title').text().trim() ||
                     $('.yuedu_ziqu a').eq(1).text().trim();

    // Content container
    const contentEl = $('.txtnav, #txtnav, .content, #content, .read-content').first().clone();

    // Remove noise elements inside contentEl
    contentEl.find('h1, .txtright, .bottom_tools, .page_tools, script, style, .page1, .top_nav, .clear, .a_title, .txtnav_head').remove();
    contentEl.find('a[href*="69shuba"], div[class*="ad"], div[id*="ad"]').remove();

    // Convert <br> or <p> tags into newlines
    contentEl.find('br').replaceWith('\n');
    contentEl.find('p').each((_, el) => {
      $(el).append('\n\n');
    });

    let rawText = contentEl.text().trim();

    // Clean up title if repeated at top of text
    if (title && rawText.startsWith(title)) {
      rawText = rawText.substring(title.length).trim();
    }

    // Try extracting chapter number from title (e.g., 第251章 / Chapter 251)
    const chapNumMatch = title.match(/(?:第|chapter\s*)\s*(\d+)/i);
    const chapterNum = chapNumMatch ? parseInt(chapNumMatch[1], 10) : undefined;

    return {
      title,
      content: rawText,
      novelTitle: novelTitle || undefined,
      chapterNum
    };
  }
};
