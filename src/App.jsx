import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Onboarding from './components/Onboarding';
import WhatsNew from './components/WhatsNew';
import InstallPrompt from './components/InstallPrompt';
import NotificationPrompt from './components/NotificationPrompt';
import CTABanner from './components/CTABanner';
import ForegroundToast from './components/ForegroundToast';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { UXProvider } from './ux/UXProvider';
import InAppPushManager from './components/InAppPushManager';
import UXRenderer from './ux/components/UXRenderer';
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Homework = lazy(() => import('./pages/Homework'));
const HolidayHomework = lazy(() => import('./pages/HolidayHomework'));
const SchoolCalendar = lazy(() => import('./pages/SchoolCalendar'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const SyllabusPage = lazy(() => import('./pages/SyllabusPage'));
const ClassInfoPage = lazy(() => import('./pages/ClassInfoPage'));
const AdminServicesPage = lazy(() => import('./pages/AdminServicesPage'));
const TestScoresPage = lazy(() => import('./pages/TestScoresPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MathsDashboard = lazy(() => import('./pages/MathsDashboard'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const NoticesPage = lazy(() => import('./pages/NoticesPage'));
const ManageNoticesPage = lazy(() => import('./pages/ManageNoticesPage'));
const TeacherToolsPage = lazy(() => import('./pages/TeacherToolsPage'));
const TestDataPage = lazy(() => import('./pages/TestDataPage'));
const RecordPage = lazy(() => import('./pages/RecordPage'));
const RecordMonitorPage = lazy(() => import('./pages/RecordMonitorPage'));
const RecordAdminPage = lazy(() => import('./pages/RecordAdminPage'));
const RecordTeacherPage = lazy(() => import('./pages/RecordTeacherPage'));
const StudyTogetherPage = lazy(() => import('./pages/StudyTogetherPage'));
const StudyRoomPage = lazy(() => import('./pages/StudyRoomPage'));
const StarBatchPage = lazy(() => import('./pages/StarBatchPage'));
const StarBatchSyllabusPage = lazy(() => import('./pages/StarBatchSyllabusPage'));
const StarBatchTestModulePage = lazy(() => import('./pages/StarBatchTestModulePage'));
const StarBatchTestPlayerPage = lazy(() => import('./pages/StarBatchTestPlayerPage'));
const HistoricalTestAnalysisPage = lazy(() => import('./pages/HistoricalTestAnalysisPage'));
const StarBatchConceptsHub = lazy(() => import('./pages/StarBatchConceptsHub'));
const StarConceptChapterPage = lazy(() => import('./pages/StarConceptChapterPage'));
const PeriodicPredictedAnalysisPage = lazy(() => import('./pages/PeriodicPredictedAnalysisPage'));
const PeriodicPredictedTestPlayerPage = lazy(() => import('./pages/PeriodicPredictedTestPlayerPage'));
import { Heart } from 'lucide-react';
import { checkAndConsumeEmailLink } from './firebase';
import { markEmailVerified } from './auth/authService';
import { useActivityLogger } from './hooks/useActivityLogger';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Saves current non-root path so we can redirect there after login
function RedirectCapture() {
  const { currentUser, loading } = useAuth();
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (loading || currentUser) return;
    if (pathname !== '/' && !pathname.startsWith('/notifications')) {
      sessionStorage.setItem('redirect_after_login', pathname + search);
    }
  }, [pathname, search, currentUser, loading]);
  return null;
}

function AppInner() {
  useActivityLogger();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { refreshUser } = useAuth();
  // pendingReset: { phone } — set when email-reset link is clicked; triggers reset form in AuthModal
  const [resetPhone, setResetPhone] = useState(null);

  // Star Batch is an internal-only feature now (no separate external role/
  // login). Still suppress the normal app-wide popups while viewing the
  // Star Batch portal/syllabus pages, since those are a focused sub-area.
  const isStarBatchOrPortal = pathname.startsWith('/star-batch') || pathname.startsWith('/star-syllabus') || pathname.startsWith('/star-tests') || pathname.startsWith('/star-concepts');

  useEffect(() => {
    async function handleEmailLink() {
      try {
        const result = await checkAndConsumeEmailLink(window.location.href);
        if (!result) return;
        // Clean the URL so the link params don't linger
        window.history.replaceState(null, '', window.location.pathname);
        if (result.emailAction === 'verify') {
          // Get phone from session to mark verified
          const phone = localStorage.getItem('auth_phone');
          if (phone) {
            await markEmailVerified(phone);
            await refreshUser(phone);
          }
          navigate('/profile', { state: { emailVerified: true } });
        } else if (result.emailAction === 'reset' && result.phone) {
          setResetPhone(result.phone);
        }
      } catch (err) {
        console.warn('Email link handling failed:', err);
      }
    }
    handleEmailLink();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ScrollToTop />
      <RedirectCapture />
      <div className="app-container">
        <Navbar />
        {!isStarBatchOrPortal && <InAppPushManager />}
        <main className="main-content">
          {!isStarBatchOrPortal && <CTABanner />}
          {!isStarBatchOrPortal && <NotificationPrompt />}
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><div className="loader" /></div>}>
            <Routes>
              <Route path="/" element={<StudentDashboard />} />
              <Route path="/homework" element={<Homework />} />
              <Route path="/holidays" element={<HolidayHomework />} />
              <Route path="/calendar" element={<SchoolCalendar />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/syllabus" element={<SyllabusPage />} />
              <Route path="/class-info" element={<ClassInfoPage />} />
              <Route path="/admin-services" element={<AdminServicesPage />} />
              <Route path="/test-scores" element={<TestScoresPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/maths" element={<MathsDashboard />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/manage-notices" element={<ManageNoticesPage />} />
              <Route path="/teacher-tools" element={<TeacherToolsPage />} />
              <Route path="/test-data" element={<TestDataPage />} />
              <Route path="/records" element={<RecordPage />} />
              <Route path="/records-monitor" element={<RecordMonitorPage />} />
              <Route path="/records-admin" element={<RecordAdminPage />} />
              <Route path="/teacher-records" element={<RecordTeacherPage />} />
              <Route path="/study-together" element={<StudyTogetherPage />} />
              <Route path="/study-together/:roomId" element={<StudyRoomPage />} />
              <Route path="/star-batch" element={<StarBatchPage />} />
              <Route path="/star-syllabus" element={<StarBatchSyllabusPage />} />
              <Route path="/star-tests" element={<StarBatchTestModulePage />} />
              <Route path="/star-tests/:testId" element={<StarBatchTestPlayerPage />} />
              <Route path="/star-tests/history/:attemptId" element={<HistoricalTestAnalysisPage />} />
              <Route path="/star-concepts" element={<StarBatchConceptsHub />} />
              <Route path="/star-concepts/:chapterId" element={<StarConceptChapterPage />} />
              <Route path="/periodic-predicted" element={<PeriodicPredictedAnalysisPage />} />
              <Route path="/periodic-predicted/test/:subject/:setNumber" element={<PeriodicPredictedTestPlayerPage />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="app-footer">
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Designed and developed by <span
              onClick={() => {
                if (window.confirm("You are about to be redirected to WhatsApp to chat with Utkarsh. Do you want to continue?")) {
                  window.open("https://wa.me/918102783645", "_blank");
                }
              }}
              style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s ease', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--primary)'}
            >Utkarsh</span> <Heart size={14} color="var(--secondary)" fill="var(--secondary)" />
          </p>
        </footer>
      </div>
      <AuthModal resetPhone={resetPhone} onResetConsumed={() => setResetPhone(null)} />
      {!isStarBatchOrPortal && (
        <>
          <Onboarding />
          <WhatsNew />
          <InstallPrompt />
          <ForegroundToast />
          <UXRenderer />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UXProvider>
          <AppInner />
        </UXProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
