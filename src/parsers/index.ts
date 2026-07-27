import { NovelParser } from './base';
import { Shuba69Parser } from './69shuba';
import { QidianParser } from './Qidian';
import { RoyalRoadParser } from './RoyalRoad';
import { NovelBinParser } from './NovelBin';
import { WuxiaWorldParser } from './WuxiaWorld';
import { BiqugeParser } from './Biquge';
import { GenericParser } from './GenericParser';
import { ParserInfo } from '../types';

export const ALL_PARSERS: NovelParser[] = [
  Shuba69Parser,
  QidianParser,
  RoyalRoadParser,
  NovelBinParser,
  WuxiaWorldParser,
  BiqugeParser,
  GenericParser // Generic always last as fallback
];

/**
 * Detects and returns the best matching novel parser for a given URL
 */
export function getParserForUrl(url: string): NovelParser {
  if (!url) return GenericParser;
  const matched = ALL_PARSERS.find(parser => parser.id !== 'generic' && parser.canParse(url));
  return matched || GenericParser;
}

/**
 * Returns metadata list of all supported parsers for UI display
 */
export function getParserList(): ParserInfo[] {
  return ALL_PARSERS.map(p => ({
    id: p.id,
    name: p.name,
    domains: p.domains,
    description: p.description,
    exampleUrl: p.exampleUrl
  }));
}
