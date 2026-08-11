import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatMath } from '../utils/formatMath';
import DiagramRenderer from '../components/DiagramRenderer';
import { FileJson, Eye, AlertCircle, CheckCircle } from 'lucide-react';

export default function TestJSONPreviewerPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');

  const handlePreview = () => {
    try {
      setError('');
      const data = JSON.parse(jsonInput);
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("JSON must contain a 'questions' array.");
      }
      setParsedData(data);
    } catch (err) {
      setError(err.message || 'Invalid JSON');
      setParsedData(null);
    }
  };

  const loadSample = () => {
    const sample = {
      title: "Sample Preview Test",
      type: "subjective",
      questions: [
        {
          text: "In $\\triangle ABC$, $DE \\parallel BC$. Find $x$.",
          diagram: {
            template: "jsxgraph",
            boundingBox: [-1, 6, 8, -1],
            showAxis: false,
            dsl: "A = (3,5); B = (0,0); C = (7,0); D = (1.5, 2.5); E = (5, 2.5); triangle ABC; segment DE"
          }
        }
      ]
    };
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <FileJson size={32} color="#3b82f6" />
        <h1 style={{ margin: 0, color: '#fff' }}>Test JSON Previewer</h1>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ color: '#e2e8f0', fontWeight: 600 }}>Paste Test JSON Here:</label>
          <button 
            onClick={loadSample}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Load Sample
          </button>
        </div>
        
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"title": "...", "questions": [ ... ] }'
          style={{ 
            width: '100%', 
            height: '250px', 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px', 
            padding: '1rem', 
            color: '#a78bfa', 
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            resize: 'vertical',
            outline: 'none'
          }}
        />

        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <button 
          onClick={handlePreview}
          style={{ 
            marginTop: '1rem', 
            width: '100%', 
            background: '#3b82f6', 
            color: '#fff', 
            border: 'none', 
            padding: '0.8rem', 
            borderRadius: '8px', 
            fontWeight: 600, 
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          <Eye size={18} /> Render Preview
        </button>
      </div>

      {parsedData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>{parsedData.title || 'Untitled Test'}</h2>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              Type: {parsedData.type || 'objective'} | Total Questions: {parsedData.questions.length}
            </div>
          </div>

          {parsedData.questions.map((q, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Question Text */}
                  <div style={{ color: '#e2e8f0', fontSize: '1.1rem', lineHeight: 1.6 }} className="custom-md">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {formatMath(q.text || '')}
                    </ReactMarkdown>
                  </div>

                  {/* Diagram */}
                  {q.diagram && (
                    <div style={{ margin: '1.5rem 0' }}>
                      <DiagramRenderer diagram={q.diagram} />
                    </div>
                  )}

                  {/* Objective Options */}
                  {q.options && Array.isArray(q.options) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ 
                          padding: '1rem', 
                          background: q.correctOptionIndex === oIdx ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', 
                          border: `1px solid ${q.correctOptionIndex === oIdx ? '#10b981' : 'rgba(255,255,255,0.1)'}`, 
                          borderRadius: '12px',
                          color: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1px solid ${q.correctOptionIndex === oIdx ? '#10b981' : 'rgba(255,255,255,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: q.correctOptionIndex === oIdx ? '#10b981' : 'rgba(255,255,255,0.5)' }}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <div className="custom-md-opt" style={{ flex: 1 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {formatMath(opt)}
                            </ReactMarkdown>
                          </div>
                          {q.correctOptionIndex === oIdx && <CheckCircle size={18} color="#10b981" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subjective Answer Steps */}
                  {q.answerSteps && Array.isArray(q.answerSteps) && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Step-by-Step Marking Scheme</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {q.answerSteps.map((step, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginTop: '8px', flexShrink: 0 }} />
                            <div style={{ flex: 1, color: '#e2e8f0', lineHeight: 1.6 }} className="custom-md">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {formatMath(step.stepText || step.step || step.text || '')}
                              </ReactMarkdown>
                            </div>
                            <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0, padding: '0.2rem 0.6rem', background: 'rgba(251,191,36,0.1)', borderRadius: '6px' }}>
                              {step.marks} mark{step.marks > 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
