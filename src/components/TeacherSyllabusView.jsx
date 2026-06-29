import { useState, useEffect, useMemo } from 'react';
import { BookMarked, ChevronRight, Check, Plus, Trash2, Loader2 } from 'lucide-react';
import SyllabusProgressBar from './SyllabusProgressBar';
import {
  getSyllabus, getCompletedTopics, toggleCompletedTopic,
  addTopicToChapter, deleteTopicFromChapter, hideBaseTopic,
} from '../services/syllabusService';
import { chapterTopics } from '../data/syllabusStats';

/**
 * Teacher-facing syllabus manager.
 * Shows only the subjects the admin has granted (syllabusSubjects: string[]).
 * Teacher can: drill down subject → chapter → topics, add extra topics,
 * delete extra topics (soft-hide base topics), and toggle completed state.
 */
export default function TeacherSyllabusView({ syllabusSubjects = [] }) {
  const [sections, setSections]       = useState(null);
  const [completedList, setCompleted] = useState([]);
  const [subjectId, setSubjectId]     = useState(null);
  const [openChapter, setOpenChapter] = useState(null);
  const [addingTo, setAddingTo]       = useState(null); // chapterId
  const [newTopic, setNewTopic]       = useState('');
  const [busy, setBusy]               = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getSyllabus(), getCompletedTopics()])
      .then(([secs, completed]) => {
        if (!active) return;
        setSections(secs);
        setCompleted(completed);
      })
      .catch(() => { if (active) setSections([]); });
    return () => { active = false; };
  }, []);

  const completedSet = useMemo(() => new Set(completedList), [completedList]);

  // All subjects the teacher has access to, across all sections
  const grantedSubjects = useMemo(() => {
    if (!sections) return [];
    return sections.flatMap(sec =>
      sec.subjects
        .filter(sub => syllabusSubjects.includes(sub.subjectId))
        .map(sub => ({ ...sub, sectionName: sec.sectionName }))
    );
  }, [sections, syllabusSubjects]);

  const activeSubject = grantedSubjects.find(s => s.subjectId === subjectId) || null;

  async function handleToggleTopic(topicId) {
    setBusy(topicId);
    try {
      const updated = await toggleCompletedTopic(topicId, completedList);
      setCompleted(updated);
    } catch (err) { alert(err.message); }
    finally { setBusy(null); }
  }

  async function handleAddTopic(chapterId) {
    if (!newTopic.trim()) return;
    setBusy('add-' + chapterId);
    try {
      await addTopicToChapter(chapterId, newTopic.trim());
      const [secs, completed] = await Promise.all([getSyllabus(), getCompletedTopics()]);
      setSections(secs);
      setCompleted(completed);
      setNewTopic('');
      setAddingTo(null);
    } catch (err) { alert(err.message); }
    finally { setBusy(null); }
  }

  async function handleDeleteTopic(chapterId, topicId) {
    if (!confirm('Delete this topic?')) return;
    setBusy('del-' + topicId);
    try {
      const isExtra = topicId.includes('-x');
      if (isExtra) await deleteTopicFromChapter(chapterId, topicId);
      else await hideBaseTopic(topicId);
      const secs = await getSyllabus();
      setSections(secs);
    } catch (err) { alert(err.message); }
    finally { setBusy(null); }
  }

  if (sections === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (syllabusSubjects.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No syllabus subjects assigned yet. Ask the admin to grant access.</p>;
  }

  // ── Subject list ──────────────────────────────────────────────
  if (!activeSubject) {
    return (
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          Select a subject to manage its syllabus.
        </p>
        {grantedSubjects.map(sub => {
          const allTopics = sub.chapters.flatMap(ch => ch.topics);
          const done = allTopics.filter(t => completedSet.has(t.topicId)).length;
          const pct = allTopics.length ? Math.round((done / allTopics.length) * 100) : 0;
          return (
            <button
              key={sub.subjectId}
              className="syllabus-row"
              onClick={() => { setSubjectId(sub.subjectId); setOpenChapter(null); }}
            >
              <div className="syllabus-row-head">
                <h3 className="syllabus-row-title">{sub.subjectName}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub.sectionName}</span>
                <ChevronRight size={18} className="syllabus-row-chevron" />
              </div>
              <SyllabusProgressBar completed={pct} checked={0} sublabel={`${done}/${allTopics.length} completed`} size="sm" />
            </button>
          );
        })}
      </div>
    );
  }

  // ── Chapter + topic list ──────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <div className="syllabus-breadcrumb" style={{ marginBottom: '1rem' }}>
        <button className="syllabus-crumb-btn" onClick={() => { setSubjectId(null); setOpenChapter(null); }}>
          Subjects
        </button>
        <ChevronRight size={14} className="syllabus-crumb-sep" />
        <span className="syllabus-crumb-current">{activeSubject.subjectName}</span>
      </div>

      {activeSubject.chapters.map(chapter => {
        const topics = chapterTopics(chapter);
        const done = topics.filter(t => completedSet.has(t.topicId)).length;
        const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
        const isOpen = openChapter === chapter.chapterId;

        return (
          <div key={chapter.chapterId} className="syllabus-row" style={{ cursor: 'default' }}>
            <button
              onClick={() => setOpenChapter(isOpen ? null : chapter.chapterId)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
            >
              <div className="syllabus-row-head">
                <h3 className="syllabus-row-title">{chapter.chapterName}</h3>
                <ChevronRight
                  size={18}
                  className="syllabus-row-chevron"
                  style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                />
              </div>
              <SyllabusProgressBar completed={pct} checked={0} sublabel={`${done}/${topics.length} completed`} size="sm" />
            </button>

            {isOpen && (
              <div style={{ marginTop: '0.5rem' }}>
                {chapter.topics.map(topic => {
                  const isCompleted = completedSet.has(topic.topicId);
                  const isExtra = topic.topicId.includes('-x');
                  return (
                    <div
                      key={topic.topicId}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {/* Complete toggle */}
                      <button
                        onClick={() => handleToggleTopic(topic.topicId)}
                        disabled={!!busy}
                        title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                        style={{
                          width: 22, height: 22, borderRadius: 6, border: `2px solid ${isCompleted ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                          background: isCompleted ? '#10b981' : 'transparent', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          opacity: busy === topic.topicId ? 0.5 : 1,
                        }}
                      >
                        {isCompleted && <Check size={13} color="#fff" strokeWidth={3} />}
                      </button>

                      <span style={{ flex: 1, fontSize: '0.88rem', color: isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {topic.topicName}
                      </span>

                      {isCompleted && (
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Completed</span>
                      )}

                      {/* Delete button (extra topics: real delete; base topics: hide) */}
                      <button
                        onClick={() => handleDeleteTopic(chapter.chapterId, topic.topicId)}
                        disabled={!!busy}
                        title={isExtra ? 'Delete topic' : 'Hide topic'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', opacity: busy === 'del-' + topic.topicId ? 0.5 : 0.6 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* Add topic */}
                {addingTo === chapter.chapterId ? (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <input
                      className="as-search"
                      placeholder="Topic name…"
                      value={newTopic}
                      onChange={e => setNewTopic(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTopic(chapter.chapterId)}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <button
                      className="marks-btn approve"
                      onClick={() => handleAddTopic(chapter.chapterId)}
                      disabled={!!busy || !newTopic.trim()}
                      style={{ fontSize: '0.8rem' }}
                    >
                      {busy === 'add-' + chapter.chapterId ? '…' : 'Add'}
                    </button>
                    <button
                      className="marks-btn"
                      onClick={() => { setAddingTo(null); setNewTopic(''); }}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="marks-btn"
                    onClick={() => { setAddingTo(chapter.chapterId); setNewTopic(''); }}
                    style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                  >
                    <Plus size={13} /> Add Topic
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
