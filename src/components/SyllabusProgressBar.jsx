/**
 * Dual-metric progress bar for the syllabus tracker.
 *
 * A single track shows two overlaid fills:
 *   • green  (--tertiary)  → completed %  (set by monitor/admin)
 *   • yellow (#f59e0b)     → checked %    (per-student; always ≤ completed)
 *
 * Because "checked" can never exceed "completed" (enforced by statsForTopics),
 * the yellow segment sits on top of the green and reads as "of the completed
 * portion, this much is also checked".
 *
 * Props:
 *   completed  number  0–100
 *   checked    number  0–100
 *   label      string? optional label shown above the bar
 *   sublabel   string? optional right-aligned text (e.g. "12/40 topics")
 *   showLegend boolean? show the green/yellow legend under the bar
 *   size       'sm' | 'md'  bar thickness (default 'md')
 */
export default function SyllabusProgressBar({
  completed = 0,
  checked = 0,
  label,
  sublabel,
  showLegend = false,
  size = 'md',
}) {
  const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));
  const green = clamp(completed);
  const yellow = Math.min(clamp(checked), green); // never exceed completed

  const height = size === 'sm' ? 8 : 12;

  return (
    <div className="syllabus-bar-wrap">
      {(label || sublabel) && (
        <div className="syllabus-bar-head">
          {label && <span className="syllabus-bar-label">{label}</span>}
          {sublabel && <span className="syllabus-bar-sub">{sublabel}</span>}
        </div>
      )}

      <div
        className="syllabus-bar-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={green}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Syllabus progress'}
        title={`${green}% completed · ${yellow}% checked`}
      >
        {/* Green = completed (sits underneath) */}
        <div
          className="syllabus-bar-fill completed"
          style={{ width: `${green}%` }}
        />
        {/* Yellow = checked (overlaid on top of the green portion) */}
        <div
          className="syllabus-bar-fill checked"
          style={{ width: `${yellow}%` }}
        />
      </div>

      {showLegend && (
        <div className="syllabus-bar-legend">
          <span className="syllabus-legend-item">
            <span className="syllabus-dot completed" /> {green}% completed
          </span>
          <span className="syllabus-legend-item">
            <span className="syllabus-dot checked" /> {yellow}% checked
          </span>
        </div>
      )}
    </div>
  );
}
