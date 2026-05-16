import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Coins,
  Crown,
  Swords,
  Timer,
  Zap,
} from "lucide-react";
import { ProgressBar, StatLine } from "../../features/dashboard/components/DashboardShared.jsx";

function formatDueDate(dateValue) {
  if (!dateValue) return "No deadline";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(dateValue));
}

export function CommandCenterPage({
  dashboard,
  role,
  roleIcon: RoleIcon,
  characterState,
  commandSummary,
  levelProgress,
  onOpenBoard,
  onOpenClan,
  workspaceState,
}) {
  const stats = commandSummary?.questStats ?? {
    active: 0,
    completed: 0,
    overdue: 0,
    dueSoon: 0,
  };
  const workspaces = commandSummary?.workspaces ?? [];
  const clans = commandSummary?.clans ?? [];
  const priorityQuests = commandSummary?.priorityQuests ?? [];
  const totalTracked = stats.active + stats.completed;
  const completionRate = totalTracked ? Math.round((stats.completed / totalTracked) * 100) : 0;
  const riskRate = stats.active ? Math.min(100, Math.round((stats.overdue / stats.active) * 100)) : 0;
  const dueSoonRate = stats.active ? Math.min(100, Math.round((stats.dueSoon / stats.active) * 100)) : 0;

  return (
    <>
      <section className="sync-hero-panel">
        <div>
          <span className="sync-broadcast">COMMAND CENTER</span>
          <h1>{dashboard.headline}</h1>
          <p>
            {dashboard.status} | ACTIVE BOARD: {workspaceState.name}
          </p>
        </div>
        <span className="sync-role-badge" style={{ "--role-accent": role.accent }}>
          <RoleIcon size={18} />
          {role.name}
        </span>
      </section>

      <section className="sync-panel-grid">
        <article className="sync-panel sync-panel--wide">
          <div className="sync-panel-heading">
            <h2>Mission Overview</h2>
            <span>ALL WORKSPACES</span>
          </div>
          <div className="sync-command-stats">
            <div>
              <Briefcase size={18} />
              <strong>{stats.active}</strong>
              <span>Active</span>
            </div>
            <div>
              <CheckCircle2 size={18} />
              <strong>{stats.completed}</strong>
              <span>Completed</span>
            </div>
            <div>
              <AlertTriangle size={18} />
              <strong>{stats.overdue}</strong>
              <span>Overdue</span>
            </div>
            <div>
              <Timer size={18} />
              <strong>{stats.dueSoon}</strong>
              <span>Due Soon</span>
            </div>
          </div>
          <div className="sync-stat-stack">
            <StatLine label="Completion" value={completionRate} tone="xp" />
            <StatLine label="Deadline risk" value={riskRate} tone="hp" />
            <StatLine label="Next 48 hours" value={dueSoonRate} tone="gold" />
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>Operator Progress</h2>
            <span>LV {levelProgress.level}</span>
          </div>
          <p className="sync-terminal-copy">{dashboard.passive}</p>
          <div className="sync-resource-row">
            <span><Coins size={18} /> {characterState.gold} CR</span>
            <span><Zap size={18} /> {characterState.xp ?? 0} XP</span>
          </div>
          <div className="sync-command-level">
            <div>
              <strong>Level {levelProgress.level}</strong>
              <span>{levelProgress.currentXp}/{levelProgress.nextLevelXp} XP</span>
            </div>
            <ProgressBar value={levelProgress.progress} tone="xp" />
          </div>
        </article>

        <article className="sync-panel sync-panel--wide">
          <div className="sync-panel-heading">
            <h2>Priority Missions</h2>
            <span>{priorityQuests.length} TARGET</span>
          </div>
          <div className="sync-command-list">
            {priorityQuests.length ? priorityQuests.map((quest) => (
              <button key={quest.id} onClick={() => onOpenBoard(quest.workspaceId)} type="button">
                <span>
                  <strong>{quest.title}</strong>
                  <small>{quest.workspaceName} | {quest.workspaceType} | {formatDueDate(quest.dueAt)}</small>
                </span>
                <em>{quest.difficulty}</em>
              </button>
            )) : (
              <div className="sync-visibility-note">Tidak ada priority mission aktif.</div>
            )}
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>Clan Snapshot</h2>
            <span>{clans.length} CLAN</span>
          </div>
          <div className="sync-command-list">
            {clans.length ? clans.map((clan) => (
              <button key={clan.id} onClick={() => onOpenClan(clan.id)} type="button">
                <Swords size={18} />
                <span>
                  <strong>{clan.name}</strong>
                  <small>{clan.role} | {clan.memberCount} member | {clan.boardCount} board</small>
                </span>
              </button>
            )) : (
              <div className="sync-visibility-note">Belum join clan.</div>
            )}
          </div>
        </article>

        <article className="sync-panel sync-panel--wide">
          <div className="sync-panel-heading">
            <h2>Workspace Snapshot</h2>
            <span>{workspaces.length} BOARD</span>
          </div>
          <div className="sync-command-workspaces">
            {workspaces.length ? workspaces.map((workspace) => {
              const workspaceTotal = workspace.activeQuestCount + workspace.completedQuestCount;
              const workspaceProgress = workspaceTotal
                ? Math.round((workspace.completedQuestCount / workspaceTotal) * 100)
                : 0;

              return (
                <button key={workspace.id} onClick={() => onOpenBoard(workspace.id)} type="button">
                  {workspace.type === "squad" ? <Swords size={18} /> : <Crown size={18} />}
                  <span>
                    <strong>{workspace.name}</strong>
                    <small>
                      {workspace.type === "squad" ? workspace.clanName || "Squad" : "Solo"} | {workspace.memberCount} member
                    </small>
                    <ProgressBar value={workspaceProgress} tone="xp" />
                  </span>
                  <em>{workspace.activeQuestCount} active</em>
                </button>
              );
            }) : (
              <div className="sync-visibility-note">Belum ada workspace aktif.</div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
