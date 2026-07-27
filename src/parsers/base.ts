import type { CheerioAPI } from 'cheerio';

export interface ParsedChapterResult {
  title: string;
  content: string;
  rawContent?: string;
  novelTitle?: string;
  chapterNum?: number;
  author?: string;
}

export interface NovelParser {
  id: string;
  name: string;
  domains: string[];
  description: string;
  exampleUrl: string;
  
  /**
   * Returns true if this parser can handle the given URL
   */
  canParse(url: string): boolean;

  /**
   * Parses raw HTML loaded into Cheerio instance ($) and returns structured chapter info
   */
  parse($: CheerioAPI, url: string): ParsedChapterResult;
}
