import TurndownService from 'turndown';

/**
 * Converts HTML to Markdown with intelligent format preservation.
 *
 * Supported conversions:
 * - <strong>, <b> → **text**
 * - <em>, <i> → *text*
 * - <u> → <u>text</u> (HTML passthrough)
 * - <ul><li> → - item
 * - <ol><li> → 1. item
 * - <a href=""> → [text](url)
 * - <h1>-<h3> → # / ## / ###
 *
 * @param html - HTML string from clipboard or external source
 * @returns Markdown string
 */
export function htmlToMarkdown(html: string): string {
  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });

    // Custom rule for underline (HTML passthrough since Markdown lacks underline)
    turndownService.addRule('underline', {
      filter: ['u'],
      replacement: (content) => `<u>${content}</u>`
    });

    // Strip classes, ids, and styles
    turndownService.remove(['script', 'style', 'noscript']);

    const markdown = turndownService.turndown(html);
    return markdown;
  } catch (error) {
    console.error('HTML to Markdown conversion failed:', error);
    // Fallback: return original HTML as plain text
    return html.replace(/<[^>]+>/g, '');
  }
}

/**
 * Sanitizes Markdown to prevent XSS attacks (defense-in-depth).
 * Note: react-markdown already sanitizes, this is an additional layer.
 *
 * @param markdown - User-generated Markdown string
 * @returns Sanitized Markdown string
 */
export function sanitizeMarkdown(markdown: string): string {
  try {
    // Strip dangerous HTML tags
    let sanitized = markdown;

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Remove other potentially dangerous tags
    sanitized = sanitized.replace(/<(object|embed|applet|meta|link)[^>]*>/gi, '');

    return sanitized;
  } catch (error) {
    console.error('Markdown sanitization failed:', error);
    return '';
  }
}

/**
 * Truncates Markdown text while preserving formatting.
 *
 * @param markdown - Markdown string
 * @param maxLength - Maximum character count
 * @returns Truncated Markdown with "..." if truncated
 */
export function truncateMarkdown(markdown: string, maxLength: number): string {
  try {
    if (markdown.length <= maxLength) {
      return markdown;
    }

    // Find word boundary
    let truncated = markdown.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      truncated = truncated.substring(0, lastSpace);
    }

    // Add ellipsis
    return truncated.trim() + '...';
  } catch (error) {
    console.error('Markdown truncation failed:', error);
    return markdown;
  }
}

/**
 * Removes all Markdown formatting, returning plain text.
 * Use case: Search indexing, preview generation
 *
 * @param markdown - Markdown string
 * @returns Plain text string
 */
export function stripMarkdown(markdown: string): string {
  try {
    let text = markdown;

    // Remove headers
    text = text.replace(/^#{1,6}\s+/gm, '');

    // Remove bold and italic
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove links [text](url)
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove images ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');

    // Remove blockquotes
    text = text.replace(/^\s*>\s+/gm, '');

    // Remove list markers
    text = text.replace(/^\s*[-*+]\s+/gm, '');
    text = text.replace(/^\s*\d+\.\s+/gm, '');

    // Remove HTML tags (in case any remain)
    text = text.replace(/<[^>]+>/g, '');

    return text.trim();
  } catch (error) {
    console.error('Markdown stripping failed:', error);
    return markdown;
  }
}
