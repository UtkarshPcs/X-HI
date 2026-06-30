/**
 * UXTooltip.jsx
 * Single Joyride tooltipComponent replacing the three duplicates:
 *   - CustomTooltip    (Onboarding.jsx)
 *   - WhatsNewTooltip  (WhatsNew.jsx)
 *   - TourTooltip      (NotesPage.jsx)
 *
 * Variants:
 *   'onboarding' — role-aware gradient, X/Y progress text
 *   'whats-new'  — fixed primary gradient, dot progress
 *   'tour'       — neutral, X/Y progress text (Notes page style)
 *
 * Usage:
 *   <Joyride tooltipComponent={(props) => <UXTooltip {...props} variant="onboarding" role={role} />} />
 */

import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../auth/roles';

/**
 * @param {object} joyrideProps - standard Joyride tooltip props
 * @param {'onboarding'|'whats-new'|'tour'} [variant='tour']
 * @param {string|null} [role] - override role for gradient (onboarding variant)
 */
export default function UXTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  variant = 'tour',
  role: roleProp = null,
}) {
  const { currentUser } = useAuth();
  const role = roleProp || currentUser?.role;

  // Gradient / accent colour per role (onboarding variant only)
  const isMonitor = role === ROLES.MONITOR;
  const isTeacher = role === ROLES.TEACHER;

  const accentVar = variant === 'onboarding'
    ? (isMonitor ? 'var(--secondary)' : isTeacher ? '#10b981' : 'var(--primary)')
    : 'var(--primary)';

  const gradientBg = variant === 'onboarding'
    ? (isMonitor
        ? 'linear-gradient(135deg, var(--secondary), #f472b6)'
        : isTeacher
          ? 'linear-gradient(135deg, #10b981, #3b82f6)'
          : 'linear-gradient(135deg, var(--primary), #a78bfa)')
    : 'linear-gradient(135deg, var(--primary), #a78bfa)';

  const roleClass = variant === 'onboarding'
    ? (isMonitor ? 'role-monitor' : isTeacher ? 'role-teacher' : 'role-student')
    : 'role-student';

  const totalSteps = step.totalSteps || 1;

  return (
    <div
      {...tooltipProps}
      className={`custom-tooltip spring-up ${roleClass}`}
    >
      {/* Header */}
      <div className="tooltip-header stagger-1">
        {step.icon && (
          <span style={{ color: accentVar, flexShrink: 0 }}>{step.icon}</span>
        )}
        <h3
          className="tooltip-title"
          style={{ background: gradientBg, WebkitBackgroundClip: 'text', color: 'transparent' }}
        >
          {step.title}
        </h3>
      </div>

      {/* Body */}
      <div className="tooltip-body stagger-2">{step.content}</div>

      {/* Footer */}
      <div className="tooltip-footer stagger-3">
        {variant === 'whats-new' ? (
          /* Dot progress (What's New style) */
          <div className="tour-dots">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span key={i} className={`tour-dot ${i === index ? 'active' : ''}`} />
            ))}
          </div>
        ) : (
          /* Text progress (Onboarding / Notes style) */
          <div className="tooltip-progress">{index + 1} / {totalSteps}</div>
        )}

        <div className="tooltip-controls">
          {/* Skip — shown on all non-last steps */}
          {!isLastStep && (
            variant === 'whats-new'
              ? <button {...closeProps} className="tour-skip-link">Skip tour</button>
              : <button {...closeProps} className="tooltip-skip">Skip</button>
          )}

          {/* Back */}
          {index > 0 && (
            <button {...backProps} className="tooltip-btn secondary">Back</button>
          )}

          {/* Next / Finish */}
          <button
            {...primaryProps}
            className="tooltip-btn primary"
            style={variant === 'onboarding' ? { background: accentVar } : undefined}
          >
            {isLastStep
              ? (variant === 'whats-new' ? 'Got it!' : 'Finish')
              : variant === 'whats-new'
                ? `Next (${index + 1}/${totalSteps})`
                : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
