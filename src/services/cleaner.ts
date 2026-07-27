import { decode } from 'html-entities';
import { CleaningRules } from '../types';

export const DEFAULT_CLEANING_RULES: CleaningRules = {
  removeAds: true,
  removeNavLinks: true,
  removeWatermarks: true,
  decodeEntities: true,
  normalizeQuotes: true,
  removeEmptyLines: true,
  preserveMarkdownFormatting: true,
  customRegexes: [
    // Standard promotional phrases
    '(?i)(please support the author|read uninterrupted on|visit novelbin|69书吧|69shuba|www\\..*?\\.com|http[s]?://\\S+)',
  ]
};

/**
 * Common advertisement, watermark, and navigation patterns
 */
const COMMON_NOISE_PATTERNS = [
  // English promotional/watermark lines
  /Read (only|latest chapters) at [a-zA-Z0-9.\-/]+/gi,
  /Visit [a-zA-Z0-9.\-/]+ for (more|extra|latest) chapters/gi,
  /This novel (was|is) (translated|posted|published) on [a-zA-Z0-9.\-/]+/gi,
  /If you (find|see) any errors \( broken links, non-standard content, etc.. \), please let us know/gi,
  /support the translator/gi,
  /Previous Chapter\s*\|\s*Next Chapter/gi,
  /Next Chapter\s*\|\s*Table of Contents/gi,
  /\[Previous Chapter\]\s*\[Table of Contents\]\s*\[Next Chapter\]/gi,
  /Bookmark this page to receive updates/gi,
  /Chapter \d+ - [^\n]+ \([a-zA-Z0-9.\-]+\)/gi,

  // Chinese novel promotional/watermark lines
  /69书吧\s*www\.69shuba\.[a-z]+/gi,
  /69\s*书\s*吧/gi,
  /【69书吧\s*www\.69shuba\.[a-z]+】/gi,
  /本书由\s*.*?\s*整理/gi,
  /请到.*?阅读最新章节/gi,
  /无弹窗.*?阅读/gi,
  /点击下一页继续阅读/gi,
  /上一页\s*\|\s*返回目录\s*\|\s*下一页/gi,
  /上一章\s*\|\s*目录\s*\|\s*下一章/gi,
  /首发\s*官网/gi,
];

/**
 * Powerful Cleaning Engine
 */
export function cleanChapterContent(
  rawText: string,
  rules: CleaningRules = DEFAULT_CLEANING_RULES
): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Decode HTML entities if present (e.g. &nbsp;, &quot;, &#39;)
  if (rules.decodeEntities) {
    text = decode(text);
  }

  // 2. Replace multiple carriage returns / newlines
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Normalize whitespace on individual lines
  const lines = text.split('\n');
  let cleanedLines: string[] = [];

  for (let line of lines) {
    line = line.trim();

    if (!line) {
      if (!rules.removeEmptyLines) {
        cleanedLines.push('');
      }
      continue;
    }

    // Check for ad and watermark noise
    if (rules.removeAds || rules.removeWatermarks || rules.removeNavLinks) {
      let isNoise = false;
      for (const pattern of COMMON_NOISE_PATTERNS) {
        if (pattern.test(line)) {
          isNoise = true;
          break;
        }
      }
      if (isNoise) continue;
    }

    // Custom regex rules
    if (rules.customRegexes && rules.customRegexes.length > 0) {
      let isCustomNoise = false;
      for (const regexStr of rules.customRegexes) {
        if (!regexStr || regexStr.trim().length === 0) continue;
        try {
          // Check flags or standard regex
          const re = new RegExp(regexStr.replace(/^\(\?i\)/, ''), regexStr.startsWith('(?i)') ? 'gi' : 'g');
          if (re.test(line)) {
            // Remove matched portion or skip whole line if it's purely noise
            const stripped = line.replace(re, '').trim();
            if (!stripped) {
              isCustomNoise = true;
              break;
            } else {
              line = stripped;
            }
          }
        } catch {
          // Invalid user regex, skip
        }
      }
      if (isCustomNoise) continue;
    }

    // Normalize quotes if enabled
    if (rules.normalizeQuotes) {
      // Replace straight double quotes with curly quotes, or standardize quotes
      line = line
        .replace(/""/g, '"')
        .replace(/''/g, "'");
    }

    cleanedLines.push(line);
  }

  // 4. Rejoin with clean double linebreaks for novel paragraphs
  let result = cleanedLines.join('\n\n');

  // Collapse 3+ consecutive newlines into double newlines
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
}

/**
 * Calculates word count accurately for English (space-separated) and Asian CJK characters.
 */
export function countWordsAndChars(text: string): { wordCount: number; charCount: number } {
  if (!text) return { wordCount: 0, charCount: 0 };

  const charCount = text.length;

  // CJK character count match
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff]/g) || [];
  const cjkCount = cjkMatches.length;

  // Non-CJK words match
  const englishText = text.replace(/[\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff]/g, ' ');
  const englishWords = englishText.trim().split(/\s+/).filter(w => w.length > 0).length;

  return {
    wordCount: cjkCount + englishWords,
    charCount
  };
}

/**
 * Converts cleaned text into requested format (Plain Text, Markdown, HTML)
 */
export function formatChapterOutput(
  title: string,
  content: string,
  format: 'plaintext' | 'markdown' | 'html',
  headerTemplate?: string
): string {
  const cleanTitle = title.trim() || 'Untitled Chapter';
  const cleanContent = content.trim();

  if (format === 'markdown') {
    return `# ${cleanTitle}\n\n${cleanContent}\n`;
  }

  if (format === 'html') {
    const paragraphs = cleanContent
      .split('\n\n')
      .map(p => `  <p>${escapeHtml(p)}</p>`)
      .join('\n');
    return `<article>\n  <h2>${escapeHtml(cleanTitle)}</h2>\n${paragraphs}\n</article>`;
  }

  // Plaintext (default)
  if (headerTemplate && headerTemplate.includes('{title}')) {
    return headerTemplate.replace('{title}', cleanTitle) + cleanContent;
  }

  return `--------------------------------\n${cleanTitle}\n--------------------------------\n\n${cleanContent}\n`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
