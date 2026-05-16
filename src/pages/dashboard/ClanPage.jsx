import { useEffect, useState } from "react";
import { ArrowLeft, Briefcase, Copy, Plus, RefreshCw, Swords } from "lucide-react";
import {
  loadClanDetailFromSupabase,
  regenerateClanJoinCodeInSupabase,
} from "../../services/dashboardService.js";

export function ClanPage({ clanId, onBack, onCreateBoard, onOpenBoard }) {
  const [clan, setClan] = useState(null);
  const [boardName, setBoardName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = clan?.viewerRole === "Owner";
  const activeMembers = clan?.members?.filter((member) => member.status === "Active") ?? [];

  async function refreshClan() {
    if (!clanId) return;

    setIsLoading(true);

    try {
      setClan(await loadClanDetailFromSupabase(clanId));
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
    if (!nextBoardName) return;

    setBoardName("");
    await onCreateBoard(clanId, nextBoardName);
  }

  async function handleRegenerateCode() {
    try {
      await regenerateClanJoinCodeInSupabase(clanId);
      await refreshClan();
    } catch (error) {
      setMessage(error.message || "Gagal regenerate kode clan.");
    }
  }

  function handleCopyCode() {
    if (!clan?.joinCode) return;
    navigator.clipboard?.writeText(clan.joinCode);
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
        <Swords size={30} />
        <div>
          <h1>{clan?.name ?? "Clan"}</h1>
          <span>{isOwner ? "Owner Control" : "Member View"}</span>
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
              <strong>Create Squad Board</strong>
            </div>
            <input
              onChange={(event) => setBoardName(event.target.value)}
              placeholder="Nama squad board"
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
        <h2>Squad Boards</h2>
        <div className="boards-card-grid">
          {(clan?.boards ?? []).length ? (
            clan.boards.map((board) => (
              <article className="boards-card" key={board.id}>
                <Briefcase size={18} />
                <span>
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
        <h2>Members</h2>
        <div className="clan-member-grid">
          {activeMembers.map((member) => (
            <article className="clan-member-card" key={member.id}>
              <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
              <span>
                {member.name}
                <small>{member.role} | {member.email}</small>
              </span>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}
