import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { syllabusData } from '../data/syllabusData';
import { holidayData } from '../data/holidayData';
import { uploadNotePDF, submitNote } from '../services/notesService';
import { TEST_PHONE } from '../auth/roles';

const MAX_MB = 30;

// Group holidayData by unique subject names for the subject picker
const HH_SUBJECTS = [...new Set(holidayData.map(t => t.subject))];

export default function UploadNoteModal({ currentUser, onClose, onSuccess, defaultHHTask }) {
  // 'syllabus' | 'holiday-hw'
  const [mode, setMode] = useState(defaultHHTask ? 'holiday-hw' : 'syllabus');

  // Syllabus fields
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');

  // Holiday HW fields
  const [hhSubject, setHhSubject] = useState(defaultHHTask ? defaultHHTask.subject : '');
  const [hhTaskId,  setHhTaskId]  = useState(defaultHHTask ? String(defaultHHTask.id) : '');

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [file,     setFile]     = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [progress, setProgress] = useState('');
  const [err,      setErr]      = useState('');

  const selectedSection = syllabusData.find(s => s.sectionId === sectionId);
  const selectedSubject = selectedSection?.subjects.find(s => s.subjectId === subjectId);
  const selectedChapter = selectedSubject?.chapters.find(c => c.chapterId === chapterId);

  // Holiday HW tasks filtered by selected subject
  const hhTasksForSubject = holidayData.filter(t => t.subject === hhSubject);
  const selectedHHTask    = holidayData.find(t => String(t.id) === hhTaskId);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { setErr('Only PDF files are allowed.'); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setErr(`File must be under ${MAX_MB}MB.`); return; }
    setErr(''); setFile(f);
  }

  function switchMode(m) {
    setMode(m);
    setErr('');
    setSectionId(''); setSubjectId(''); setChapterId('');
    setHhSubject(''); setHhTaskId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');

    let payload;
    if (mode === 'syllabus') {
      if (!selectedSection || !selectedSubject || !selectedChapter) { setErr('Select section, subject and chapter.'); return; }
      payload = {
        sectionId:   selectedSection.sectionId,
        subjectId:   selectedSubject.subjectId,
        chapterId:   selectedChapter.chapterId,
        sectionName: selectedSection.sectionName,
        subjectName: selectedSubject.subjectName,
        chapterName: selectedChapter.chapterName,
      };
    } else {
      if (!selectedHHTask) { setErr('Select a homework item.'); return; }
      payload = {
        sectionId:   'holiday-hw',
        subjectId:   String(selectedHHTask.id),
        chapterId:   `hh-${selectedHHTask.id}`,
        sectionName: 'Holiday Homework',
        subjectName: selectedHHTask.subject,
        chapterName: `${selectedHHTask.subject} Answer`,
      };
    }

    if (!title.trim()) { setErr('Enter a title.'); return; }
    if (!file)         { setErr('Select a PDF file.'); return; }

    setBusy(true);
    try {
      setProgress('Uploading PDF…');
      const { url } = await uploadNotePDF(file);
      setProgress('Saving…');
      await submitNote({
        ...payload,
        title:         title.trim(),
        description:   desc.trim(),
        blobUrl:       url,
        uploaderPhone: currentUser.phone,
        uploaderName:  currentUser.name,
        isTest:        currentUser.phone === TEST_PHONE,
      });
      onSuccess();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <div className="notes-viewer-overlay" onClick={onClose}>
      <div className="notes-upload-modal" onClick={e => e.stopPropagation()}>
        <div className="notes-viewer-header">
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Upload Notes</span>
          <button className="notes-viewer-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="notes-upload-form">

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <button
              type="button"
              onClick={() => switchMode('syllabus')}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                background: mode === 'syllabus' ? 'var(--primary)' : 'var(--surface-hover)',
                color:      mode === 'syllabus' ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${mode === 'syllabus' ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              Syllabus Notes
            </button>
            <button
              type="button"
              onClick={() => switchMode('holiday-hw')}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                background: mode === 'holiday-hw' ? 'var(--tertiary, #f59e0b)' : 'var(--surface-hover)',
                color:      mode === 'holiday-hw' ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${mode === 'holiday-hw' ? 'var(--tertiary, #f59e0b)' : 'var(--border)'}`,
              }}
            >
              🏖 Holiday Homework
            </button>
          </div>

          {/* ── SYLLABUS MODE ── */}
          {mode === 'syllabus' && <>
            <label className="notes-upload-label">Section</label>
            <select className="notes-upload-select" value={sectionId}
              onChange={e => { setSectionId(e.target.value); setSubjectId(''); setChapterId(''); }} required>
              <option value="">— Select section —</option>
              {syllabusData.map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
            </select>

            <label className="notes-upload-label">Subject</label>
            <select className="notes-upload-select" value={subjectId}
              onChange={e => { setSubjectId(e.target.value); setChapterId(''); }}
              disabled={!sectionId} required>
              <option value="">— Select subject —</option>
              {(selectedSection?.subjects || []).map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
            </select>

            <label className="notes-upload-label">Chapter</label>
            <select className="notes-upload-select" value={chapterId}
              onChange={e => setChapterId(e.target.value)}
              disabled={!subjectId} required>
              <option value="">— Select chapter —</option>
              {(selectedSubject?.chapters || []).map(c => <option key={c.chapterId} value={c.chapterId}>{c.chapterName}</option>)}
            </select>
          </>}

          {/* ── HOLIDAY HW MODE ── */}
          {mode === 'holiday-hw' && <>
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem', marginBottom: '0.5rem',
              fontSize: '0.82rem', color: 'var(--text-secondary)',
            }}>
              Upload your answer/solution as a PDF for a holiday homework item.
            </div>

            <label className="notes-upload-label">Subject</label>
            <select className="notes-upload-select" value={hhSubject}
              onChange={e => { setHhSubject(e.target.value); setHhTaskId(''); }} required>
              <option value="">— Select subject —</option>
              {HH_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="notes-upload-label">Homework Item</label>
            <select className="notes-upload-select" value={hhTaskId}
              onChange={e => setHhTaskId(e.target.value)}
              disabled={!hhSubject} required>
              <option value="">— Select homework item —</option>
              {hhTasksForSubject.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.subject}{hhTasksForSubject.length > 1 ? ` — ${t.message.slice(0, 40)}` : ''}
                </option>
              ))}
            </select>
          </>}

          {/* Common fields */}
          <label className="notes-upload-label">Title</label>
          <input className="auth-input" placeholder="e.g. My answer / solved copy"
            value={title} onChange={e => setTitle(e.target.value)} required maxLength={80} />

          <label className="notes-upload-label">Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input className="auth-input" placeholder="Short description"
            value={desc} onChange={e => setDesc(e.target.value)} maxLength={160} />

          <label className="notes-upload-label">PDF File <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(max {MAX_MB}MB)</span></label>
          <label className="notes-file-picker">
            <input type="file" accept="application/pdf" onChange={handleFile} style={{ display: 'none' }} />
            <Upload size={16} />
            {file ? <span style={{ color: 'var(--text-primary)' }}>{file.name}</span> : <span>Click to select PDF</span>}
          </label>

          {err      && <p className="auth-err">{err}</p>}
          {progress && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {progress}
            </p>
          )}

          <button className="auth-btn primary" type="submit" disabled={busy} style={{ marginTop: '0.25rem' }}>
            {busy ? 'Uploading…' : 'Submit for Review'}
          </button>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            You'll earn <strong>4 ✦ Sparks</strong> when the admin approves your submission.
          </p>
        </form>
      </div>
    </div>
  );
}
