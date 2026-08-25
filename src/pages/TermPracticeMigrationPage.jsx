import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, CheckCircle, Database, Edit, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TermPracticeMigrationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  const [selectedTest, setSelectedTest] = useState(null);
  const [editingQuestions, setEditingQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Basic admin check - optional, can be customized
    if (!currentUser) {
      navigate('/');
    } else {
      fetchTests();
    }
  }, [currentUser, navigate]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'termPracticeTests'));
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTests(fetched);
    } catch (err) {
      console.error(err);
      setStatus("Error fetching tests.");
    } finally {
      setLoading(false);
    }
  };

  const getSubtype = (q) => {
    if (q['sub-type']) return q['sub-type']; // Already has one
    
    // Heuristics
    const textLower = (q.text || q.question_text || '').toLowerCase();
    const topicLower = (q.topic || q.subtopic || '').toLowerCase();

    if (topicLower.includes('map')) return 'Map-Based';
    if (textLower.includes('assertion') && textLower.includes('reason')) return 'Assertion-Reason';
    if (q.type === 'objective' && q.marks === 1) return 'MCQ';
    
    if (q.type === 'subjective') {
      if (q.marks === 2) return 'Very Short Answer';
      if (q.marks === 3) return 'Short Answer';
      if (q.marks === 4) return 'Case-Based';
      if (q.marks === 5) return 'Long Answer';
    }
    return 'Short Answer'; // Fallback
  };

  const runMigration = async () => {
    if (!window.confirm("Are you sure you want to run the automated migration? This will update all existing Term Practice papers in Firestore.")) return;
    
    setLoading(true);
    setStatus("Migration starting...");
    
    let updatedCount = 0;
    
    try {
      for (const test of tests) {
        let needsUpdate = false;
        
        const newQuestions = test.questions.map(q => {
          let updatedQ = { ...q };
          
          if (!updatedQ['sub-type']) {
            updatedQ['sub-type'] = getSubtype(q);
            needsUpdate = true;
          }
          
          if (!updatedQ.map_urls) {
            updatedQ.map_urls = [];
            needsUpdate = true;
          }
          
          return updatedQ;
        });

        if (needsUpdate) {
          setStatus(`Updating test: ${test.title || test.id}...`);
          const ref = doc(db, 'termPracticeTests', test.id);
          await updateDoc(ref, { questions: newQuestions });
          updatedCount++;
        }
      }
      setStatus(`Migration complete! Successfully updated ${updatedCount} tests.`);
      fetchTests(); // Refresh
    } catch (err) {
      console.error(err);
      setStatus("Error during migration. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTest = (test) => {
    setSelectedTest(test);
    setEditingQuestions(JSON.parse(JSON.stringify(test.questions)));
  };

  const handleMapUrlChange = (qIndex, value) => {
    const newQs = [...editingQuestions];
    // Convert comma-separated string to array
    newQs[qIndex].map_urls = value.split(',').map(s => s.trim()).filter(s => s !== '');
    setEditingQuestions(newQs);
  };
  
  const handleSubtypeChange = (qIndex, value) => {
    const newQs = [...editingQuestions];
    newQs[qIndex]['sub-type'] = value;
    setEditingQuestions(newQs);
  };

  const saveEdits = async () => {
    setIsSaving(true);
    try {
      const ref = doc(db, 'termPracticeTests', selectedTest.id);
      await updateDoc(ref, { questions: editingQuestions });
      setStatus(`Successfully saved edits for ${selectedTest.title || selectedTest.id}`);
      setSelectedTest(null);
      fetchTests();
    } catch (err) {
      console.error(err);
      alert("Failed to save edits");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Database size={32} color="#3b82f6" />
        <h1 style={{ margin: 0, color: '#fff' }}>Term Practice - Admin Migration & Editor</h1>
      </div>

      {status && (
        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} color="#3b82f6" />
          {status}
        </div>
      )}

      {!selectedTest ? (
        <>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle color="#eab308" /> 1. Bulk Auto-Migration
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Run this to automatically process all {tests.length} tests in the database. 
              It will assign a `sub-type` based on marks/topics if missing, and initialize an empty `map_urls` array for all questions.
            </p>
            <button 
              onClick={runMigration} 
              disabled={loading}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Database size={18} />}
              {loading ? 'Processing...' : 'Run Auto Migration'}
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit color="#10b981" /> 2. Manual Map URL Editor
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {tests.map(test => (
                <div key={test.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{test.title || 'Untitled'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>ID: {test.id} | Subject: {test.subjectId} | {test.questions?.length} Questions</div>
                  </div>
                  <button 
                    onClick={() => handleEditTest(test)}
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit Paper
                  </button>
                </div>
              ))}
              {tests.length === 0 && !loading && <div>No tests found in database.</div>}
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Editing: {selectedTest.title}</h2>
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>Update sub-types and map URLs below. Separate multiple URLs with commas.</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setSelectedTest(null)}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={saveEdits}
                disabled={isSaving}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isSaving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {editingQuestions.map((q, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>Q{idx + 1}</span>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{q.type}</span>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{q.marks} Marks</span>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Topic: {q.topic}</span>
                </div>
                
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {q.text}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Sub-Type</label>
                    <input 
                      type="text" 
                      value={q['sub-type'] || ''} 
                      onChange={(e) => handleSubtypeChange(idx, e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '6px', color: '#fff' }}
                      placeholder="e.g. Map-Based"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Map URLs (comma separated)</label>
                    <input 
                      type="text" 
                      value={(q.map_urls || []).join(', ')} 
                      onChange={(e) => handleMapUrlChange(idx, e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '6px', color: '#fff' }}
                      placeholder="https://cloudinary.com/map1.png, https://..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
