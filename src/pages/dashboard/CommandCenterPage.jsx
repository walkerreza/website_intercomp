import {
  AlertTriangle,
  Coins,
  Crown,
  Hourglass,
  ScrollText,
  Zap,
} from "lucide-react";

function formatDueDate(dateValue) {
  if (!dateValue) return "No deadline";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(dateValue));
}

function formatHistoryTime(dateValue) {
  if (!dateValue) return "Now";

  const timestamp = new Date(dateValue);
  if (Number.isNaN(timestamp.getTime())) return "Now";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(timestamp);
}

function getBountyAlertMessage(stats) {
  if (stats.overdue > 0) {
    return `URGENT: ${stats.overdue} Overdue Quests Require Attention`;
  }

  if (stats.dueSoon > 0) {
    return `NOTICE: ${stats.dueSoon} Quest Deadlines Are Closing In`;
  }

  if (stats.active > 0) {
    return `${stats.active} Active Quests Available on the Bounty Board`;
  }

  return "Bounty Board Clear. Create a Quest to Begin the Next Run.";
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

function getRewardValue(difficulty = "") {
  return Number(getDifficultyReward(difficulty).replace(/\D/g, "")) || 50;
}

function buildResourceHistory(stats, priorityQuests) {
  const rows = [];

  if (stats.completed > 0) {
    rows.push({
      description: `+${stats.completed * 5} CR - completed quest rewards`,
      icon: Coins,
      id: "completed-rewards",
      tone: "gold",
      timestamp: "Today",
    });
  }

  if (stats.active > 0) {
    rows.push({
      description: `+${stats.active * 50} XP - active bounty pool`,
      icon: Zap,
      id: "active-pool",
      tone: "xp",
      timestamp: "Now",
    });
  }

  if (stats.dueSoon > 0) {
    rows.push({
      description: `${stats.dueSoon} quest deadlines entering watch`,
      icon: Hourglass,
      id: "deadline-watch",
      tone: "warning",
      timestamp: "Now",
    });
  }

  priorityQuests.slice(0, 3).forEach((quest) => {
    rows.push({
      description: `+${getRewardValue(quest.difficulty)} XP - ${quest.title}`,
      icon: Zap,
      id: `quest-${quest.id}`,
      tone: "xp",
      timestamp: formatHistoryTime(quest.dueAt),
    });
  });

  const idleRows = [
    {
      description: "No shop purchase recorded",
      icon: Coins,
      id: "idle-shop",
      tone: "muted",
      timestamp: "Idle",
    },
    {
      description: "Reward claim queue clear",
      icon: Zap,
      id: "idle-claim",
      tone: "muted",
      timestamp: "Idle",
    },
    {
      description: "No penalty applied",
      icon: Hourglass,
      id: "idle-penalty",
      tone: "muted",
      timestamp: "Idle",
    },
  ];

  idleRows.forEach((row) => {
    if (rows.length < 4) rows.push(row);
  });

  return rows.slice(0, 5);
}

export function CommandCenterPage({
  dashboard,
  characterState,
  commandSummary,
  levelProgress,
  onOpenBoard,
  role,
  roleIcon: RoleIcon,
}) {
  const stats = commandSummary?.questStats ?? {
    active: 0,
    completed: 0,
    overdue: 0,
    dueSoon: 0,
  };
  const priorityQuests = commandSummary?.priorityQuests ?? [];
  const boardMessage = getBountyAlertMessage(stats);
  const bountyAlertTone = stats.overdue > 0 ? "is-urgent" : stats.dueSoon > 0 ? "is-warning" : "is-calm";
  const resourceHistory = buildResourceHistory(stats, priorityQuests);

  return (
    <>
      <section className="sync-hero-panel">
        <div>
          <span className="sync-broadcast">COMMAND CENTER</span>
          <h1>{dashboard.headline}</h1>
        </div>
        <span className="sync-role-badge">
          {RoleIcon ? <RoleIcon size={17} /> : null}
          {role?.name ?? "Operator"}
        </span>
      </section>

      <section className="sync-command-center-layout">
        <article className="sync-panel sync-panel--wide sync-bounty-board-panel">
          <div className={`sync-bounty-alert ${bountyAlertTone}`}>
            <div className="sync-bounty-alert__row sync-bounty-alert__row--kicker">
              <span className="sync-bounty-alert__icon" aria-hidden="true">
                <AlertTriangle size={20} />
              </span>
              <span>GUILD ALERT</span>
            </div>
            <div className="sync-bounty-alert__row sync-bounty-alert__row--main">
              <strong>{stats.overdue || stats.dueSoon || stats.active}</strong>
              <span>{boardMessage}</span>
            </div>
            <div className="sync-bounty-alert__row sync-bounty-alert__row--meta">
              <span>{stats.completed} cleared</span>
              <span>{stats.active} active</span>
              <span>{stats.dueSoon} due soon</span>
            </div>
          </div>
        </article>

        <article className="sync-panel sync-operator-stock-panel">
          <div className="sync-panel-heading">
            <h2>Operator Stock</h2>
            <span>LV {levelProgress.level}</span>
          </div>
          <h3 className="sync-balance-heading">TOTAL ACCOUNT BALANCE</h3>
          <div className="sync-resource-row">
            <span><Coins size={20} /> <strong>{characterState.gold ?? 0}</strong> CR</span>
            <span><Zap size={20} /> <strong>{characterState.xp ?? 0}</strong> XP</span>
          </div>
          <div className="sync-operator-separator" aria-hidden="true" />
          <div className="sync-resource-history">
            <h3>TRANSACTION HISTORY</h3>
            <div className="sync-resource-history-list">
              {resourceHistory.length ? resourceHistory.map((entry) => {
                const EntryIcon = entry.icon;

                return (
                  <div className={`sync-resource-history-row is-${entry.tone}`} key={entry.id}>
                    <time>{entry.timestamp}</time>
                    <span>{entry.description}</span>
                    <EntryIcon size={14} />
                  </div>
                );
              }) : (
                <div className="sync-resource-history-row is-muted">
                  <time>Now</time>
                  <span>No resource movement yet</span>
                  <Coins size={14} />
                </div>
              )}
            </div>
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
                  <strong>{quest.difficulty || getDifficultyRank(quest.difficulty)}</strong>
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
      </section>
    </>
  );
}
