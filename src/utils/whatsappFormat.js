// ─── WhatsApp-style formatting utility ───────────────────────────
// Notices are authored & stored in WhatsApp syntax so they copy 1:1
// into WhatsApp. For in-app display we convert WhatsApp → Markdown
// (react-markdown), because the two use different delimiters.
//
// WhatsApp syntax:
//   *bold*  _italic_  ~strike~  ```mono```  `inline`
//   - bullet / * bullet   1. numbered   > quote

// Toolbar definitions. `icon` is a lucide component name resolved by the UI.
export const FORMATS = [
  { id: 'bold',       icon: 'Bold',          title: 'Bold (*text*)',            wrap: ['*', '*'] },
  { id: 'italic',     icon: 'Italic',        title: 'Italic (_text_)',          wrap: ['_', '_'] },
  { id: 'strike',     icon: 'Strikethrough', title: 'Strikethrough (~text~)',   wrap: ['~', '~'] },
  { id: 'mono',       icon: 'Code2',         title: 'Monospace block (```)',    wrap: ['```', '```'] },
  { id: 'inlinecode', icon: 'Code',          title: 'Inline code (`text`)',     wrap: ['`', '`'] },
  { id: 'bullet',     icon: 'List',          title: 'Bulleted list (- text)',   line: '- ' },
  { id: 'numbered',   icon: 'ListOrdered',   title: 'Numbered list (1. text)',  line: '1. ' },
  { id: 'quote',      icon: 'Quote',         title: 'Block quote (> text)',     line: '> ' },
];

/**
 * Apply a format to a textarea value.
 * @returns { text, caretStart, caretEnd } — caller sets selectionRange.
 *
 * Wrap formats: if text is selected it's wrapped; if nothing is selected
 * the symbols are inserted empty with the caret placed BETWEEN them
 * (so the user types inside, not over a placeholder word).
 *
 * Line formats: each selected line (or the current line) is prefixed.
 */
export function applyFormat(body, selStart, selEnd, format) {
  const selected = body.slice(selStart, selEnd);

  if (format.wrap) {
    const [open, close] = format.wrap;
    if (selected) {
      const inserted = `${open}${selected}${close}`;
      const text = body.slice(0, selStart) + inserted + body.slice(selEnd);
      return { text, caretStart: selStart, caretEnd: selStart + inserted.length };
    }
    // Empty wrapper, caret between the symbols.
    const inserted = `${open}${close}`;
    const text = body.slice(0, selStart) + inserted + body.slice(selStart);
    const mid = selStart + open.length;
    return { text, caretStart: mid, caretEnd: mid };
  }

  // Line-prefix formats.
  const lineStart = body.lastIndexOf('\n', selStart - 1) + 1;
  const block = body.slice(lineStart, selEnd || selStart);
  const lines = (block || '').split('\n');
  const prefixed = lines.map((l) => format.line + l).join('\n');
  const text = body.slice(0, lineStart) + prefixed + body.slice(selEnd || selStart);
  const added = prefixed.length - block.length;
  return { text, caretStart: selStart + format.line.length, caretEnd: (selEnd || selStart) + added };
}

/**
 * Convert WhatsApp syntax → Markdown for react-markdown rendering.
 * Protects code spans first so emphasis rules don't fire inside them.
 */
export function whatsappToMarkdown(text) {
  if (!text) return '';
  const stash = [];
  const protect = (s) => { stash.push(s); return `\u0000${stash.length - 1}\u0000`; };

  let out = String(text);

  // Triple-backtick monospace → fenced code block.
  out = out.replace(/```([\s\S]+?)```/g, (_, code) => protect('```\n' + code.trim() + '\n```'));
  // Inline code `text` → keep as-is (markdown identical).
  out = out.replace(/`([^`\n]+?)`/g, (_, code) => protect('`' + code + '`'));

  // *bold* -> **bold**
  out = out.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, (_, pre, inner) => `${pre}**${inner}**`);
  // _italic_ -> *italic*
  out = out.replace(/(^|[^_\w])_([^_\n]+?)_(?!\w)/g, (_, pre, inner) => `${pre}*${inner}*`);
  // ~strike~ -> ~~strike~~
  out = out.replace(/(^|[^~\w])~([^~\n]+?)~(?!\w)/g, (_, pre, inner) => `${pre}~~${inner}~~`);

  // Restore protected spans.
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[Number(i)]);
  return out;
}

/** Plain-text preview (strip all formatting symbols) for push/OG snippets. */
export function stripFormatting(text, max = 160) {
  const t = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_~`>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return max && t.length > max ? t.slice(0, max - 1) + '…' : t;
}

/**
 * Copy a notice to clipboard in WhatsApp format + its share link.
 * Body is already WhatsApp syntax, so it pastes perfectly into WhatsApp.
 * @returns Promise<boolean> success
 */
export async function copyForWhatsApp(body, shareLink) {
  const text = shareLink ? `${body.trim()}\n\n${shareLink}` : body.trim();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
