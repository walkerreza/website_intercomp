import { useEffect, useState } from "react";
import { Copy, Plus, Search, Swords, UserCheck } from "lucide-react";
import {
  clanThumbnailPresets,
  getClanThumbnailImageSrc,
} from "../../data/clanThumbnails.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { loadBoardsAndClansFromSupabase } from "../../services/dashboardService.js";

export function ClanDirectoryPage({ onCreateClan, onJoinClan, onOpenClan }) {
  const [clans, setClans] = useState([]);
  const [clanName, setClanName] = useState("");
  const [thumbnailKey, setThumbnailKey] = useState("banner");
  const [joinCode, setJoinCode] = useState("");
  const [clanSearch, setClanSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const debouncedClanSearch = useDebouncedValue(clanSearch, 350);
  const normalizedClanSearch = debouncedClanSearch.trim().toLowerCase();
  const visibleClans = normalizedClanSearch
    ? clans.filter((clan) => clan.name.toLowerCase().includes(normalizedClanSearch))
    : clans;

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

    if (!nextClanName) {
      setMessage("Nama clan wajib diisi.");
      return;
    }

    if (nextClanName.length < 3) {
      setMessage("Nama clan minimal 3 karakter.");
      return;
    }

    if (nextClanName.length > 60) {
      setMessage("Nama clan maksimal 60 karakter.");
      return;
    }

    setIsCreating(true);
    setMessage("");

    try {
      await onCreateClan(nextClanName, thumbnailKey);
      setClanName("");
    } catch (error) {
      setMessage(error.message || "Gagal membuat clan.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinClan(event) {
    event.preventDefault();
    if (!joinCode.trim()) {
      setMessage("Room code clan wajib diisi.");
      return;
    }

    await onJoinClan(joinCode);
    setJoinCode("");
    await refreshClans();
  }

  function handleCopyClanCode(code) {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setMessage("Kode clan disalin.");
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
            disabled={isCreating}
            maxLength={60}
            onChange={(event) => setClanName(event.target.value)}
            placeholder="Nama clan atau squad"
            value={clanName}
          />
          <div className="clan-thumbnail-picker" aria-label="Pilih thumbnail clan">
            {clanThumbnailPresets.map((thumbnail) => (
              <button
                className={thumbnailKey === thumbnail.id ? "is-active" : ""}
                disabled={isCreating}
                key={thumbnail.id}
                onClick={() => setThumbnailKey(thumbnail.id)}
                type="button"
              >
                <span className="clan-thumbnail-preview">
                  <img alt="" src={thumbnail.imageSrc} />
                </span>
                <strong>{thumbnail.title}</strong>
              </button>
            ))}
          </div>
          <small className="clan-form-hint">
            Invite member opsional: kode clan bisa dicopy setelah clan dibuat.
          </small>
          <button disabled={isCreating} type="submit">
            <Plus size={16} />
            {isCreating ? "Creating..." : "Create"}
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
        <div className="boards-directory-heading">
          <h2>Clans</h2>
          <label className="boards-search-field">
            <Search size={15} />
            <input
              onChange={(event) => setClanSearch(event.target.value)}
              placeholder="Search clan name"
              type="search"
              value={clanSearch}
            />
          </label>
        </div>
        <div className="boards-card-grid">
          {visibleClans.length ? (
            visibleClans.map((clan) => (
              <button
                className="boards-card clan-directory-card"
                disabled={clan.status !== "Active"}
                key={clan.id}
                onClick={() => onOpenClan(clan.id)}
                type="button"
              >
                <span className="clan-thumbnail-preview clan-thumbnail-preview--card">
                  <img alt="" src={getClanThumbnailImageSrc(clan.thumbnailKey)} />
                </span>
                <span>
                  <strong>{clan.name}</strong>
                  <small>{clan.role} | {clan.status}</small>
                  <small>{clan.performanceXp} XP | {clan.completedQuestCount} cleared</small>
                </span>
                <em>
                  {clan.memberCount} member | {clan.boardCount} board
                </em>
                {clan.joinCode && (
                  <span
                    className="clan-copy-code"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleCopyClanCode(clan.joinCode);
                      }
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCopyClanCode(clan.joinCode);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <Copy size={14} />
                    {clan.joinCode}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="sync-visibility-note">
              {isLoading
                ? "Memuat clan..."
                : normalizedClanSearch
                  ? "Clan tidak ditemukan."
                  : "Belum ada clan."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
