import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllSubjectiveTests } from '../services/starBatchSubjectiveTestService';
import { syllabusData } from '../data/syllabusData';
import { Target, Play, Loader2, Sparkles, ArrowLeft, Layers } from 'lucide-react';

export default function StarBatchMixedTestModulePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [subjectiveTests, setSubjectiveTests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapters, setSelectedChapters] = useState([]); // array of chapterIds
  
  const [testConfig, setTestConfig] = useState({ level: 2, marks: 40 });

  useEffect(() => {
    if (!currentUser) navigate('/');
    else if (!currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch) navigate('/star-batch');
    else {
      getAllSubjectiveTests().then(tests => {
        setSubjectiveTests(tests);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [currentUser, navigate]);

  const toggleChapter = (chapterId) => {
    setSelectedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId) 
        : [...prev, chapterId]
    );
  };

  const handleGenerate = () => {
    if (selectedChapters.length < 2) {
      alert("Please select at least 2 chapters for a mixed test.");
      return;
    }
    
    // Find corresponding test IDs for selected chapters
    const testIds = selectedChapters.map(chId => {
      const t = subjectiveTests.find(st => st.chapterId === chId);
      return t ? t.id : null;
    }).filter(Boolean);

    if (testIds.length === 0) {
      alert("No subjective questions available for the selected chapters.");
      return;
    }

    const levelName = ['easy', 'medium', 'hard', 'difficult'][testConfig.level - 1];
    navigate(`/star-mixed-subjective-tests?testIds=${testIds.join(',')}&level=${levelName}&marks=${testConfig.marks}&subject=${selectedSubject}`);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.4)' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
      Loading Module...
    </div>
  );

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .tm-header { margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; }
        .tm-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0; }
        .tm-subtitle { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin: 0.2rem 0 0; }
        .tm-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .tm-back:hover { background: rgba(255,255,255,0.1); }
        .tm-btn { width: 100%; background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); border: none; border-radius: 10px; padding: 1rem; color: #fff; font-weight: 800; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; margin-top: 1rem; }
        .tm-btn:hover { box-shadow: 0 4px 20px rgba(168,85,247,0.4); transform: scale(1.02); }
        .tm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      <div className="tm-header">
        <button className="tm-back" onClick={() => navigate('/star-batch')}><ArrowLeft size={18} /></button>
        <div>
          <h2 className="tm-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={24} color="#a855f7" /> Mixed Subjective Test
          </h2>
          <p className="tm-subtitle">Generate a custom test across multiple chapters.</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', color: '#a855f7', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} /> Multi-Chapter Generator
        </h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>1. Select Section</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {syllabusData.map(sec => (
              <button key={sec.sectionId} onClick={() => { setSelectedSection(sec.sectionId); setSelectedSubject(null); setSelectedChapters([]); }} style={{ background: selectedSection === sec.sectionId ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)', border: selectedSection === sec.sectionId ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)', color: selectedSection === sec.sectionId ? '#c084fc' : '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>{sec.sectionName}</button>
            ))}
          </div>
        </div>

        {selectedSection && (
          <div style={{ marginBottom: '1.5rem', animation: 'fade-in 0.3s' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>2. Select Subject</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {syllabusData.find(s => s.sectionId === selectedSection)?.subjects.map(sub => (
                <button key={sub.subjectId} onClick={() => { setSelectedSubject(sub.subjectId); setSelectedChapters([]); }} style={{ background: selectedSubject === sub.subjectId ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: selectedSubject === sub.subjectId ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)', color: selectedSubject === sub.subjectId ? '#60a5fa' : '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>{sub.subjectName}</button>
              ))}
            </div>
          </div>
        )}

        {selectedSubject && (
          <div style={{ marginBottom: '1.5rem', animation: 'fade-in 0.3s' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>3. Select Chapters (Min. 2)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {syllabusData.find(s => s.sectionId === selectedSection)?.subjects.find(sub => sub.subjectId === selectedSubject)?.chapters.map(ch => {
                const hasSubj = subjectiveTests.some(t => t.chapterId === ch.chapterId);
                const isSelected = selectedChapters.includes(ch.chapterId);
                return (
                  <label key={ch.chapterId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: hasSubj ? 'pointer' : 'not-allowed', opacity: hasSubj ? 1 : 0.4, background: isSelected ? 'rgba(168,85,247,0.1)' : 'transparent', borderRadius: '6px' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => hasSubj && toggleChapter(ch.chapterId)}
                      disabled={!hasSubj}
                      style={{ accentColor: '#a855f7', width: '18px', height: '18px' }}
                    />
                    <span style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>{ch.chapterName} {!hasSubj && '(No Questions)'}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {selectedChapters.length > 0 && (
          <div style={{ animation: 'fade-in 0.3s', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>
                <span style={{ color: '#3b82f6', opacity: testConfig.level === 1 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, level: 1})}>Easy</span>
                <span style={{ color: '#fbbf24', opacity: testConfig.level === 2 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, level: 2})}>Medium</span>
                <span style={{ color: '#ef4444', opacity: testConfig.level === 3 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, level: 3})}>Hard</span>
                <span style={{ color: '#991b1b', opacity: testConfig.level === 4 ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setTestConfig({...testConfig, level: 4})}>Difficult</span>
              </div>
              <input 
                type="range" min="1" max="4" value={testConfig.level}
                onChange={e => setTestConfig({...testConfig, level: parseInt(e.target.value)})}
                style={{ width: '100%', accentColor: testConfig.level === 1 ? '#3b82f6' : testConfig.level === 2 ? '#fbbf24' : testConfig.level === 3 ? '#ef4444' : '#991b1b' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Total Marks</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[40, 80].map(m => (
                  <button key={m} onClick={() => setTestConfig({...testConfig, marks: m})} style={{ flex: 1, background: testConfig.marks === m ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', border: testConfig.marks === m ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>{m} Marks</button>
                ))}
              </div>
            </div>

            <button 
              className="tm-btn" 
              onClick={handleGenerate}
              disabled={selectedChapters.length < 2}
            >
              <Play size={20} fill="currentColor" /> Generate Mixed Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
