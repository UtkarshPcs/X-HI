/**
 * YouTubePlayer.jsx
 * Responsive YouTube embed that supports both normal videos and live streams.
 * Uses the standard YouTube IFrame embed — no external library needed.
 */

import { memo } from 'react';

/**
 * @param {{ videoId: string, title?: string }} props
 */
const YouTubePlayer = memo(function YouTubePlayer({ videoId, title = 'Study video' }) {
  if (!videoId) {
    return (
      <div style={styles.placeholder}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
          No video loaded
        </p>
      </div>
    );
  }

  // IFrame embed parameters:
  //   autoplay=1        - start playing immediately
  //   rel=0             - don't show related videos from other channels
  //   modestbranding=1  - minimal YouTube branding
  //   playsinline=1     - inline on iOS
  //   enablejsapi=1     - enable JS API for future extensions (volume, seek)
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  return (
    <div style={styles.wrapper}>
      <iframe
        style={styles.iframe}
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
      />
    </div>
  );
});

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    paddingBottom: '56.25%', // 16:9 aspect ratio
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    background: '#000',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  iframe: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: '16/9',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
};

export default YouTubePlayer;
