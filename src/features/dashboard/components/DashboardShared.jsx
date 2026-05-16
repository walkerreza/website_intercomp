export function ProgressBar({ value, tone = "xp" }) {
  return (
    <div className={`sync-progress sync-progress--${tone}`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function StatLine({ label, value, tone }) {
  return (
    <div className="sync-stat-line">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}

