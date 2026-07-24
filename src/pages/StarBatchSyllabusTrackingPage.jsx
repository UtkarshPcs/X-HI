import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { syllabusData } from '../data/syllabusData';
import { getSyllabusProgress, toggleTaskCompletion } from '../services/starBatchTrackingService';
import { useAuth } from '../auth/AuthContext';
import { Target, ChevronRight, ChevronLeft, CheckCircle, Circle, LayoutList } from 'lucide-react';

export const SYLLABUS_CHECKLIST = [
  { id: 'ncert-reading', label: 'NCERT Reading' },
  { id: 'ncert-exercise', label: 'NCERT Exercise' },
  { id: 'class-notes', label: 'Class Notes' },
  { id: 'formula-revision', label: 'Formula / Important Points Revision' },
  { id: 'pyq', label: 'PYQ Practice' },
  { id: 'qb', label: 'Question Bank Practice' },
  { id: 'advanced-q', label: 'Advanced Questions Practice' },
  { id: 'sample-paper', label: 'Sample Paper Questions' },
  { id: 'revision-1', label: 'Revision 1' },
  { id: 'revision-2', label: 'Revision 2' },
  { id: 'doubts', label: 'Doubts Cleared' },
];

export default function StarBatchSyllabusTrackingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { sectionId, subjectId, chapterId } = useParams();

  const [completedTasks, setCompletedTasks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    if (!currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch) {
      navigate('/star-batch');
      return;
    }
    fetchProgress();
  }, [currentUser, navigate]);

  async function fetchProgress() {
    setLoading(true);
    try {
      const data = await getSyllabusProgress(currentUser.id);
      setCompletedTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- Progress Calculations ---
  const totalTasksPerChapter = SYLLABUS_CHECKLIST.length;

  const calculateChapterProgress = (chapId) => {
    let count = 0;
    SYLLABUS_CHECKLIST.forEach(task => {
      if (completedTasks[`${chapId}-${task.id}`]) count++;
    });
    return { completed: count, total: totalTasksPerChapter, percentage: count === 0 ? 0 : Math.round((count / totalTasksPerChapter) * 100) };
  };

  const calculateSubjectProgress = (subId) => {
    let completed = 0;
    let total = 0;
    const section = syllabusData.find(sec => sec.subjects.some(s => s.subjectId === subId));
    if (section) {
      const subject = section.subjects.find(s => s.subjectId === subId);
      if (subject) {
        subject.chapters.forEach(chap => {
          const cp = calculateChapterProgress(chap.chapterId);
          completed += cp.completed;
          total += cp.total;
        });
      }
    }
    return { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
  };

  const calculateSectionProgress = (secId) => {
    let completed = 0;
    let total = 0;
    const section = syllabusData.find(sec => sec.sectionId === secId);
    if (section) {
      section.subjects.forEach(sub => {
        const sp = calculateSubjectProgress(sub.subjectId);
        completed += sp.completed;
        total += sp.total;
      });
    }
    return { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
  };

  const calculateOverallProgress = () => {
    let completed = 0;
    let total = 0;
    syllabusData.forEach(sec => {
      const sp = calculateSectionProgress(sec.sectionId);
      completed += sp.completed;
      total += sp.total;
    });
    return { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
  };

  // --- UI Components ---
  const ProgressBar = ({ percentage, color = "#fbbf24" }) => (
    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' }}>
      <div style={{ height: '100%', width: `${percentage}%`, background: color, transition: 'width 0.3s ease' }} />
    </div>
  );

  const Breadcrumb = () => {
    const section = syllabusData.find(s => s.sectionId === sectionId);
    const subject = section?.subjects.find(s => s.subjectId === subjectId);
    const chapter = subject?.chapters.find(c => c.chapterId === chapterId);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/star-batch" style={{ color: 'inherit', textDecoration: 'none' }}>Star Batch</Link>
        <ChevronRight size={14} />
        <Link to="/star-tracking" style={{ color: sectionId ? 'inherit' : '#fbbf24', textDecoration: 'none' }}>Syllabus Tracking</Link>
        {sectionId && (
          <>
            <ChevronRight size={14} />
            <Link to={`/star-tracking/${sectionId}`} style={{ color: subjectId ? 'inherit' : '#fbbf24', textDecoration: 'none' }}>{section?.sectionName}</Link>
          </>
        )}
        {subjectId && (
          <>
            <ChevronRight size={14} />
            <Link to={`/star-tracking/${sectionId}/${subjectId}`} style={{ color: chapterId ? 'inherit' : '#fbbf24', textDecoration: 'none' }}>{subject?.subjectName}</Link>
          </>
        )}
        {chapterId && (
          <>
            <ChevronRight size={14} />
            <span style={{ color: '#fbbf24' }}>{chapter?.chapterName}</span>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="loader" />
      </div>
    );
  }

  // LEVEL 4: Checklist
  if (chapterId) {
    const section = syllabusData.find(s => s.sectionId === sectionId);
    const subject = section?.subjects.find(s => s.subjectId === subjectId);
    const chapter = subject?.chapters.find(c => c.chapterId === chapterId);

    if (!chapter) return <div>Chapter not found.</div>;

    const progress = calculateChapterProgress(chapterId);

    const toggleTask = async (taskId, currentStatus) => {
      // Optimistic update
      const key = `${chapterId}-${taskId}`;
      const newStatus = !currentStatus;
      setCompletedTasks(prev => {
        const next = { ...prev };
        if (newStatus) next[key] = true;
        else delete next[key];
        return next;
      });

      try {
        const updated = await toggleTaskCompletion(currentUser.id, chapterId, taskId, newStatus);
        setCompletedTasks(updated);
      } catch (err) {
        console.error(err);
        // Revert optimistic on error could be implemented here
      }
    };

    return (
      <div style={{ animation: 'fade-in 0.4s ease' }}>
        <Breadcrumb />
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Back
        </button>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#fff' }}>{chapter.chapterName}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            <span>Chapter Progress</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{progress.completed}/{progress.total} ({progress.percentage}%)</span>
          </div>
          <ProgressBar percentage={progress.percentage} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {SYLLABUS_CHECKLIST.map(task => {
            const isCompleted = !!completedTasks[`${chapterId}-${task.id}`];
            return (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id, isCompleted)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isCompleted ? (
                  <CheckCircle size={24} color="#10b981" />
                ) : (
                  <Circle size={24} color="rgba(255,255,255,0.2)" />
                )}
                <span style={{ fontSize: '1rem', color: isCompleted ? '#fff' : 'rgba(255,255,255,0.8)', textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.7 : 1 }}>
                  {task.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LEVEL 3: Chapters
  if (subjectId) {
    const section = syllabusData.find(s => s.sectionId === sectionId);
    const subject = section?.subjects.find(s => s.subjectId === subjectId);

    if (!subject) return <div>Subject not found.</div>;
    const progress = calculateSubjectProgress(subjectId);

    return (
      <div style={{ animation: 'fade-in 0.4s ease' }}>
        <Breadcrumb />
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Back
        </button>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#fff' }}>{subject.subjectName} Chapters</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            <span>Subject Progress</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{progress.completed}/{progress.total} ({progress.percentage}%)</span>
          </div>
          <ProgressBar percentage={progress.percentage} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {subject.chapters.map(chapter => {
            const cp = calculateChapterProgress(chapter.chapterId);
            return (
              <div 
                key={chapter.chapterId}
                onClick={() => navigate(`/star-tracking/${sectionId}/${subjectId}/${chapter.chapterId}`)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{chapter.chapterName}</h3>
                  <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                  <span>{cp.completed}/{cp.total} Tasks</span>
                  <span>{cp.percentage}%</span>
                </div>
                <ProgressBar percentage={cp.percentage} color={cp.percentage === 100 ? '#10b981' : '#fbbf24'} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LEVEL 2: Subjects
  if (sectionId) {
    const section = syllabusData.find(s => s.sectionId === sectionId);
    if (!section) return <div>Section not found.</div>;
    const progress = calculateSectionProgress(sectionId);

    return (
      <div style={{ animation: 'fade-in 0.4s ease' }}>
        <Breadcrumb />
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Back
        </button>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#fff' }}>{section.sectionName} Subjects</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            <span>Section Progress</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{progress.completed}/{progress.total} ({progress.percentage}%)</span>
          </div>
          <ProgressBar percentage={progress.percentage} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {section.subjects.map(subject => {
            const sp = calculateSubjectProgress(subject.subjectId);
            return (
              <div 
                key={subject.subjectId}
                onClick={() => navigate(`/star-tracking/${sectionId}/${subject.subjectId}`)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{subject.subjectName}</h3>
                  <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                  <span>{sp.completed}/{sp.total} Tasks</span>
                  <span>{sp.percentage}%</span>
                </div>
                <ProgressBar percentage={sp.percentage} color={sp.percentage === 100 ? '#10b981' : '#fbbf24'} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LEVEL 1: Sections (Root)
  const overallProgress = calculateOverallProgress();

  return (
    <div style={{ animation: 'fade-in 0.4s ease' }}>
      <Breadcrumb />
      <button onClick={() => navigate('/star-batch')} style={{ background: 'none', border: 'none', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem', fontWeight: 600 }}>
        <ChevronLeft size={16} /> Back to Star Batch
      </button>

      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Target size={32} color="#fbbf24" />
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#fff' }}>Syllabus Tracking</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>Track your syllabus completion from the highest level down to individual study tasks.</p>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            <span>Overall Syllabus Progress</span>
            <span style={{ fontWeight: 700, color: '#fbbf24' }}>{overallProgress.completed}/{overallProgress.total} ({overallProgress.percentage}%)</span>
          </div>
          <ProgressBar percentage={overallProgress.percentage} color="#fbbf24" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {syllabusData.map(section => {
          const sp = calculateSectionProgress(section.sectionId);
          return (
            <div 
              key={section.sectionId}
              onClick={() => navigate(`/star-tracking/${section.sectionId}`)}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LayoutList size={18} color="#fbbf24" />
                  {section.sectionName}
                </h3>
                <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>
                <span>{sp.completed}/{sp.total} Tasks</span>
                <span>{sp.percentage}%</span>
              </div>
              <ProgressBar percentage={sp.percentage} color={sp.percentage === 100 ? '#10b981' : '#fbbf24'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
