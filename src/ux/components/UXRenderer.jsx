/**
 * UXRenderer.jsx
 * Single mount point for all active UX elements.
 * Replaces the 5 separate component mounts in App.jsx:
 *   <Onboarding />, <WhatsNew />, <InstallPrompt />, <NotificationPrompt />, <ForegroundToast />
 *
 * Mount this once inside AppInner (after Navbar, outside Routes).
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useUX } from '../UXProvider';

// UX components
import CampaignBanner from './CampaignBanner';
import CampaignModal from './CampaignModal';
import TourRunner from './TourRunner';
import ToastContainer from './ToastContainer';

// Notification prompt (needs browser API check, managed as a prompt campaign)
import NotificationPromptBanner from './NotificationPromptBanner';

// PWA install (browser-event driven, not in campaign queue)
import InstallPromptWrapper from './InstallPromptWrapper';

import { getOnboardingSteps, WHATS_NEW_TOUR_STEPS } from '../campaignConfig';

export default function UXRenderer() {
  const { currentUser } = useAuth();
  const { queue, complete, isActive } = useUX();

  // What's New tour: started by the modal's "Take a tour" button
  const [runWhatsNewTour, setRunWhatsNewTour] = useState(false);

  // Onboarding: driven by campaign queue
  const onboardingCampaign = queue.find(c => c.id === 'onboarding-v1');
  const [runOnboarding, setRunOnboarding] = useState(false);

  // Start onboarding tour when it appears in queue
  useEffect(() => {
    if (onboardingCampaign) setRunOnboarding(true);
  }, [!!onboardingCampaign]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also support forceRun via AuthContext (admin test tour trigger)
  const { forceTour, clearTour } = useAuth();
  const [forcedTourRun, setForcedTourRun] = useState(false);
  const [forcedTourRole, setForcedTourRole] = useState(null);
  const [forcedTourSteps, setForcedTourSteps] = useState([]);

  useEffect(() => {
    if (forceTour && currentUser) {
      const steps = getOnboardingSteps({ ...currentUser, role: forceTour.role });
      setForcedTourSteps(steps);
      setForcedTourRole(forceTour.role);
      setForcedTourRun(true);
    }
  }, [forceTour, currentUser]);

  if (!currentUser) return <ToastContainer />;

  return (
    <>
      {/* ── Banners (rendered in dashboard context, not here directly) ──────
          CampaignBanner renders inline wherever it's placed. We list here
          the prompt-type banners that live at app level. */}

      {/* Notification permission prompt */}
      <NotificationPromptBanner />

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {isActive('whats-new-v1') && (
        <CampaignModal
          campaignId="whats-new-v1"
          onStartTour={() => setRunWhatsNewTour(true)}
        />
      )}

      {/* ── Tours ──────────────────────────────────────────────────────── */}
      {/* Onboarding tour */}
      <TourRunner
        campaignId="onboarding-v1"
        steps={currentUser ? getOnboardingSteps(currentUser) : []}
        run={runOnboarding && !forcedTourRun}
        variant="onboarding"
        role={currentUser?.role}
        onComplete={() => {
          setRunOnboarding(false);
          complete('onboarding-v1');
        }}
      />

      {/* What's New tour (triggered by modal) */}
      <TourRunner
        campaignId="whats-new-v1-tour"
        steps={WHATS_NEW_TOUR_STEPS}
        run={runWhatsNewTour}
        variant="whats-new"
        onComplete={() => {
          setRunWhatsNewTour(false);
          complete('whats-new-v1');
        }}
      />

      {/* Admin forced tour (from AuthContext.forceTour) */}
      <TourRunner
        campaignId="forced-tour"
        steps={forcedTourSteps}
        run={forcedTourRun}
        variant="onboarding"
        role={forcedTourRole}
        onComplete={() => {
          setForcedTourRun(false);
          setForcedTourSteps([]);
          clearTour();
        }}
      />

      {/* ── PWA Install ─────────────────────────────────────────────────── */}
      <InstallPromptWrapper />

      {/* ── Toast queue ─────────────────────────────────────────────────── */}
      <ToastContainer />
    </>
  );
}
