import { useEffect, useState } from "react";
import { ArrowLeft, Briefcase, Copy, LogOut, Plus, RefreshCw, Swords, Trophy, UserCheck, UserX } from "lucide-react";
import { getClanThumbnailImageSrc } from "../../data/clanThumbnails.js";
import {
  getWorkspaceCoverImageSrc,
  getWorkspaceCoverPresets,
} from "../../data/workspaceCovers.js";
import {
  approveClanMemberInSupabase,
  kickClanMemberInSupabase,
  leaveClanInSupabase,
  loadClanDetailFromSupabase,
  regenerateClanJoinCodeInSupabase,
  rejectClanMemberInSupabase,
} from "../../services/dashboardService.js";

export function ClanPage({ clanId, onBack, onClanLoaded, onCreateBoard, onOpenBoard }) {
  const [clan, setClan] = useState(null);
  const [boardName, setBoardName] = useState("");
  const [coverKey, setCoverKey] = useState("guild-hall");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

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
    if (!clanId) return;

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
    const nextBoardName = boardName.trim();

    if (!isOwner) {
      setMessage("Hanya owner yang bisa membuat squad board.");
      return;
    }

    if (!clanId) {
      setMessage("Clan belum siap dimuat. Coba lagi setelah data selesai.");
      return;
    }

    if (!nextBoardName) {
      setMessage("Nama squad board wajib diisi.");
      return;
    }

    if (nextBoardName.length < 3) {
      setMessage("Nama squad board minimal 3 karakter.");
      return;
    }

    if (nextBoardName.length > 60) {
      setMessage("Nama squad board maksimal 60 karakter.");
      return;
    }

    const hasDuplicateName = (clan?.boards ?? []).some((board) => {
      return board.name?.trim().toLowerCase() === nextBoardName.toLowerCase();
    });

    if (hasDuplicateName) {
      setMessage("Nama squad board sudah digunakan di clan ini.");
      return;
    }

    setIsCreatingBoard(true);
    setMessage("");

    try {
      await onCreateBoard(clanId, nextBoardName, coverKey);
      setBoardName("");
    } catch (error) {
      setMessage(error.message || "Gagal membuat squad board.");
    } finally {
      setIsCreatingBoard(false);
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

  async function handleLeaveClan() {
    if (!window.confirm(`Keluar dari clan "${clan?.name ?? "ini"}"?`)) return;

    try {
      await leaveClanInSupabase(clanId);
      setMessage("Kamu sudah keluar dari clan.");
      onBack();
    } catch (error) {
      setMessage(error.message || "Gagal keluar dari clan.");
    }
  }

  async function handleKickMember(member) {
    if (!window.confirm(`Kick ${member.name} dari clan?`)) return;

    try {
      await kickClanMemberInSupabase(clanId, member.id);
      await refreshClan();
    } catch (error) {
      setMessage(error.message || "Gagal kick member.");
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

  function getClanInviteLink() {
    if (!clan?.joinCode) return "";
    return `${window.location.origin}/login?clan=${encodeURIComponent(clan.joinCode)}`;
  }

  function handleCopyInviteLink() {
    const inviteLink = getClanInviteLink();
    if (!inviteLink) return;
    navigator.clipboard?.writeText(inviteLink);
    setMessage("Link invite clan berhasil disalin.");
  }

  function handleCopyInviteEmbed() {
    const inviteLink = getClanInviteLink();
    if (!inviteLink) return;
    navigator.clipboard?.writeText(`Join clan ${clan?.name ?? "Questify"} di Questify RPG: ${inviteLink}`);
    setMessage("Embed invite clan berhasil disalin.");
  }

  function handleCopyBoardCode(joinCode) {
    if (!joinCode) return;
    navigator.clipboard?.writeText(joinCode);
  }

  return (
    <div className="workspace-directory">
      <div className="sync-section-title">
        <div>
          <h1>{clan?.name ?? "CLAN"}</h1>
          <span>{isLoading ? "LOADING..." : `${activeMembers.length} MEMBER | ${clan?.boards?.length ?? 0} BOARD`}</span>
        </div>
        <button className="workspace-back-button" onClick={onBack} type="button">
          <ArrowLeft size={17} />
          Boards
        </button>
      </div>

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

      <section className="boards-actions-grid">
        {isOwner ? (
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
        ) : (
          <article className="boards-action-panel">
            <div>
              <LogOut size={18} />
              <strong>Leave Clan</strong>
            </div>
            <small className="clan-form-hint">
              Keluar dari clan akan mencabut akses ke semua squad board clan ini.
            </small>
            <button onClick={handleLeaveClan} type="button">
              <LogOut size={16} />
              Leave Clan
            </button>
          </article>
        )}

        {isOwner && (
          <article className="boards-action-panel clan-invite-panel">
            <div>
              <Copy size={18} />
              <strong>Invite Link</strong>
            </div>
            <small className="clan-form-hint">
              Bagikan link ini ke sosial media. User yang belum login akan diarahkan login dulu, lalu otomatis join clan.
            </small>
            <input readOnly value={getClanInviteLink()} />
            <div className="clan-inline-actions">
              <button onClick={handleCopyInviteLink} type="button">
                <Copy size={16} />
                Copy Link
              </button>
              <button onClick={handleCopyInviteEmbed} type="button">
                <Copy size={16} />
                Copy Embed
              </button>
            </div>
          </article>
        )}

        {isOwner && (
          <form className="boards-action-panel" onSubmit={handleCreateBoard}>
            <div>
              <Briefcase size={18} />
              <strong>Create Squad Board</strong>
            </div>
            <input
              disabled={isCreatingBoard}
              maxLength={60}
              onChange={(event) => setBoardName(event.target.value)}
              placeholder="Nama squad board"
              value={boardName}
            />
            <div className="workspace-cover-picker" aria-label="Pilih board cover">
              {getWorkspaceCoverPresets("clan").map((cover) => (
                <button
                  className={coverKey === cover.id ? "is-active" : ""}
                  disabled={isCreatingBoard}
                  key={cover.id}
                  onClick={() => setCoverKey(cover.id)}
                  type="button"
                >
                  <span className="workspace-cover-preview">
                    <img alt="" src={cover.imageSrc} />
                  </span>
                  <strong>{cover.title}</strong>
                </button>
              ))}
            </div>
            <button disabled={isCreatingBoard} type="submit">
              <Plus size={16} />
              {isCreatingBoard ? "Creating..." : "Create"}
            </button>
          </form>
        )}
      </section>

      <section className="boards-directory-section">
        <h2>Squad Boards</h2>
        <div className="boards-card-grid">
          {(clan?.boards ?? []).length ? (
            clan.boards.map((board) => (
              <article className="boards-card boards-card--with-cover" key={board.id}>
                <span className="workspace-cover-preview workspace-cover-preview--card">
                  <img alt="" src={getWorkspaceCoverImageSrc("clan", board.coverKey)} />
                  <span className="workspace-cover-badge">
                    <Briefcase size={15} />
                  </span>
                </span>
                <span className="boards-card__content">
                  <strong>{board.name}</strong>
                  <small>{board.questCount} quest</small>
                  {isOwner && board.joinCode ? (
                    <small>Invite code: {board.joinCode}</small>
                  ) : null}
                </span>
                <div className="clan-inline-actions">
                  <button onClick={() => onOpenBoard(board.id)} type="button">
                    Open
                  </button>
                  {isOwner && board.joinCode ? (
                    <button onClick={() => handleCopyBoardCode(board.joinCode)} type="button">
                      <Copy size={15} />
                      Copy Code
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="sync-visibility-note">
              {isLoading ? "Memuat squad board..." : "Belum ada squad board."}
            </div>
          )}
        </div>
      </section>

      <section className="boards-directory-section">
        <div className="boards-directory-heading">
          <h2>Member Leaderboard</h2>
          <span className="clan-ranking-caption">Rank by claimed XP</span>
        </div>
        <div className="clan-member-grid clan-member-grid--leaderboard">
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
              {isOwner && member.role !== "Owner" && (
                <button className="clan-member-kick-button" onClick={() => handleKickMember(member)} type="button">
                  <UserX size={14} />
                  Kick
                </button>
              )}
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

    </div>
  );
}
