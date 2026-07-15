import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { syllabusData } from '../data/syllabusData';
import { BookOpen, ChevronRight, Search } from 'lucide-react';

export default function StarBatchConceptsHub() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) navigate('/');
    else if (!currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch) navigate('/star-batch');
  }, [currentUser, navigate]);

  if (!currentUser || !currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch) return null;

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem' }}>
      <style>{`
        .ch-header { margin-bottom: 2rem; }
        .ch-title { display: flex; align-items: center; gap: 0.6rem; margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff; }
        .ch-subtitle { color: rgba(255,255,255,0.6); font-size: 0.95rem; margin: 0.4rem 0 0; }
        
        .ch-search { display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem 1rem; margin-bottom: 2rem; transition: all 0.2s; }
        .ch-search:focus-within { border-color: rgba(251,191,36,0.5); box-shadow: 0 0 0 3px rgba(251,191,36,0.1); }
        .ch-search input { width: 100%; background: none; border: none; color: #fff; padding-left: 0.8rem; outline: none; font-size: 1rem; }
        
        .ch-section { margin-bottom: 2rem; }
        .ch-section-title { font-size: 1.2rem; font-weight: 700; color: #fbbf24; margin: 0 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        
        .ch-subject { margin-bottom: 1.5rem; padding-left: 0.5rem; }
        .ch-subject-title { font-size: 1.05rem; font-weight: 600; color: #e2e8f0; margin: 0 0 0.8rem; }
        
        .ch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        
        .ch-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.2rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: space-between; }
        .ch-card:hover { border-color: rgba(251,191,36,0.4); background: rgba(251,191,36,0.05); transform: translateY(-2px); }
        .ch-card-title { font-size: 0.95rem; font-weight: 600; color: #f8fafc; margin: 0; }
        .ch-card-icon { color: rgba(251,191,36,0.7); }
      `}</style>

      <div className="ch-header">
        <h1 className="ch-title"><BookOpen size={24} color="#fbbf24" /> Important Concepts Hub</h1>
        <p className="ch-subtitle">Community-driven knowledge base. Revise key formulas and concepts chapter-wise.</p>
      </div>

      <div className="ch-search">
        <Search size={20} color="rgba(255,255,255,0.4)" />
        <input 
          type="text" 
          placeholder="Search for a chapter..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div>
        {syllabusData.map(section => {
          const matchedSubjects = section.subjects.map(sub => {
            const matchedChapters = sub.chapters.filter(ch => 
              ch.chapterName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            return { ...sub, chapters: matchedChapters };
          }).filter(sub => sub.chapters.length > 0);

          if (matchedSubjects.length === 0) return null;

          return (
            <div key={section.sectionId} className="ch-section">
              <h2 className="ch-section-title">{section.sectionName}</h2>
              {matchedSubjects.map(sub => (
                <div key={sub.subjectId} className="ch-subject">
                  <h3 className="ch-subject-title">{sub.subjectName}</h3>
                  <div className="ch-grid">
                    {sub.chapters.map(ch => (
                      <div 
                        key={ch.chapterId} 
                        className="ch-card"
                        onClick={() => navigate(`/star-concepts/${ch.chapterId}`)}
                      >
                        <h4 className="ch-card-title">{ch.chapterName}</h4>
                        <ChevronRight size={18} className="ch-card-icon" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
