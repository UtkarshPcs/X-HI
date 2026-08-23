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
  const [loadingSubject, setLoadingSubject] = useState(null);

  const handleSubjectClick = async (subjectId) => {
    if (!currentUser) {
      alert("Please log in to generate a practice set.");
      return;
    }
    setLoadingSubject(subjectId);
    try {
      // Try to generate a dynamic test first
      let testId;
      try {
        testId = await createAndSaveDynamicTest(subjectId, currentUser.id || currentUser.uid || currentUser.phone);
      } catch (dynamicErr) {
        console.warn("Dynamic generation failed, falling back to static tests:", dynamicErr);
        // Fallback to static test if dynamic fails (e.g. no syllabus found)
        const tests = await getTermPracticeTestsBySubject(subjectId);
        if (tests.length === 0) {
          throw new Error("No practice sets available for this subject right now.");
        }
        testId = tests[0].id;
      }
      navigate(`/term-practice/test/${testId}`);
    } catch (err) {
      alert("Error generating test: " + err.message);
    } finally {
      setLoadingSubject(null);
    }
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
        .tp-action { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.95rem; }
      `}</style>

      <div className="tp-hero">
        <h1>Term Practice Sets</h1>
        <p>Full-length 80-mark simulated board examinations for Half Yearly 2026. Practice with real exam formatting, self-evaluate your answers, and get detailed analytical reports.</p>
      </div>

      <div className="tp-grid">
        {SUBJECTS.map((subject) => {
          const Icon = subject.icon;
          const isLoading = loadingSubject === subject.id;
          
          return (
            <div 
              key={subject.id} 
              className="tp-card"
              onClick={() => !isLoading && handleSubjectClick(subject.id)}
            >
              <div>
                <div className="tp-icon-wrapper" style={{ background: subject.bg, color: subject.color }}>
                  <Icon size={28} />
                </div>
                <h3 className="tp-card-title">{subject.name}</h3>
                <p className="tp-card-desc">Practice Set • 80 Marks • 3 Hours</p>
              </div>
              <div className="tp-action" style={{ color: subject.color }}>
                {isLoading ? (
                  <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</>
                ) : (
                  <>Start Exam <ArrowRight size={16} /></>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
