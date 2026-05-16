import { Coins, Zap } from "lucide-react";
import { guildMembers } from "../../features/dashboard/config/dashboardConfig.js";
import { ProgressBar, StatLine } from "../../features/dashboard/components/DashboardShared.jsx";

export function CommandCenterPage({
  dashboard,
  role,
  roleIcon: RoleIcon,
  characterState,
  workspaceState,
}) {
  return (
    <>
      <section className="sync-hero-panel">
        <div>
          <span className="sync-broadcast">BROADCAST ACTIVE</span>
          <h1>{dashboard.headline}</h1>
          <p>{dashboard.status} | WORKSPACE: {workspaceState.name}</p>
        </div>
        <span className="sync-role-badge" style={{ "--role-accent": role.accent }}>
          <RoleIcon size={18} />
          {role.name}
        </span>
      </section>

      <section className="sync-panel-grid">
        <article className="sync-panel sync-panel--wide">
          <div className="sync-panel-heading">
            <h2>Statistik</h2>
            <span>T-MINUS 30 DAYS</span>
          </div>
          <div className="sync-chart">
            {[48, 36, 57, 44, 66, 53, 38, 74, 82].map((height, index) => (
              <span
                className={index === 6 ? "is-warning" : index === 1 ? "is-danger" : ""}
                key={height + index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>BEHAVIORAL METRICS</h2>
          </div>
          <div className="sync-stat-stack">
            <StatLine label={dashboard.metric} value={Number(dashboard.metricValue.replace("%", ""))} tone="xp" />
            <StatLine label="Guild cohesion" value={62} tone="gold" />
            <StatLine label="Burnout risk" value={31} tone="hp" />
          </div>
          <div className="sync-alert">
            &gt; ALERT: {dashboard.warning}
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>ACTIVE MODIFIER</h2>
          </div>
          <p className="sync-terminal-copy">{dashboard.passive}</p>
          <div className="sync-resource-row">
            <span><Coins size={18} /> {characterState.gold} CR</span>
            <span><Zap size={18} /> {characterState.xp ?? 0} XP</span>
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>READINESS MATRIX</h2>
          </div>
          {guildMembers.map((member) => (
            <div className="sync-readiness" key={member.name}>
              <strong>{member.name}</strong>
              <span>{member.status}</span>
              <ProgressBar value={member.name === "Anjim" ? 20 : member.name === "Budi" ? 80 : 64} tone="xp" />
            </div>
          ))}
        </article>
      </section>
    </>
  );
}
