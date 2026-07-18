import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getFeatureLaunches } from '../services/featureLaunchService';
import { markFeaturePopupSeen } from '../auth/authService';

export default function FeatureLaunchPopup() {
  const { currentUser, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    let active = true;
    (async () => {
      try {
        const popups = await getFeatureLaunches();
        if (!active) return;

        // Cloud seen popups
        const cloudSeen = currentUser.seenFeaturePopups || [];

        // Find the first popup (newest first, since getFeatureLaunches returns desc)
        // that hasn't been seen in Local Storage OR Cloud.
        const unseenPopup = popups.find(p => {
          const localSeen = localStorage.getItem('seenFeaturePopup_' + p.id);
          if (localSeen === 'true') return false;
          if (cloudSeen.includes(p.id)) {
            // Keep local storage in sync
            localStorage.setItem('seenFeaturePopup_' + p.id, 'true');
            return false;
          }
          return true;
        });

        if (!unseenPopup) {
          setConfig(null);
          return;
        }

        setConfig(unseenPopup);
        // Slight delay for animation
        setTimeout(() => setVisible(true), 500);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => { active = false; };
  }, [currentUser]);

  if (!config || !visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('seenFeaturePopup_' + config.id, 'true');
    if (currentUser) {
      const currentSeen = currentUser.seenFeaturePopups || [];
      updateCurrentUser({ seenFeaturePopups: [...currentSeen, config.id] });
      markFeaturePopupSeen(currentUser.phone, config.id).catch(() => {});
    }
  };

  const handleAction = () => {
    handleDismiss();
    if (config.redirectPage) {
      navigate(config.redirectPage);
    }
  };

  const popupContent = (
    <div 
      className="feature-launch-overlay animate-fade-in"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="feature-launch-card"
        style={{
          background: 'rgba(20, 25, 40, 0.55)',
          backdropFilter: 'blur(24px) saturate(150%)',
          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
          position: 'relative',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button 
          onClick={handleDismiss}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 10, transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
        >
          <X size={18} />
        </button>

        {config.imageUrl && (
          <div style={{ width: '100%', height: '220px', background: 'var(--surface-light)', position: 'relative' }}>
            <img 
              src={config.imageUrl} 
              alt="Feature Banner" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(20, 25, 40, 0.55), transparent)' }} />
          </div>
        )}

        <div style={{ padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>
          {!config.imageUrl && (
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', marginBottom: '1rem' }}>
              <Sparkles size={24} />
            </div>
          )}
          
          <div className="feature-launch-markdown" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            <ReactMarkdown>{config.markdownText}</ReactMarkdown>
          </div>

          <button 
            onClick={handleAction}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 20px -4px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(139, 92, 246, 0.3)';
            }}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(popupContent, document.body);
}
