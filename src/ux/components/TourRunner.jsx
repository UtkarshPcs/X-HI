/**
 * TourRunner.jsx
 * Single Joyride wrapper for all tours in the app.
 * Replaces the inline Joyride usage in Onboarding.jsx, WhatsNew.jsx, NotesPage.jsx.
 *
 * Usage:
 *   <TourRunner
 *     campaignId="onboarding-v1"
 *     steps={getOnboardingSteps(user)}
 *     run={true}
 *     variant="onboarding"
 *     role={user.role}
 *     onComplete={() => {}}
 *   />
 */

import { useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import UXTooltip from './UXTooltip';

/**
 * @param {{
 *   campaignId: string,
 *   steps: object[],
 *   run: boolean,
 *   variant?: 'onboarding'|'whats-new'|'tour',
 *   role?: string|null,
 *   onComplete: () => void,
 *   disableScrolling?: boolean,
 * }} props
 */
export default function TourRunner({
  campaignId,
  steps,
  run,
  variant = 'tour',
  role = null,
  onComplete,
  disableScrolling = true,
}) {
  const handleCallback = useCallback((data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onComplete?.();
    }
  }, [onComplete]);

  if (!run || !steps || steps.length === 0) return null;

  return (
    <Joyride
      key={campaignId}
      steps={steps}
      run={run}
      continuous
      showSkipButton
      disableScrolling={disableScrolling}
      disableOverlayClose={false}
      spotlightClicks={false}
      tooltipComponent={(joyrideProps) => (
        <UXTooltip {...joyrideProps} variant={variant} role={role} />
      )}
      callback={handleCallback}
      styles={{
        options: {
          overlayColor: 'rgba(0, 0, 0, 0.65)',
          zIndex: 10000,
          arrowColor: 'var(--surface)',
        },
      }}
    />
  );
}
