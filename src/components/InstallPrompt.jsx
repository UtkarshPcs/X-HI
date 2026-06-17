import { useState, useEffect } from 'react';
import { X, Share, MoreVertical, PlusSquare, Download } from 'lucide-react';

const DISMISSED_KEY = 'pwa_install_dismissed';

function getOS() {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null); // Chrome/Android native
  const [show, setShow] = useState(false);
  const [os, setOs] = useState('desktop');

  useEffect(() => {
    // Never show if already installed or dismissed permanently
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const platform = getOS();
    setOs(platform);

    if (platform === 'android' || platform === 'desktop') {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }

    if (platform === 'ios') {
      // iOS has no beforeinstallprompt — show manual instructions
      setShow(true);
    }
  }, []);

  function dismiss(permanent = true) {
    setShow(false);
    if (permanent) localStorage.setItem(DISMISSED_KEY, '1');
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss(true);
    else dismiss(false); // don't permanently dismiss — they may change mind
    setDeferredPrompt(null);
  }

  if (!show) return null;

  const isIos = os === 'ios';

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <button
          className="install-dismiss"
          onClick={() => dismiss(true)}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        <div className="install-icon">
          <img src="/favicon.svg" alt="10th HI" width={48} height={48} style={{ borderRadius: 12 }} />
        </div>

        <h3 className="install-title">Add 10th HI to your Home Screen</h3>
        <p className="install-sub">
          Access homework, attendance, and notices instantly — no browser needed.
        </p>

        {isIos ? (
          <ol className="install-steps">
            <li>Tap the <strong>Share</strong> button <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> in Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></li>
            <li>Tap <strong>Add</strong></li>
          </ol>
        ) : (
          <button className="install-btn" onClick={handleInstall}>
            <Download size={16} /> Install App
          </button>
        )}

        <button className="install-later" onClick={() => dismiss(false)}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
