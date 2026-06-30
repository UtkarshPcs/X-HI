/**
 * Onboarding.jsx — thin compatibility stub.
 * Tour logic has moved to UXRenderer via TourRunner + campaignConfig.
 * This file is kept so any existing import of <Onboarding /> still resolves,
 * but the component is now a no-op — UXRenderer handles everything.
 *
 * forceRun / forceRole props are still supported for backward compatibility
 * with AdminServicesPage; they delegate to AuthContext.triggerTour which
 * UXRenderer already listens to.
 */

export default function Onboarding() {
  // All logic moved to src/ux/components/UXRenderer.jsx
  return null;
}
