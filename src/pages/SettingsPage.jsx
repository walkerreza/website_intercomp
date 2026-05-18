import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Image,
  LogOut,
  Moon,
  Music,
  Palette,
  Pause,
  Play,
  Shield,
  Shuffle,
  SkipForward,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { CharacterSprite } from "../components/CharacterSprite.jsx";
import {
  DASHBOARD_BACKGROUND_KEY,
  dashboardBackgrounds,
} from "../data/dashboardBackgrounds.js";
import { musicTracks } from "../data/musicTracks.js";
import { roles } from "../data/roles.js";
import { rolePassiveRules } from "../features/dashboard/utils/rolePassiveEngine.js";

const ROLE_CHANGE_COOLDOWN_MS = 7 * 60 * 60 * 1000;

function getRoleCooldownKey(accountId = "") {
  return `questify:role-change-cooldown:${accountId || "local"}`;
}

function getStoredCooldownEnd(accountId) {
  const storedValue = Number(window.localStorage.getItem(getRoleCooldownKey(accountId)));
  return Number.isFinite(storedValue) ? storedValue : 0;
}

function formatCooldownDuration(durationMs) {
  const totalMinutes = Math.max(0, Math.ceil(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  return `${hours}j ${minutes}m`;
}

export function SettingsPage({
  accountId,
  currentRoleId,
  isLightMode,
  isMusicPlaying,
  isShuffleEnabled,
  musicError,
  musicVolume,
  onMusicShuffleToggle,
  onMusicSkip,
  onMusicSpeakerToggle,
  onMusicTrackChange,
  onMusicToggle,
  onMusicVolumeChange,
  onRoleChange,
  onThemeChange,
  onBack,
  onLogout,
  selectedTrackId,
}) {
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(() => {
    return window.localStorage.getItem(DASHBOARD_BACKGROUND_KEY) || "base";
  });
  const [pendingRoleId, setPendingRoleId] = useState("");
  const [cooldownEndsAt, setCooldownEndsAt] = useState(() => getStoredCooldownEnd(accountId));
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const currentRole = roles.find((role) => role.id === currentRoleId) ?? roles[0];
  const pendingRole = roles.find((role) => role.id === pendingRoleId);
  const selectedTrack = musicTracks.find((track) => track.id === selectedTrackId);
  const roleCooldownRemaining = Math.max(0, cooldownEndsAt - currentTime);
  const isRoleCooldownActive = roleCooldownRemaining > 0;
  const roleCooldownCopy = formatCooldownDuration(roleCooldownRemaining);

  function getRoleSkillInfo(roleId) {
    return rolePassiveRules[roleId] ?? {
      label: "Passive Aura",
      description: "Role ini memberi efek khusus saat ditugaskan ke quest.",
    };
  }

  useEffect(() => {
    setCooldownEndsAt(getStoredCooldownEnd(accountId));
  }, [accountId]);

  useEffect(() => {
    if (!isRoleCooldownActive) return undefined;

    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, [isRoleCooldownActive]);

  function toggleTheme() {
    onThemeChange?.(isLightMode ? "dark" : "light");
  }

  function handleTrackChange(event) {
    onMusicTrackChange?.(event.target.value);
  }

  function handleBackgroundChange(event) {
    const nextBackground = event.target.value;
    setSelectedBackgroundId(nextBackground);
    window.localStorage.setItem(DASHBOARD_BACKGROUND_KEY, nextBackground);
    document.body.dataset.dashboardBackground = nextBackground;
  }

  function handleRoleRequest(role) {
    if (role.id === currentRoleId || isRoleCooldownActive) return;
    setPendingRoleId(role.id);
  }

  async function confirmRoleChange() {
    if (!pendingRole) return;

    const nextCooldownEndsAt = Date.now() + ROLE_CHANGE_COOLDOWN_MS;
    window.localStorage.setItem(
      getRoleCooldownKey(accountId),
      String(nextCooldownEndsAt),
    );
    setCooldownEndsAt(nextCooldownEndsAt);
    setCurrentTime(Date.now());
    setPendingRoleId("");
    await onRoleChange?.(pendingRole.id);
  }

  return (
    <main className="settings-shell">
      <aside className="settings-sidebar" aria-label="Settings sidebar">
        <button className="settings-back-button" onClick={onBack} type="button">
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <section className="settings-profile-card">
          <div className="settings-avatar-box">
            <CharacterSprite roleId={currentRole.id} />
          </div>
          <div>
            <span>ACTIVE ROLE</span>
            <strong>{currentRole.name}</strong>
            <small>{currentRole.description}</small>
            <small className="settings-profile-skill">
              {getRoleSkillInfo(currentRole.id).label}: {getRoleSkillInfo(currentRole.id).description}
            </small>
          </div>
        </section>

        <nav className="settings-side-nav" aria-label="Settings sections">
          <a href="#appearance">
            <Palette size={17} />
            Appearance
          </a>
          <a href="#music">
            <Music size={17} />
            Music
          </a>
          <a href="#dashboard-background">
            <Image size={17} />
            Background
          </a>
          <a href="#character-profile">
            <Shield size={17} />
            Character Profile
          </a>
        </nav>

        <button className="settings-logout-button" onClick={onLogout} type="button">
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      <section className="settings-content">
        <div className="sync-section-title settings-title">
          <div>
            <h1>SYSTEM SETTINGS</h1>
            <span>Configure interface and active character role</span>
          </div>
        </div>

        <section className="settings-panel" id="appearance">
          <div className="settings-panel-heading">
            <div>
              <span>APPEARANCE</span>
              <h2>Theme Mode</h2>
            </div>
            {isLightMode ? <Sun size={22} /> : <Moon size={22} />}
          </div>

          <div className="settings-option-row">
            <div>
              <strong>{isLightMode ? "Light Mode" : "Dark Mode"}</strong>
              <small>Switch the dashboard theme without changing your quest data.</small>
            </div>
            <button
              className={`settings-toggle-button ${isLightMode ? "is-light" : ""}`}
              onClick={toggleTheme}
              type="button"
            >
              {isLightMode ? "Light" : "Dark"}
            </button>
          </div>
        </section>

        <section className="settings-panel" id="music">
          <div className="settings-panel-heading">
            <div>
              <span>AUDIO</span>
              <h2>Background Music</h2>
            </div>
            <Music size={22} />
          </div>

          <div className="settings-music-panel">
            <label className="settings-select-field">
              <span>Track</span>
              <select onChange={handleTrackChange} value={selectedTrackId}>
                <option value="off">Off</option>
                {musicTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="settings-music-controls">
              <div className="settings-music-actions">
                <button
                  className="settings-music-button settings-music-button--icon"
                  onClick={onMusicSpeakerToggle}
                  title={musicVolume === 0 ? "Unmute music" : "Mute music"}
                  type="button"
                >
                  {musicVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  <span>{musicVolume === 0 ? "Unmute" : "Sound"}</span>
                </button>
                <button
                  className="settings-music-button"
                  onClick={onMusicToggle}
                  type="button"
                >
                  {isMusicPlaying ? <Pause size={18} /> : <Play size={18} />}
                  {selectedTrack ? (isMusicPlaying ? "Pause" : "Play") : "Select"}
                </button>
                <button
                  className="settings-music-button"
                  onClick={() => onMusicSkip?.()}
                  type="button"
                >
                  <SkipForward size={18} />
                  Skip
                </button>
                <button
                  className={`settings-music-button ${
                    isShuffleEnabled ? "is-active" : ""
                  }`}
                  onClick={onMusicShuffleToggle}
                  type="button"
                >
                  <Shuffle size={18} />
                  {isShuffleEnabled ? "Shuffle On" : "Shuffle"}
                </button>
              </div>

              <label className="settings-volume-control">
                {musicVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                <input
                  max="100"
                  min="0"
                  onChange={(event) => onMusicVolumeChange?.(Number(event.target.value))}
                  type="range"
                  value={musicVolume}
                />
                <strong>{musicVolume}%</strong>
              </label>
            </div>
            {musicError && <p className="settings-music-error">{musicError}</p>}
          </div>
        </section>

        <section className="settings-panel" id="dashboard-background">
          <div className="settings-panel-heading">
            <div>
              <span>DISPLAY</span>
              <h2>Dashboard Background</h2>
            </div>
            <Image size={22} />
          </div>

          <div className="settings-background-panel">
            <label className="settings-select-field">
              <span>Background</span>
              <select onChange={handleBackgroundChange} value={selectedBackgroundId}>
                {dashboardBackgrounds.map((background) => (
                  <option key={background.id} value={background.id}>
                    {background.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="settings-background-preview-grid">
              {dashboardBackgrounds.map((background) => (
                <button
                  className={`settings-background-card ${
                    selectedBackgroundId === background.id ? "is-active" : ""
                  }`}
                  key={background.id}
                  onClick={() =>
                    handleBackgroundChange({ target: { value: background.id } })
                  }
                  type="button"
                >
                  <span
                    className="settings-background-preview"
                    style={
                      background.src
                        ? { "--settings-background-preview": `url("${background.src}")` }
                        : undefined
                    }
                  />
                  <strong>{background.title}</strong>
                  <small>{background.description}</small>
                </button>
              ))}
            </div>

            <p className="settings-background-note">
              Background animasi aktif di Dark Mode dan Light Mode dengan overlay
              berbeda agar panel tetap terbaca.
            </p>
          </div>
        </section>

        <section className="settings-panel" id="character-profile">
          <div className="settings-panel-heading">
            <div>
              <span>CHARACTER PROFILE</span>
              <h2>Active Role</h2>
            </div>
            <Shield size={22} />
          </div>

          <div className="settings-role-grid">
            {roles.map((role) => {
              const isActive = role.id === currentRoleId;
              const isDisabled = !isActive && isRoleCooldownActive;

              return (
                <button
                  className={`settings-role-card ${isActive ? "is-active" : ""} ${
                    isDisabled ? "is-disabled" : ""
                  }`}
                  disabled={isDisabled}
                  key={role.id}
                  onClick={() => handleRoleRequest(role)}
                  style={{ "--settings-role-accent": role.accent }}
                  type="button"
                >
                  <div className="settings-role-avatar">
                    <CharacterSprite roleId={role.id} />
                  </div>
                  <strong>{role.name}</strong>
                  <span>{role.description}</span>
                  <div className="settings-role-skill">
                    <small>PASSIVE SKILL</small>
                    <b>{getRoleSkillInfo(role.id).label}</b>
                    <p>{getRoleSkillInfo(role.id).description}</p>
                  </div>
                  {isActive && <em>ACTIVE CLASS</em>}
                  {isDisabled && (
                    <small className="settings-role-cooldown">
                      <Clock size={13} />
                      Cooldown {roleCooldownCopy}
                    </small>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </section>

      {pendingRole && (
        <div className="sync-modal-backdrop" role="presentation">
          <section
            aria-labelledby="settings-role-confirm-title"
            aria-modal="true"
            className="settings-role-confirm"
            role="dialog"
          >
            <header>
              <div>
                <span>ROLE CHANGE CONTRACT</span>
                <h2 id="settings-role-confirm-title">Setuju ganti role?</h2>
              </div>
              <button
                aria-label="Tutup konfirmasi ganti role"
                onClick={() => setPendingRoleId("")}
                type="button"
              >
                <X size={18} />
              </button>
            </header>
            <div className="settings-role-confirm__body">
              <div className="settings-role-confirm__avatar">
                <CharacterSprite roleId={pendingRole.id} />
              </div>
              <div>
                <strong>{currentRole.name} → {pendingRole.name}</strong>
                <p>
                  Setelah role diganti, kamu harus menunggu 7 jam sebelum bisa
                  mengganti role lagi.
                </p>
                <div className="settings-role-confirm__skill">
                  <span>Passive baru</span>
                  <strong>{getRoleSkillInfo(pendingRole.id).label}</strong>
                  <p>{getRoleSkillInfo(pendingRole.id).description}</p>
                </div>
              </div>
            </div>
            <footer>
              <button onClick={() => setPendingRoleId("")} type="button">
                Batal
              </button>
              <button className="is-primary" onClick={confirmRoleChange} type="button">
                Setuju Ganti Role
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
