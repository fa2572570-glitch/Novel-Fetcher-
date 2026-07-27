/**
 * Centralized Copy Engine optimized for Android Mobile Browsers (Mises, Kiwi, Chrome, Edge, Firefox)
 */

export interface CopyResult {
  success: boolean;
  methodUsed: 'clipboard_api' | 'exec_command' | 'fallback_required';
  error?: string;
}

/**
 * Ensures text is clean, plain UTF-8 string without escaped artifacts
 */
export function sanitizeTextForCopy(text: string): string {
  if (!text) return '';

  let str = text;

  // Decode hex & unicode escapes if present
  str = str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
           .replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Replace literal escaped character strings
  str = str.replace(/\\n/g, '\n')
           .replace(/\\r/g, '\r')
           .replace(/\\t/g, '\t')
           .replace(/\\"/g, '"')
           .replace(/\\'/g, "'")
           .replace(/\\\//g, '/');

  // Strip remaining HTML tags if any slipped through
  str = str.replace(/<[^>]*>/g, '');

  return str.trim();
}

/**
 * Robust copy helper with multi-stage fallback
 */
export async function performCopyToClipboard(text: string): Promise<CopyResult> {
  const cleanText = sanitizeTextForCopy(text);
  if (!cleanText) {
    return { success: false, methodUsed: 'fallback_required', error: 'Text content is empty' };
  }

  // Strategy 1: Modern Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(cleanText);
      return { success: true, methodUsed: 'clipboard_api' };
    } catch (err) {
      console.warn('Clipboard API failed on this browser/context, trying execCommand fallback:', err);
    }
  }

  // Strategy 2: Legacy execCommand('copy') with invisible textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = cleanText;

    // Fixed position to prevent mobile scroll shifts
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.fontSize = '16px'; // Prevents auto-zoom in Android Chrome/Safari

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // For iOS / Android text range selection compatibility
    textArea.setSelectionRange(0, textArea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      return { success: true, methodUsed: 'exec_command' };
    }
  } catch (err) {
    console.warn('execCommand copy failed:', err);
  }

  // Strategy 3: Both standard methods failed
  return { success: false, methodUsed: 'fallback_required', error: 'Clipboard write access blocked' };
}

/**
 * Triggers browser text file download as fallback
 */
export function downloadTextFile(filename: string, content: string): void {
  const clean = sanitizeTextForCopy(content);
  const blob = new Blob([clean], { type: 'text/plain;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
