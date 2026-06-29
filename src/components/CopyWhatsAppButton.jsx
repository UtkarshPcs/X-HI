import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { copyForWhatsApp } from '../utils/whatsappFormat';

/**
 * Copies a notice (WhatsApp-formatted body + share link) to the clipboard.
 * @param {{ body: string, shareLink?: string }} props
 */
export default function CopyWhatsAppButton({ body, shareLink, style }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyForWhatsApp(body, shareLink);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy for WhatsApp (text + link)"
      className="notice-wa-copy"
      style={style}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? 'Copied!' : 'Copy for WhatsApp'}
    </button>
  );
}
