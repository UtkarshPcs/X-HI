import { Bold, Italic, Strikethrough, Code2, Code, List, ListOrdered, Quote } from 'lucide-react';
import { FORMATS, applyFormat } from '../utils/whatsappFormat';

const ICONS = { Bold, Italic, Strikethrough, Code2, Code, List, ListOrdered, Quote };

/**
 * 8-button WhatsApp formatting toolbar bound to a textarea ref.
 * On click, applies the format and restores caret/selection.
 *
 * @param {{ textareaRef, body, setBody }} props
 */
export default function FormatToolbar({ textareaRef, body, setBody }) {
  function handle(format) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const { text, caretStart, caretEnd } = applyFormat(body, selectionStart, selectionEnd, format);
    setBody(text);
    requestAnimationFrame(() => {
      el.focus();
      try { el.setSelectionRange(caretStart, caretEnd); } catch { /* noop */ }
    });
  }

  return (
    <div className="fmt-toolbar">
      {FORMATS.map((f) => {
        const Icon = ICONS[f.icon];
        return (
          <button key={f.id} type="button" className="fmt-btn" title={f.title} onClick={() => handle(f)}>
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
