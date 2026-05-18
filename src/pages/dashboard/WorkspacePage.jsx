import { useEffect, useState } from "react";
import { Briefcase, Plus, Search, Shield, Swords } from "lucide-react";
import {
  getWorkspaceCoverImageSrc,
  getWorkspaceCoverPresets,
} from "../../data/workspaceCovers.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
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
  const [coverKey, setCoverKey] = useState("study-desk");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [boardSearch, setBoardSearch] = useState("");
  const debouncedBoardSearch = useDebouncedValue(boardSearch, 350);
  const normalizedBoardSearch = debouncedBoardSearch.trim().toLowerCase();
  const visibleBoards = normalizedBoardSearch
    ? directory.boards.filter((board) => {
        return [
          board.name,
          board.type,
          board.clanName,
          board.role,
          board.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedBoardSearch);
      })
    : directory.boards;

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

    if (!nextBoardName) {
      setMessage("Nama solo board wajib diisi.");
      return;
    }

    if (nextBoardName.length < 3) {
      setMessage("Nama solo board minimal 3 karakter.");
      return;
    }

    if (nextBoardName.length > 60) {
      setMessage("Nama solo board maksimal 60 karakter.");
      return;
    }

    const hasDuplicateName = directory.boards.some((board) => {
      return board.name?.trim().toLowerCase() === nextBoardName.toLowerCase();
    });

    if (hasDuplicateName) {
      setMessage("Nama board sudah digunakan.");
      return;
    }

    setIsCreating(true);
    setMessage("");

    try {
      await onCreateBoard(nextBoardName, coverKey);
      setBoardName("");
    } catch (error) {
      setMessage(error.message || "Gagal membuat solo board.");
    } finally {
      setIsCreating(false);
    }
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
            disabled={isCreating}
            maxLength={60}
            onChange={(event) => setBoardName(event.target.value)}
            placeholder="Nama solo board"
            value={boardName}
          />
          <div className="workspace-cover-picker" aria-label="Pilih board cover">
            {getWorkspaceCoverPresets("solo").map((cover) => (
              <button
                className={coverKey === cover.id ? "is-active" : ""}
                disabled={isCreating}
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
          <button disabled={isCreating} type="submit">
            <Plus size={16} />
            {isCreating ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section className="boards-directory-section">
        <div className="boards-directory-heading">
          <h2>Boards</h2>
          <label className="boards-search-field">
            <Search size={15} />
            <input
              onChange={(event) => setBoardSearch(event.target.value)}
              placeholder="Search board"
              type="search"
              value={boardSearch}
            />
          </label>
        </div>
        <div className="boards-card-grid">
          {visibleBoards.length ? (
            visibleBoards.map((board) => (
              <button
                className={`boards-card boards-card--with-cover ${activeWorkspaceId === board.id ? "is-active" : ""}`}
                disabled={board.status !== "Active"}
                key={board.id}
                onClick={() => onOpenBoard(board.id)}
                type="button"
              >
                <span className="workspace-cover-preview workspace-cover-preview--card">
                  <img
                    alt=""
                    src={getWorkspaceCoverImageSrc(
                      board.type === "clan" ? "clan" : "solo",
                      board.coverKey,
                    )}
                  />
                  <span className="workspace-cover-badge">
                    {board.type === "clan" ? <Swords size={15} /> : <Shield size={15} />}
                  </span>
                </span>
                <span className="boards-card__content">
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
              {isLoading
                ? "Memuat board..."
                : normalizedBoardSearch
                  ? "Board tidak ditemukan."
                  : "Belum ada board."}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
