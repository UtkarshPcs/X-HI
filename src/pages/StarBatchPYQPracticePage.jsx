import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { syllabusData } from '../data/syllabusData';
import { createPYQTest } from '../services/pyqPracticeService';
import { Target, Play, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function StarBatchPYQPracticePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const [testConfig, setTestConfig] = useState({ 
    mode: 'objective', 
    difficulty: 2, 
    count: 10, 
    marks: 20, 
    objLevel: 2, 
    subjLevel: 2, 
    objCount: 10, 
    subjMarks: 20 
  });

  useEffect(() => {
    if (!currentUser) navigate('/');
    else if (!currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch) navigate('/star-batch');
  }, [currentUser, navigate]);

  const handleGenerate = async () => {
    if (!selectedChapter) {
      alert("Please select a chapter first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const userId = currentUser.id || currentUser.phone;
      const testId = await createPYQTest(userId, { ...testConfig, chapterId: selectedChapter });
      navigate(`/star-pyq-test/${testId}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .tm-header { margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; }
        .tm-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0; }
        .tm-subtitle { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin: 0.2rem 0 0; }
        .tm-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .tm-back:hover { background: rgba(255,255,255,0.1); }
        .tm-btn { width: 100%; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: none; border-radius: 10px; padding: 1rem; color: #000; font-weight: 800; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; margin-top: 1rem; }
        .tm-btn:hover { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); transform: scale(1.02); }
        .tm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      <div className="tm-header">
        <button className="tm-back" onClick={() => navigate('/star-batch')}><ArrowLeft size={18} /></button>
        <div>
          <h2 className="tm-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={24} color="#fbbf24" /> PYQ Practice Module
          </h2>
          <p className="tm-subtitle">Generate custom previous year question tests from the Universal Database.</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', color: '#fbbf24', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} /> PYQ Test Generator
        </h3>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>1. Select Section</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {syllabusData.map(sec => (
              <button key={sec.sectionId} onClick={() => { setSelectedSection(sec.sectionId); setSelectedSubject(null); setSelectedChapter(null); }} style={{ background: selectedSection === sec.sectionId ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', border: selectedSection === sec.sectionId ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.1)', color: selectedSection === sec.sectionId ? '#fbbf24' : '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>{sec.sectionName}</button>
            ))}
          </div>
        </div>

        {selectedSection && (
          <div style={{ marginBottom: '1.5rem', animation: 'fade-in 0.3s' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>2. Select Subject</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {syllabusData.find(s => s.sectionId === selectedSection)?.subjects.map(sub => (
                <button key={sub.subjectId} onClick={() => { setSelectedSubject(sub.subjectId); setSelectedChapter(null); }} style={{ background: selectedSubject === sub.subjectId ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: selectedSubject === sub.subjectId ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)', color: selectedSubject === sub.subjectId ? '#60a5fa' : '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>{sub.subjectName}</button>
              ))}
            </div>
          </div>
        )}

        {selectedSubject && (
          <div style={{ marginBottom: '1.5rem', animation: 'fade-in 0.3s' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>3. Select Chapter</div>
            <select 
              value={selectedChapter || ''} 
              onChange={(e) => setSelectedChapter(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: '0.95rem' }}
            >
              <option value="">-- Choose Chapter --</option>
              {syllabusData.find(s => s.sectionId === selectedSection)?.subjects.find(sub => sub.subjectId === selectedSubject)?.chapters.map(ch => (
                <option key={ch.chapterId} value={ch.chapterId}>{ch.chapterName}</option>
              ))}
            </select>
          </div>
        )}

        {selectedChapter && (
          <div style={{ animation: 'fade-in 0.3s', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>4. Test Type</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setTestConfig({...testConfig, mode: 'objective'})}
                  style={{ flex: 1, background: testConfig.mode === 'objective' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: testConfig.mode === 'objective' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)', color: testConfig.mode === 'objective' ? '#60a5fa' : 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Objective (MCQ)
                </button>
                <button 
                  onClick={() => setTestConfig({...testConfig, mode: 'subjective'})}
                  style={{ flex: 1, background: testConfig.mode === 'subjective' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', border: testConfig.mode === 'subjective' ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)', color: testConfig.mode === 'subjective' ? '#c084fc' : 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Subjective (Written)
                </button>
                <button 
                  onClick={() => setTestConfig({...testConfig, mode: 'mixed'})}
                  style={{ flex: 1, background: testConfig.mode === 'mixed' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', border: testConfig.mode === 'mixed' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.1)', color: testConfig.mode === 'mixed' ? '#fbbf24' : 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Mixed Mode
                </button>
              </div>
            </div>

            {testConfig.mode !== 'mixed' ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <span style={{ color: '#3b82f6', opacity: testConfig.difficulty === 1 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, difficulty: 1})}>Easy</span>
                    <span style={{ color: '#fbbf24', opacity: testConfig.difficulty === 2 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, difficulty: 2})}>Medium</span>
                    <span style={{ color: '#ef4444', opacity: testConfig.difficulty === 3 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, difficulty: 3})}>Hard</span>
                  </div>
                  <input 
                    type="range" min="1" max="3" value={testConfig.difficulty}
                    onChange={e => setTestConfig({...testConfig, difficulty: parseInt(e.target.value)})}
                    style={{ width: '100%', accentColor: testConfig.difficulty === 1 ? '#3b82f6' : testConfig.difficulty === 2 ? '#fbbf24' : '#ef4444' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{testConfig.mode === 'objective' ? 'Total Questions' : 'Total Marks'}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {testConfig.mode === 'objective' ? (
                      [10, 15, 20].map(c => (
                        <button key={c} onClick={() => setTestConfig({...testConfig, count: c})} style={{ flex: 1, background: testConfig.count === c ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '0.6rem', fontSize: '0.95rem', cursor: 'pointer' }}>{c} Qs</button>
                      ))
                    ) : (
                      [20, 40].map(m => (
                        <button key={m} onClick={() => setTestConfig({...testConfig, marks: m})} style={{ flex: 1, background: testConfig.marks === m ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '0.6rem', fontSize: '0.95rem', cursor: 'pointer' }}>{m} Marks</button>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem', background: 'rgba(59,130,246,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <h4 style={{ color: '#60a5fa', margin: '0 0 1rem', fontSize: '0.95rem' }}>Objective Phase Config</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <span style={{ color: '#3b82f6', opacity: testConfig.objLevel === 1 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, objLevel: 1})}>Easy</span>
                    <span style={{ color: '#fbbf24', opacity: testConfig.objLevel === 2 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, objLevel: 2})}>Medium</span>
                    <span style={{ color: '#ef4444', opacity: testConfig.objLevel === 3 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, objLevel: 3})}>Hard</span>
                  </div>
                  <input 
                    type="range" min="1" max="3" value={testConfig.objLevel}
                    onChange={e => setTestConfig({...testConfig, objLevel: parseInt(e.target.value)})}
                    style={{ width: '100%', accentColor: testConfig.objLevel === 1 ? '#3b82f6' : testConfig.objLevel === 2 ? '#fbbf24' : '#ef4444', marginBottom: '1rem' }}
                  />
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Total Questions</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[10, 15, 20].map(c => (
                      <button key={c} onClick={() => setTestConfig({...testConfig, objCount: c})} style={{ flex: 1, background: testConfig.objCount === c ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: testConfig.objCount === c ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>{c} Qs</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', background: 'rgba(168,85,247,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <h4 style={{ color: '#c084fc', margin: '0 0 1rem', fontSize: '0.95rem' }}>Subjective Phase Config</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <span style={{ color: '#3b82f6', opacity: testConfig.subjLevel === 1 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, subjLevel: 1})}>Easy</span>
                    <span style={{ color: '#fbbf24', opacity: testConfig.subjLevel === 2 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, subjLevel: 2})}>Medium</span>
                    <span style={{ color: '#ef4444', opacity: testConfig.subjLevel === 3 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, subjLevel: 3})}>Hard</span>
                  </div>
                  <input 
                    type="range" min="1" max="3" value={testConfig.subjLevel}
                    onChange={e => setTestConfig({...testConfig, subjLevel: parseInt(e.target.value)})}
                    style={{ width: '100%', accentColor: testConfig.subjLevel === 1 ? '#3b82f6' : testConfig.subjLevel === 2 ? '#fbbf24' : '#ef4444', marginBottom: '1rem' }}
                  />
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Total Marks</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[20, 40].map(m => (
                      <button key={m} onClick={() => setTestConfig({...testConfig, subjMarks: m})} style={{ flex: 1, background: testConfig.subjMarks === m ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', border: testConfig.subjMarks === m ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>{m} Marks</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button 
              className="tm-btn" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={18} fill="currentColor" />}
              {loading ? 'Generating Test...' : 'Generate Test'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
