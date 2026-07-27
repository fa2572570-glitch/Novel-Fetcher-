import type { CheerioAPI } from 'cheerio';
import { SiteProfile } from '../types';

export interface ParsedChapterResult {
  title: string;
  content: string;
  rawContent?: string;
  novelTitle?: string;
  chapterNum?: number;
  author?: string;
  nextUrl?: string;
  prevUrl?: string;
}

export interface NovelParser {
  id: string;
  name: string;
  domains: string[];
  description: string;
  exampleUrl: string;
  siteProfile?: SiteProfile;
  
  /**
   * Returns true if this parser can handle the given URL
   */
  canParse(url: string): boolean;

  /**
   * Parses raw HTML loaded into Cheerio instance ($) and returns structured chapter info
   */
  parse($: CheerioAPI, url: string): ParsedChapterResult;
}

/**
 * Universal Next Chapter URL Extraction Engine
 * Searches site-specific selectors first, then falls back to rel="next", text matching, and navigation links.
 */
export function extractNextChapterUrl($: CheerioAPI, currentUrl: string, customSelector?: string): string | undefined {
  if (!currentUrl) return undefined;

  let href: string | undefined;

  // 1. Try custom site-profile selector first
  if (customSelector) {
    const customEl = $(customSelector).first();
    if (customEl.length) {
      href = customEl.attr('href') || customEl.find('a').attr('href');
    }
  }

  // 2. Try rel="next" attribute
  if (!href) {
    href = $('a[rel~="next"]').first().attr('href') ||
           $('link[rel="next"]').first().attr('href') ||
           $('a[rel="next"]').first().attr('href');
  }

  // 3. Search common pagination / next chapter containers
  if (!href) {
    const commonSelectors = [
      '.page1 a:contains("下一章")',
      '.page1 a:contains("下一頁")',
      '.page1 a:nth-child(3)',
      '.bottom_tools a:contains("下一章")',
      '#next_url',
      '.next-chapter',
      '.next_page',
      'a.next',
      'a.btn-next',
      '.nav-next a',
      '#next_page',
      '.chapter-nav a:contains("Next")'
    ];

    for (const sel of commonSelectors) {
      const found = $(sel).first();
      if (found.length) {
        href = found.attr('href');
        if (href) break;
      }
    }
  }

  // 4. Fallback: Search all <a> links for matching text (Chinese & English)
  if (!href) {
    const nextRegex = /(?:下一章|下一頁|下一页|下页|下頁|next chapter|next page|next\s*>|>>|›|»)/i;
    $('a').each((_, el) => {
      if (href) return;
      const text = $(el).text().trim();
      const title = $(el).attr('title') || '';
      const aria = $(el).attr('aria-label') || '';
      if (nextRegex.test(text) || nextRegex.test(title) || nextRegex.test(aria)) {
        const h = $(el).attr('href');
        // Ignore javascript: or # anchors or same URL
        if (h && !h.startsWith('javascript') && !h.startsWith('#')) {
          href = h;
        }
      }
    });
  }

  if (!href || href === '#' || href.startsWith('javascript')) {
    return undefined;
  }

  // Resolve absolute URL
  try {
    const absoluteUrl = new URL(href, currentUrl).href;
    // Don't return self-referencing links
    if (absoluteUrl === currentUrl) return undefined;
    return absoluteUrl;
  } catch {
    return undefined;
  }
}

