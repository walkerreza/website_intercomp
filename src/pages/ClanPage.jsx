import { useEffect, useState } from "react";
import { ArrowLeft, Briefcase, Copy, Plus, RefreshCw, Swords, Trophy, UserCheck, UserX } from "lucide-react";
import { getClanThumbnailImageSrc } from "../data/clanThumbnails.js";
import {
  approveClanMemberInSupabase,
  createWorkspaceForClanInSupabase,
  loadClanDetailFromSupabase,
  regenerateClanJoinCodeInSupabase,
  rejectClanMemberInSupabase,
} from "../services/dashboardService.js";

export function ClanPage({ clanId, onBack, onClanLoaded, onOpenBoard }) {
  const [clan, setClan] = useState(null);
  const [boardName, setBoardName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = clan?.viewerRole === "Owner";
  const activeMembers = clan?.members?.filter((member) => member.status === "Active") ?? [];
  const pendingMembers = clan?.members?.filter((member) => member.status !== "Active") ?? [];
  const rankedMembers = [...activeMembers].sort((left, right) => {
    return (
      right.performanceXp - left.performanceXp ||
      right.completedQuestCount - left.completedQuestCount ||
      left.name.localeCompare(right.name)
    );
  });

  async function refreshClan() {
    setIsLoading(true);

    try {
      const loadedClan = await loadClanDetailFromSupabase(clanId);
      setClan(loadedClan);
      onClanLoaded?.(loadedClan);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Gagal memuat clan.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshClan();
  }, [clanId]);

  async function handleCreateBoard(event) {
    event.preventDefault();
    if (!boardName.trim()) return;

    try {
      const boardId = await createWorkspaceForClanInSupabase(clanId, boardName);
      setBoardName("");
      await refreshClan();
      onOpenBoard(boardId);
    } catch (error) {
      setMessage(error.message || "Gagal membuat workspace clan.");
    }
  }

  async function handleRegenerateCode() {
    try {
      await regenerateClanJoinCodeInSupabase(clanId);
      await refreshClan();
    } catch (error) {
      setMessage(error.message || "Gagal regenerate kode clan.");
    }
  }

  async function handleApprove(userId) {
    try {
      await approveClanMemberInSupabase(clanId, userId);
      await refreshClan();
    } catch (error) {
      setMessage(error.message || "Gagal approve member.");
    }
  }

  async function handleReject(userId) {
    try {
      await rejectClanMemberInSupabase(clanId, userId);
      await refreshClan();
    } catch (error) {
      setMessage(error.message || "Gagal reject member.");
    }
  }

  function handleCopyCode() {
    if (!clan?.joinCode) return;
    navigator.clipboard?.writeText(clan.joinCode);
  }

  return (
    <main className="boards-page sync-dashboard">
      <header className="boards-topbar">
        <button onClick={onBack} type="button">
          <ArrowLeft size={17} />
          Boards
        </button>
        <div>
          <strong>{clan?.name ?? "Clan"}</strong>
          <span>{isLoading ? "Loading..." : `${activeMembers.length} member`}</span>
        </div>
      </header>

      <section className="boards-shell">
        {message && <div className="sync-visibility-note">{message}</div>}

        <div className="clan-hero">
          <span className="clan-thumbnail-preview clan-thumbnail-preview--hero">
            <img alt="" src={getClanThumbnailImageSrc(clan?.thumbnailKey)} />
          </span>
          <div>
            <h1>{clan?.name ?? "Clan"}</h1>
            <span>
              {isOwner ? "Owner Control" : "Member View"} | {clan?.performanceXp ?? 0} XP | {clan?.completedQuestCount ?? 0} cleared quest
            </span>
          </div>
        </div>

        {isOwner && (
          <section className="boards-actions-grid">
            <article className="boards-action-panel">
              <div>
                <Swords size={18} />
                <strong>Room Code</strong>
              </div>
              <strong className="clan-code">{clan?.joinCode || "NO CODE"}</strong>
              <div className="clan-inline-actions">
                <button onClick={handleCopyCode} type="button">
                  <Copy size={16} />
                  Copy
                </button>
                <button onClick={handleRegenerateCode} type="button">
                  <RefreshCw size={16} />
                  Regenerate
                </button>
              </div>
            </article>

            <form className="boards-action-panel" onSubmit={handleCreateBoard}>
              <div>
                <Briefcase size={18} />
                <strong>Create Clan Board</strong>
              </div>
              <input
                onChange={(event) => setBoardName(event.target.value)}
                placeholder="Nama workspace clan"
                value={boardName}
              />
              <button type="submit">
                <Plus size={16} />
                Create
              </button>
            </form>
          </section>
        )}

        <section className="boards-directory-section">
          <h2>Clan Workspaces</h2>
          <div className="boards-card-grid">
            {(clan?.boards ?? []).map((board) => (
              <button
                className="boards-card"
                key={board.id}
                onClick={() => onOpenBoard(board.id)}
                type="button"
              >
                <Briefcase size={18} />
                <span>
                  <strong>{board.name}</strong>
                  <small>{board.questCount} quest</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="boards-directory-section">
          <h2>Members</h2>
          <div className="clan-member-grid">
            {rankedMembers.map((member, index) => (
              <article className="clan-member-card" key={member.id}>
                <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
                <span>
                  {member.name}
                  <small>{member.role} | {member.email}</small>
                  <small>{member.performanceXp} XP | {member.completedQuestCount} cleared quest</small>
                </span>
                <em className="clan-member-rank">
                  <Trophy size={13} />
                  #{index + 1}
                </em>
              </article>
            ))}
          </div>
        </section>

        {isOwner && (
          <section className="boards-directory-section">
            <h2>Pending Requests</h2>
            <div className="clan-member-grid">
              {pendingMembers.length ? pendingMembers.map((member) => (
                <article className="clan-member-card" key={member.id}>
                  <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
                  <span>
                    {member.name}
                    <small>{member.email}</small>
                  </span>
                  <div className="clan-inline-actions">
                    <button onClick={() => handleApprove(member.id)} type="button">
                      <UserCheck size={15} />
                      Approve
                    </button>
                    <button onClick={() => handleReject(member.id)} type="button">
                      <UserX size={15} />
                      Reject
                    </button>
                  </div>
                </article>
              )) : (
                <div className="sync-visibility-note">Tidak ada request pending.</div>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
