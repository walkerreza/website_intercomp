import { useEffect, useState } from "react";
import { Plus, Swords, UserCheck } from "lucide-react";
import { loadBoardsAndClansFromSupabase } from "../../services/dashboardService.js";

export function ClanDirectoryPage({ onCreateClan, onJoinClan, onOpenClan }) {
  const [clans, setClans] = useState([]);
  const [clanName, setClanName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function refreshClans() {
    setIsLoading(true);

    try {
      const directory = await loadBoardsAndClansFromSupabase();
      setClans(directory.clans);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Gagal memuat clan dari Supabase.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshClans();
  }, []);

  async function handleCreateClan(event) {
    event.preventDefault();
    const nextClanName = clanName.trim();
    if (!nextClanName) return;

    setClanName("");
    await onCreateClan(nextClanName);
  }

  async function handleJoinClan(event) {
    event.preventDefault();
    if (!joinCode.trim()) return;

    await onJoinClan(joinCode);
    setJoinCode("");
    await refreshClans();
  }

  return (
    <div className="workspace-directory">
      <div className="sync-section-title">
        <div>
          <h1>CLAN</h1>
          <span>SQUAD ROOM | MEMBERS | CLAN BOARDS</span>
        </div>
      </div>

      {message && <div className="sync-visibility-note">{message}</div>}

      <section className="boards-actions-grid boards-actions-grid--compact">
        <form className="boards-action-panel" onSubmit={handleCreateClan}>
          <div>
            <Swords size={18} />
            <strong>Create Clan</strong>
          </div>
          <input
            onChange={(event) => setClanName(event.target.value)}
            placeholder="Nama clan atau squad"
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
            <strong>Join Clan Instantly</strong>
          </div>
          <input
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="Room code clan"
            value={joinCode}
          />
          <button type="submit">
            <UserCheck size={16} />
            Join
          </button>
        </form>
      </section>

      <section className="boards-directory-section">
        <h2>Clans</h2>
        <div className="boards-card-grid">
          {clans.length ? (
            clans.map((clan) => (
              <button
                className="boards-card"
                disabled={clan.status !== "Active"}
                key={clan.id}
                onClick={() => onOpenClan(clan.id)}
                type="button"
              >
                <Swords size={18} />
                <span>
                  <strong>{clan.name}</strong>
                  <small>{clan.role} | {clan.status}</small>
                </span>
                <em>
                  {clan.memberCount} member | {clan.boardCount} board
                </em>
              </button>
            ))
          ) : (
            <div className="sync-visibility-note">
              {isLoading ? "Memuat clan..." : "Belum ada clan."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
