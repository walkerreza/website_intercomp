import { useEffect, useState } from "react";
import { Briefcase, Plus, Shield, Swords } from "lucide-react";
import { loadBoardsAndClansFromSupabase } from "../../services/dashboardService.js";

const emptyDirectory = {
  boards: [],
};

export function WorkspacePage({
  activeWorkspaceId,
  onCreateBoard,
  onOpenBoard,
}) {
  const [directory, setDirectory] = useState(emptyDirectory);
  const [boardName, setBoardName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function refreshDirectory() {
    setIsLoading(true);

    try {
      setDirectory(await loadBoardsAndClansFromSupabase());
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Gagal memuat workspace dari Supabase.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDirectory();
  }, []);

  async function handleCreateBoard(event) {
    event.preventDefault();
    const nextBoardName = boardName.trim();
    if (!nextBoardName) return;

    setBoardName("");
    await onCreateBoard(nextBoardName);
  }

  return (
    <div className="workspace-directory">
      <div className="sync-section-title">
        <div>
          <h1>WORKSPACE</h1>
          <span>SOLO & SQUAD BOARDS | CLICK BOARD TO OPEN QUEST BOARD</span>
        </div>
      </div>

      {message && <div className="sync-visibility-note">{message}</div>}

      <section className="boards-actions-grid boards-actions-grid--compact">
        <form className="boards-action-panel" onSubmit={handleCreateBoard}>
          <div>
            <Briefcase size={18} />
            <strong>Create Solo Board</strong>
          </div>
          <input
            onChange={(event) => setBoardName(event.target.value)}
            placeholder="Nama solo board"
            value={boardName}
          />
          <button type="submit">
            <Plus size={16} />
            Create
          </button>
        </form>
      </section>

      <section className="boards-directory-section">
        <h2>Boards</h2>
        <div className="boards-card-grid">
          {directory.boards.length ? (
            directory.boards.map((board) => (
              <button
                className={`boards-card ${activeWorkspaceId === board.id ? "is-active" : ""}`}
                disabled={board.status !== "Active"}
                key={board.id}
                onClick={() => onOpenBoard(board.id)}
                type="button"
              >
                {board.type === "clan" ? <Swords size={18} /> : <Shield size={18} />}
                <span>
                  <strong>{board.name}</strong>
                  <small>
                    {board.type === "clan" ? `Squad | ${board.clanName || "Clan"}` : "Solo"} | {board.role} | {board.status}
                  </small>
                </span>
                <em>{board.questCount} quest | {board.memberCount} member</em>
              </button>
            ))
          ) : (
            <div className="sync-visibility-note">
              {isLoading ? "Memuat board..." : "Belum ada board."}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
