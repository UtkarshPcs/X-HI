import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { syllabusData } from '../data/syllabusData';
import { ArrowLeft, Clock, BookOpen, Plus, Loader2, FileJson, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getConceptsByChapter, getRecentConcepts, bulkUploadConcepts, uploadConcept, getContributionStats, deleteConcept } from '../services/starBatchConceptsService';
import { uploadImageToCloudinary } from '../services/starBatchSyllabusService';
import { getUserRole, ROLES } from '../auth/roles';

// Function to generate consistent colors based on string (for user avatars)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export default function StarConceptChapterPage() {
  const { chapterId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('syllabus'); // 'syllabus' or 'recent'
  const [concepts, setConcepts] = useState([]);
  const [recentConcepts, setRecentConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isAdmin = getUserRole(currentUser?.rollNo) === ROLES.ADMIN || currentUser?.activeRole === 'ADMIN';

  useEffect(() => {
    if (!currentUser || !currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch) {
      navigate('/star-batch');
      return;
    }
    fetchData();
  }, [chapterId, currentUser, navigate]);

  async function fetchData() {
    setLoading(true);
    try {
      const all = await getConceptsByChapter(chapterId);
      const recent = await getRecentConcepts(chapterId, 10);
      const st = await getContributionStats(chapterId);
      setConcepts(all);
      setRecentConcepts(recent);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Find chapter info
  let chapterName = 'Unknown Chapter';
  let subjectName = 'Unknown Subject';
  for (const sec of syllabusData) {
    for (const sub of sec.subjects) {
      const ch = sub.chapters.find(c => c.chapterId === chapterId);
      if (ch) {
        chapterName = ch.chapterName;
        subjectName = sub.subjectName;
        break;
      }
    }
  }

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem' }}>
      <style>{`
        .chp-header { margin-bottom: 1.5rem; }
        .chp-back { display: inline-flex; align-items: center; gap: 0.4rem; color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-bottom: 1rem; cursor: pointer; transition: color 0.2s; }
        .chp-back:hover { color: #fff; }
        .chp-title { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0 0 0.3rem; }
        .chp-subtitle { font-size: 0.95rem; color: #fbbf24; margin: 0; font-weight: 600; }

        /* Contribution Bar */
        .contrib-wrapper { margin-bottom: 2rem; }
        .contrib-bar { height: 12px; display: flex; border-radius: 6px; overflow: hidden; cursor: pointer; background: rgba(255,255,255,0.05); }
        .contrib-segment { transition: width 0.3s ease; }
        .contrib-segment:hover { filter: brightness(1.2); }
        .contrib-empty { flex: 1; background: rgba(255,255,255,0.05); }
        
        .contrib-panel { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.8rem; animation: slideDown 0.2s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .contrib-item { display: flex; align-items: center; justify-content: space-between; }
        .contrib-user { display: flex; align-items: center; gap: 0.8rem; }
        .contrib-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; color: #fff; text-transform: uppercase; }
        .contrib-name { font-size: 0.9rem; color: #e2e8f0; font-weight: 500; }
        .contrib-stat { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
        .contrib-percent { font-size: 0.9rem; font-weight: 700; color: #fff; min-width: 40px; text-align: right; }

        /* Tabs */
        .chp-tabs { display: flex; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem; }
        .chp-tab { padding: 0.8rem 1.2rem; cursor: pointer; color: rgba(255,255,255,0.5); font-weight: 600; font-size: 0.95rem; border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; align-items: center; gap: 0.4rem; }
        .chp-tab:hover { color: rgba(255,255,255,0.8); }
        .chp-tab.active { color: #fbbf24; border-bottom-color: #fbbf24; }

        /* Card */
        .concept-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
        .concept-title { font-size: 1.15rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.5rem; }
        .concept-desc { font-size: 0.9rem; color: rgba(255,255,255,0.6); margin: 0 0 1rem; font-style: italic; }
        .concept-body { font-size: 0.95rem; color: #e2e8f0; line-height: 1.6; }
        .concept-body img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
        .concept-body pre { background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; overflow-x: auto; }
        .concept-body code { background: rgba(0,0,0,0.3); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
        .concept-body table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .concept-body th, .concept-body td { border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem; }
        .concept-body th { background: rgba(255,255,255,0.05); }
        
        .concept-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; color: rgba(255,255,255,0.4); }
        .concept-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .concept-tag { background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: 4px; }
      `}</style>

      <div className="chp-header">
        <div className="chp-back" onClick={() => navigate('/star-concepts')}>
          <ArrowLeft size={16} /> Back to Hub
        </div>
        <h1 className="chp-title">{chapterName}</h1>
        <p className="chp-subtitle">{subjectName}</p>
      </div>

      {/* Contribution Bar */}
      {!loading && stats.length > 0 && (
        <div className="contrib-wrapper">
          <div className="contrib-bar" onClick={() => setShowStatsPanel(!showStatsPanel)}>
            {stats.map(s => {
              const color = s.role === 'ADMIN' ? '#64748b' : stringToColor(s.name);
              return (
                <div 
                  key={s.id} 
                  className="contrib-segment" 
                  style={{ width: `${s.percentage}%`, background: color }}
                  title={`${s.name}: ${s.percentage}%`}
                />
              );
            })}
            {stats.reduce((acc, curr) => acc + curr.percentage, 0) < 100 && (
              <div className="contrib-empty" />
            )}
          </div>
          
          {showStatsPanel && (
            <div className="contrib-panel">
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Top Contributors
              </div>
              {stats.map(s => {
                const color = s.role === 'ADMIN' ? '#64748b' : stringToColor(s.name);
                return (
                  <div key={s.id} className="contrib-item">
                    <div className="contrib-user">
                      <div className="contrib-avatar" style={{ background: color }}>
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="contrib-name">{s.name}</div>
                        <div className="contrib-stat">{s.count} uploads</div>
                      </div>
                    </div>
                    <div className="contrib-percent">{s.percentage}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setShowUploadModal(true)}
          style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> Add Concept
        </button>
        {isAdmin && <AdminBatchUpload chapterId={chapterId} onUploadSuccess={fetchData} currentUser={currentUser} />}
      </div>

      <div className="chp-tabs">
        <div className={`chp-tab ${activeTab === 'syllabus' ? 'active' : ''}`} onClick={() => setActiveTab('syllabus')}>
          <BookOpen size={16} /> Syllabus View
        </div>
        <div className={`chp-tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
          <Clock size={16} /> Recent
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.4)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          Loading concepts...
        </div>
      ) : (
        <div>
          {activeTab === 'syllabus' ? (
            concepts.length > 0 ? (
              concepts.map(c => <ConceptCard key={c.id} concept={c} isAdmin={isAdmin} onDeleteSuccess={fetchData} />)
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem 0' }}>No concepts uploaded yet. Be the first to contribute!</div>
            )
          ) : (
            recentConcepts.length > 0 ? (
              recentConcepts.map(c => <ConceptCard key={c.id} concept={c} isAdmin={isAdmin} onDeleteSuccess={fetchData} />)
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem 0' }}>No recent concepts found.</div>
            )
          )}
        </div>
      )}

      {showUploadModal && (
        <UserUploadModal 
          onClose={() => setShowUploadModal(false)}
          chapterId={chapterId}
          currentUser={currentUser}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

function ConceptCard({ concept, isAdmin, onDeleteSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this concept?")) return;
    setIsDeleting(true);
    try {
      await deleteConcept(concept.id);
      onDeleteSuccess();
    } catch (err) {
      alert("Failed to delete: " + err.message);
      setIsDeleting(false);
    }
  }

  return (
    <div className="concept-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 className="concept-title">{concept.title}</h3>
        {isAdmin && (
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Delete Concept"
          >
            {isDeleting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
          </button>
        )}
      </div>
      {concept.description && <p className="concept-desc">{concept.description}</p>}
      
      <div className="concept-body">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
        >
          {concept.content}
        </ReactMarkdown>
      </div>

      <div className="concept-meta">
        <div className="concept-tags">
          {concept.tags && concept.tags.map(t => <span key={t} className="concept-tag">{t}</span>)}
        </div>
        <div style={{ textAlign: 'right' }}>
          By {concept.contributorName} • {concept.createdAt ? new Date(concept.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
        </div>
      </div>
    </div>
  );
}

function AdminBatchUpload({ chapterId, onUploadSuccess, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [parsedConcepts, setParsedConcepts] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function reset() {
    setParsedConcepts(null);
    setError('');
    setIsUploading(false);
  }

  function close() {
    if (isUploading) return;
    setIsOpen(false);
    reset();
  }

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setParsedConcepts(null);
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.concepts || !Array.isArray(json.concepts)) {
        throw new Error('Invalid JSON schema. Expected { "concepts": [...] }');
      }

      // Cleanup over-escaped LaTeX from AI generation 
      // (If AI outputs \\\\frac in JSON, it becomes \\frac in memory. We reduce it to \frac so KaTeX can read it.)
      const cleanedConcepts = json.concepts.map(c => {
        if (c.content) {
          c.content = c.content.replace(/\\\\/g, '\\');
        }
        return c;
      });

      setParsedConcepts(cleanedConcepts);
    } catch (err) {
      setError('Failed to parse JSON: ' + err.message);
    }
  }

  function onDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  async function handleApprove() {
    if (!parsedConcepts) return;
    setIsUploading(true);
    try {
      await bulkUploadConcepts(chapterId, parsedConcepts, currentUser);
      onUploadSuccess();
      close();
    } catch (err) {
      setError('Bulk upload failed: ' + err.message);
      setIsUploading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
      >
        <FileJson size={16} />
        Batch Upload JSON
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '1.5rem', animation: 'slideDown 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Batch Upload Concepts</h2>
              <button onClick={close} disabled={isUploading} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {!parsedConcepts ? (
              <div 
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#fbbf24' : 'rgba(255,255,255,0.2)'}`,
                  background: dragActive ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleChange} style={{ display: 'none' }} />
                <FileJson size={32} color={dragActive ? '#fbbf24' : 'rgba(255,255,255,0.4)'} style={{ marginBottom: '1rem' }} />
                <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.5rem' }}>Drag & drop your JSON file here</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>or click to select file</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', marginBottom: '1rem' }}>
                  <FileJson size={24} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1.25rem' }}>Ready to Upload</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                  Exactly <strong style={{ color: '#fbbf24', fontSize: '1.1rem' }}>{parsedConcepts.length}</strong> formulas/concepts will be added to this chapter.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={reset} disabled={isUploading} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleApprove} disabled={isUploading} style={{ flex: 2, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
                    {isUploading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    {isUploading ? 'Uploading...' : 'Approve & Upload'}
                  </button>
                </div>
              </div>
            )}

            {error && <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}
          </div>
        </div>
      )}
    </>
  );
}

function UserUploadModal({ onClose, chapterId, currentUser, onSuccess }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() && !imageFile) return setError('Please provide a title or upload an image.');
    
    setIsSubmitting(true); setError('');
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      await uploadConcept({
        chapterId,
        title: title || 'Image Upload',
        description: desc,
        content,
        imageUrl
      }, currentUser);
      onSuccess();
      onClose();
    } catch(err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Add Concept</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Concept Title" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.95rem' }}
          />
          <input 
            type="text" 
            placeholder="Short Description (optional)" 
            value={desc} 
            onChange={e => setDesc(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.95rem' }}
          />
          <textarea 
            placeholder="Markdown or LaTeX content. Use $$ for math." 
            value={content} 
            onChange={e => setContent(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.95rem', minHeight: '150px', resize: 'vertical', fontFamily: 'monospace' }}
          />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.95rem' }}>
            <ImageIcon size={18} />
            <span>{imageFile ? imageFile.name : 'Upload Image (optional)'}</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
          </label>

          {error && <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ background: '#fbbf24', color: '#000', border: 'none', borderRadius: '8px', padding: '0.8rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Submitting...' : 'Upload Concept'}
          </button>
        </form>
      </div>
    </div>
  );
}
