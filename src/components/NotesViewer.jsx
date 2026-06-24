import { X, ExternalLink } from 'lucide-react';

export default function NotesViewer({ note, onClose }) {
  const pdfUrl = note.blobUrl;

  return (
    <div className="notes-viewer-overlay" onClick={onClose}>
      <div className="notes-viewer-modal" onClick={e => e.stopPropagation()}>
        <div className="notes-viewer-header">
          <div className="notes-viewer-title">
            <span>{note.title}</span>
            <span className="notes-viewer-meta">{note.subjectName} · {note.chapterName}</span>
          </div>
          <button className="notes-viewer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <object className="notes-viewer-frame" data={pdfUrl} type="application/pdf">
          <div className="notes-viewer-fallback">
            <p>PDF preview isn't available on this device.</p>
            <a
              href={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="auth-btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}
            >
              <ExternalLink size={15} /> Open in Google Docs
            </a>
          </div>
        </object>

        <div className="notes-viewer-footer">
          Uploaded by <strong>{note.uploaderName}</strong>
          <a href={pdfUrl} download target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ⬇ Download
          </a>
        </div>
      </div>
    </div>
  );
}
