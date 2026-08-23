import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FlaskConical, Calculator, Globe, Code, Languages, ArrowRight, Loader2 } from 'lucide-react';
import { getTermPracticeTestsBySubject } from '../services/termPracticeService';
import { createAndSaveDynamicTest } from '../services/dynamicTestOrchestrator';
import { useAuth } from '../auth/AuthContext';

const SUBJECTS = [
  { id: 'science', name: 'Science', icon: FlaskConical, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { id: 'math', name: 'Mathematics', icon: Calculator, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { id: 'sst', name: 'Social Science', icon: Globe, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 'english', name: 'English', icon: BookOpen, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { id: 'hindi', name: 'Hindi', icon: Languages, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { id: 'it', name: 'Information Tech', icon: Code, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' }
];

export default function TermPracticeSetPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [staticTests, setStaticTests] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const handleSubjectClick = async (subject) => {
    setSelectedSubject(subject);
    setStaticTests(null);
    try {
      const tests = await getTermPracticeTestsBySubject(subject.id);
      setStaticTests(tests);
    } catch (err) {
      console.error("Failed to load static tests:", err);
      setStaticTests([]);
    }
  };

  const handleGenerateDynamic = async () => {
    if (!currentUser) {
      alert("Please log in to generate a practice set.");
      return;
    }
    setLoadingAction('dynamic');
    try {
      const testId = await createAndSaveDynamicTest(selectedSubject.id, currentUser.id || currentUser.uid || currentUser.phone);
      navigate(`/term-practice/test/${testId}`);
    } catch (err) {
      alert("Error generating test: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTakeStaticTest = (testId) => {
    setLoadingAction(testId);
    navigate(`/term-practice/test/${testId}`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem', animation: 'fade-in 0.4s ease' }}>
      <style>{`
        .tp-hero { text-align: center; margin-bottom: 3rem; }
        .tp-hero h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; background: linear-gradient(135deg, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .tp-hero p { color: #94a3b8; font-size: 1.1rem; max-width: 600px; margin: 0 auto; line-height: 1.6; }
        .tp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .tp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 1.5rem; transition: all 0.3s ease; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
        .tp-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .tp-icon-wrapper { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
        .tp-card-title { font-size: 1.25rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.5rem; }
        .tp-card-desc { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
        
        .tp-detail-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .tp-back-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.2s; }
        .tp-back-btn:hover { background: rgba(255,255,255,0.1); }
        
        .tp-action-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; padding: 1.25rem; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; }
        .tp-generate-btn { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; box-shadow: 0 4px 15px rgba(59,130,246,0.3); }
        .tp-generate-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.4); }
        .tp-static-btn { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .tp-static-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
      `}</style>

      {!selectedSubject ? (
        <>
          <div className="tp-hero">
            <h1>Term Practice Sets</h1>
            <p>Full-length 80-mark simulated board examinations for Half Yearly 2026. Practice with real exam formatting, self-evaluate your answers, and get detailed analytical reports.</p>
          </div>

          <div className="tp-grid">
            {SUBJECTS.map((subject) => {
              const Icon = subject.icon;
              return (
                <div key={subject.id} className="tp-card" onClick={() => handleSubjectClick(subject)}>
                  <div>
                    <div className="tp-icon-wrapper" style={{ background: subject.bg, color: subject.color }}>
                      <Icon size={28} />
                    </div>
                    <h3 className="tp-card-title">{subject.name}</h3>
                    <p className="tp-card-desc">Practice Set • 80 Marks • 3 Hours</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ animation: 'fade-in 0.3s ease' }}>
          <div className="tp-detail-header">
            <button className="tp-back-btn" onClick={() => setSelectedSubject(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 style={{ fontSize: '1.75rem', margin: 0, color: '#fff' }}>{selectedSubject.name} Practice</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            
            {/* Dynamic Generation Section */}
            <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>AI Dynamic Paper</h3>
              <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.5, flex: 1 }}>
                Generates a fresh 80-mark paper dynamically using spaced repetition from your past mistakes. No two tests are exactly the same.
              </p>
              <button 
                className="tp-action-btn tp-generate-btn" 
                onClick={handleGenerateDynamic}
                disabled={loadingAction === 'dynamic'}
              >
                {loadingAction === 'dynamic' ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : 'Generate New Test'}
              </button>
            </div>

            {/* Static Uploaded Sets Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Official Uploaded Sets</h3>
              <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Take a standardized test paper previously uploaded by your teachers.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', flex: 1 }}>
                {staticTests === null ? (
                  <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Fetching sets...</div>
                ) : staticTests.length === 0 ? (
                  <div style={{ color: '#64748b', fontStyle: 'italic' }}>No official sets uploaded yet.</div>
                ) : (
                  staticTests.map(test => (
                    <button
                      key={test.id}
                      className="tp-action-btn tp-static-btn"
                      style={{ padding: '1rem', fontSize: '1rem', justifyContent: 'flex-start', textAlign: 'left' }}
                      onClick={() => handleTakeStaticTest(test.id)}
                      disabled={loadingAction === test.id}
                    >
                      {loadingAction === test.id ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={18} />}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {test.title || 'Untitled Practice Set'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
