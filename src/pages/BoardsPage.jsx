import { useEffect, useState } from "react";
import { Briefcase, LogOut, Plus, Settings, Shield, Swords, UserCheck } from "lucide-react";
import {
  createClanInSupabase,
  createPersonalWorkspaceInSupabase,
  loadBoardsAndClansFromSupabase,
  requestJoinClanByCodeInSupabase,
} from "../services/dashboardService.js";

export function BoardsPage({
  accountId,
  onLogout,
  onOpenBoard,
  onOpenClan,
  onOpenSettings,
}) {
  const [directory, setDirectory] = useState({ boards: [], clans: [] });
  const [boardName, setBoardName] = useState("");
  const [clanName, setClanName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function refreshDirectory() {
    setIsLoading(true);

    try {
      setDirectory(await loadBoardsAndClansFromSupabase());
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Gagal memuat boards dan clan.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDirectory();
  }, []);

  async function handleCreateBoard(event) {
    event.preventDefault();
    if (!boardName.trim()) return;

    try {
      const boardId = await createPersonalWorkspaceInSupabase(boardName);
      setBoardName("");
      await refreshDirectory();
      onOpenBoard(boardId);
    } catch (error) {
      setMessage(error.message || "Gagal membuat board.");
    }
  }

  async function handleCreateClan(event) {
    event.preventDefault();
    if (!clanName.trim()) return;

    try {
      const clanId = await createClanInSupabase(clanName);
      setClanName("");
      await refreshDirectory();
      onOpenClan(clanId);
    } catch (error) {
      setMessage(error.message || "Gagal membuat clan.");
    }
  }

  async function handleJoinClan(event) {
    event.preventDefault();
    if (!joinCode.trim()) return;

    try {
      await requestJoinClanByCodeInSupabase(joinCode);
      setJoinCode("");
      await refreshDirectory();
      setMessage("Request join terkirim. Tunggu owner approve.");
    } catch (error) {
      setMessage(error.message || "Gagal join clan.");
    }
  }

  return (
    <main className="boards-page sync-dashboard">
      <header className="boards-topbar">
        <div>
          <strong>Questify</strong>
          <span>{accountId}</span>
        </div>
        <nav>
          <button onClick={onOpenSettings} type="button">
            <Settings size={17} />
            Settings
          </button>
          <button onClick={onLogout} type="button">
            <LogOut size={17} />
            Log out
          </button>
        </nav>
      </header>

      <section className="boards-shell">
        <div className="boards-section-title">
          <div>
            <h1>Your workspaces</h1>
            <span>Board produktivitas personal dan squad</span>
          </div>
          {isLoading && <em>Loading...</em>}
        </div>

        {message && <div className="sync-visibility-note">{message}</div>}

        <section className="boards-actions-grid">
          <form className="boards-action-panel" onSubmit={handleCreateBoard}>
            <div>
              <Briefcase size={18} />
              <strong>Create Board</strong>
            </div>
            <input
              onChange={(event) => setBoardName(event.target.value)}
              placeholder="Nama board personal"
              value={boardName}
            />
            <button type="submit">
              <Plus size={16} />
              Create
            </button>
          </form>

          <form className="boards-action-panel" onSubmit={handleCreateClan}>
            <div>
              <Swords size={18} />
              <strong>Create Clan</strong>
            </div>
            <input
              onChange={(event) => setClanName(event.target.value)}
              placeholder="Nama clan/squad"
              value={clanName}
            />
            <button type="submit">
              <Plus size={16} />
              Create
            </button>
          </form>

          <form className="boards-action-panel" onSubmit={handleJoinClan}>
            <div>
              <UserCheck size={18} />
              <strong>Join Clan</strong>
            </div>
            <input
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Room code"
              value={joinCode}
            />
            <button type="submit">
              <UserCheck size={16} />
              Request
            </button>
          </form>
        </section>

        <section className="boards-directory-section">
          <h2>Boards</h2>
          <div className="boards-card-grid">
            {directory.boards.map((board) => (
              <button
                className="boards-card"
                key={board.id}
                onClick={() => onOpenBoard(board.id)}
                type="button"
              >
                {board.type === "clan" ? <Swords size={18} /> : <Shield size={18} />}
                <span>
                  <strong>{board.name}</strong>
                  <small>
                    {board.type === "clan" ? board.clanName : "Personal"} | {board.questCount} quest | {board.memberCount} member
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="boards-directory-section">
          <h2>Clans</h2>
          <div className="boards-card-grid">
            {directory.clans.map((clan) => (
              <button
                className="boards-card boards-card--clan"
                disabled={clan.status !== "Active"}
                key={clan.id}
                onClick={() => onOpenClan(clan.id)}
                type="button"
              >
                <Swords size={18} />
                <span>
                  <strong>{clan.name}</strong>
                  <small>
                    {clan.role} | {clan.status} | {clan.memberCount} member | {clan.boardCount} board
                  </small>
                </span>
                {clan.pendingCount > 0 && <em>{clan.pendingCount} pending</em>}
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
