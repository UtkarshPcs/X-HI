import ReactMarkdown from 'react-markdown';
import { whatsappToMarkdown } from '../utils/whatsappFormat';

/**
 * Renders notice body authored in WhatsApp syntax by converting it to
 * Markdown for react-markdown. Use everywhere a notice body is displayed.
 */
export default function NoticeText({ children }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown>{whatsappToMarkdown(children || '')}</ReactMarkdown>
    </div>
  );
}
