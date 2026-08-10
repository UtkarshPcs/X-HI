import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { syllabusData } from '../data/syllabusData';
import { getSyllabusProgress, toggleTaskCompletion, getTrackingConfig } from '../services/starBatchTrackingService';
import { processSyllabusChatQuery, transcribeAudio } from '../services/llmService';
import { useAuth } from '../auth/AuthContext';
import { Target, ChevronRight, ChevronLeft, CheckCircle, Circle, LayoutList, Bot, Send, Sparkles, Mic, Square } from 'lucide-react';

export default function StarBatchSyllabusTrackingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { sectionId, subjectId, chapterId } = useParams();

  const [completedTasks, setCompletedTasks] = useState({});
  const [trackingConfig, setTrackingConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      const [data, config] = await Promise.all([
        getSyllabusProgress(currentUser.phone),
        getTrackingConfig()
      ]);
      setCompletedTasks(data);
      setTrackingConfig(config);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- Progress Calculations ---
  const getTasksForSection = (secId) => {
    if (!trackingConfig) return [];
    const globalTasks = trackingConfig.globalChecklist || [];
    const sectionTasks = trackingConfig.sectionChecklists?.[secId] || [];
    return [...globalTasks, ...sectionTasks];
  };

  const calculateChapterProgress = (chapId, secId) => {
    let count = 0;
    const tasks = getTasksForSection(secId);
    tasks.forEach(task => {
      if (completedTasks[`${chapId}-${task.id}`]) count++;
    });
    const total = tasks.length;
    return { completed: count, total, percentage: total === 0 ? 0 : Math.round((count / total) * 100) };
  };

  const calculateSubjectProgress = (subId) => {
    let completed = 0;
    let total = 0;
    const section = syllabusData.find(sec => sec.subjects.some(s => s.subjectId === subId));
    if (section) {
      const subject = section.subjects.find(s => s.subjectId === subId);
      if (subject) {
        subject.chapters.forEach(chap => {
          const cp = calculateChapterProgress(chap.chapterId, section.sectionId);
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

  if (loading || !trackingConfig) {
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

    const progress = calculateChapterProgress(chapterId, sectionId);
    const tasks = getTasksForSection(sectionId);

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
        const updated = await toggleTaskCompletion(currentUser.phone, chapterId, taskId, newStatus);
        if (updated) {
          setCompletedTasks(updated);
        }
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
          {tasks.map(task => {
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
            const cp = calculateChapterProgress(chapter.chapterId, section.sectionId);
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

  const processChat = async (queryText) => {
    setIsChatLoading(true);
    setChatResponse(null);
    try {
      const result = await processSyllabusChatQuery(queryText, syllabusData);
      
      if (result.chaptersToUpdate && result.chaptersToUpdate.length > 0) {
        let updatedData = { ...completedTasks };
        
        for (const chapId of result.chaptersToUpdate) {
          let targetSecId = null;
          for (const sec of syllabusData) {
            for (const sub of sec.subjects) {
              if (sub.chapters.some(c => c.chapterId === chapId)) {
                targetSecId = sec.sectionId;
                break;
              }
            }
            if (targetSecId) break;
          }

          if (targetSecId) {
            const tasks = getTasksForSection(targetSecId);
            for (const task of tasks) {
              const key = `${chapId}-${task.id}`;
              updatedData[key] = true;
              await toggleTaskCompletion(currentUser.phone, chapId, task.id, true);
            }
          }
        }
        setCompletedTasks(updatedData);
      }
      setChatResponse(result.message);
      setChatInput('');
    } catch (err) {
      console.error(err);
      setChatResponse("Sorry, I couldn't process that. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    await processChat(chatInput);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        setIsChatLoading(true);
        try {
          const text = await transcribeAudio(audioBlob);
          setChatInput(text);
          await processChat(text);
        } catch (err) {
          console.error(err);
          setChatResponse("Failed to transcribe audio. Please try typing instead.");
          setIsChatLoading(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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

      {/* AI Syllabus Update Chat */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Sparkles size={20} color="#a78bfa" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Smart Track with AI</h2>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
          Just tell me what chapters you completed today, and I'll update your syllabus progress automatically!
        </p>
        
        <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: chatResponse ? '1rem' : '0' }}>
          <button 
            type="button" 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isChatLoading && !isRecording}
            style={{ 
              background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', 
              color: isRecording ? '#ef4444' : 'var(--primary)', 
              border: `1px solid ${isRecording ? '#ef4444' : 'rgba(139, 92, 246, 0.3)'}`, 
              borderRadius: '12px', 
              padding: '0 1rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s',
              animation: isRecording ? 'pulse 1.5s infinite' : 'none'
            }}
            title={isRecording ? "Stop Recording" : "Use Voice Input"}
          >
            {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
          </button>
          
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isRecording ? "Listening... click stop when done" : "e.g., I completed Light reflection today"}
            disabled={isChatLoading || isRecording}
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
          />
          <button type="submit" disabled={isChatLoading || !chatInput.trim()} style={{ background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isChatLoading || !chatInput.trim()) ? 0.5 : 1 }}>
            {isChatLoading ? <span className="loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <Send size={18} />}
          </button>
        </form>

        {chatResponse && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '1rem', color: '#10b981', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Bot size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{chatResponse}</span>
          </div>
        )}
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
