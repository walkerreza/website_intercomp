import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Coins,
  Crown,
  Hourglass,
  ScrollText,
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

function formatQuestCount(count, label) {
  return `${count} quest ${label}`;
}

function getQuestBoardMessage(stats) {
  if (stats.overdue > 0) {
    return `${stats.overdue} cursed quest melewati deadline. Buka scroll prioritas dan selesaikan sebelum ancaman guild naik.`;
  }

  if (stats.dueSoon > 0) {
    return `${stats.dueSoon} quest memasuki 48 jam terakhir. Siapkan fokus party sebelum lonceng deadline berbunyi.`;
  }

  if (stats.active > 0) {
    return `${stats.active} quest aktif tersedia di papan guild. Pilih misi, kumpulkan XP, lalu klaim reward.`;
  }

  return "Papan guild sedang tenang. Buat quest baru untuk membuka petualangan berikutnya.";
}

function getDifficultyRank(difficulty = "") {
  const normalizedDifficulty = difficulty.toLowerCase();

  if (normalizedDifficulty.includes("s") || normalizedDifficulty.includes("hard")) return "BOSS";
  if (normalizedDifficulty.includes("a")) return "ELITE";
  if (normalizedDifficulty.includes("b") || normalizedDifficulty.includes("medium")) return "RARE";
  return "COMMON";
}

function getDifficultyReward(difficulty = "") {
  const normalizedDifficulty = difficulty.toLowerCase();

  if (normalizedDifficulty.includes("s") || normalizedDifficulty.includes("hard")) return "+140 XP";
  if (normalizedDifficulty.includes("a")) return "+120 XP";
  if (normalizedDifficulty.includes("b") || normalizedDifficulty.includes("medium")) return "+80 XP";
  return "+50 XP";
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
  const boardMessage = getQuestBoardMessage(stats);

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

      <section className="sync-panel-grid sync-command-center-grid">
        <article className="sync-panel sync-panel--wide sync-bounty-board-panel">
          <div className="sync-panel-heading">
            <h2>Guild Bounty Board</h2>
            <span>QUEST JOURNAL</span>
          </div>
          <p className="sync-bounty-intro">{boardMessage}</p>
          <div className="sync-command-stats">
            <div className="sync-bounty-stat">
              <Briefcase size={18} />
              <strong>{stats.active}</strong>
              <span>{formatQuestCount(stats.active, "on the board")}</span>
            </div>
            <div className="sync-bounty-stat is-cleared">
              <CheckCircle2 size={18} />
              <strong>{stats.completed}</strong>
              <span>{formatQuestCount(stats.completed, "reward claimed")}</span>
            </div>
            <div className="sync-bounty-stat is-danger">
              <AlertTriangle size={18} />
              <strong>{stats.overdue}</strong>
              <span>{formatQuestCount(stats.overdue, "overdue, selesaikan segera")}</span>
            </div>
            <div className="sync-bounty-stat is-warning">
              <Timer size={18} />
              <strong>{stats.dueSoon}</strong>
              <span>{formatQuestCount(stats.dueSoon, "deadline omen")}</span>
            </div>
          </div>
          <div className="sync-stat-stack">
            <StatLine label="Quest clear rate" value={completionRate} tone="xp" />
            <StatLine label="Danger meter" value={riskRate} tone="hp" />
            <StatLine label="48h alert rune" value={dueSoonRate} tone="gold" />
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

        <article className="sync-panel sync-panel--wide sync-scroll-board-panel">
          <div className="sync-panel-heading">
            <h2>Wanted Quest Scrolls</h2>
            <span>{priorityQuests.length} SEALED SCROLL</span>
          </div>
          <div className="sync-command-list sync-bounty-list">
            {priorityQuests.length ? priorityQuests.map((quest) => (
              <button
                className="sync-bounty-card"
                key={quest.id}
                onClick={() => onOpenBoard(quest.workspaceId)}
                type="button"
              >
                <span className="sync-bounty-seal" aria-hidden="true">
                  <ScrollText size={20} />
                </span>
                <span className="sync-bounty-card-copy">
                  <small>WANTED QUEST | {quest.workspaceType}</small>
                  <strong>{quest.title}</strong>
                  <span>
                    <Hourglass size={15} />
                    Deadline: {formatDueDate(quest.dueAt)}
                  </span>
                  <span>
                    <Crown size={15} />
                    Realm: {quest.workspaceName}
                  </span>
                </span>
                <span className="sync-bounty-reward">
                  <strong>{getDifficultyRank(quest.difficulty)}</strong>
                  <small>{quest.difficulty}</small>
                  <em>{getDifficultyReward(quest.difficulty)}</em>
                </span>
              </button>
            )) : (
              <div className="sync-visibility-note">
                Tidak ada wanted quest aktif. Papan bounty aman untuk sekarang.
              </div>
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
