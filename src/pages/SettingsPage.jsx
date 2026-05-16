import { useState } from "react";
import {
  ArrowLeft,
  Image,
  LogOut,
  Moon,
  Music,
  Palette,
  Pause,
  Play,
  Shield,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CharacterSprite } from "../components/CharacterSprite.jsx";
import {
  DASHBOARD_BACKGROUND_KEY,
  dashboardBackgrounds,
} from "../data/dashboardBackgrounds.js";
import { musicTracks } from "../data/musicTracks.js";
import { roles } from "../data/roles.js";

export function SettingsPage({
  currentRoleId,
  isLightMode,
  isMusicPlaying,
  musicError,
  musicVolume,
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
  const currentRole = roles.find((role) => role.id === currentRoleId) ?? roles[0];
  const selectedTrack = musicTracks.find((track) => track.id === selectedTrackId);

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
              <button
                className="settings-music-button"
                onClick={onMusicToggle}
                type="button"
              >
                {isMusicPlaying ? <Pause size={18} /> : <Play size={18} />}
                {selectedTrack ? (isMusicPlaying ? "Pause" : "Play") : "Select"}
              </button>

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

              return (
                <button
                  className={`settings-role-card ${isActive ? "is-active" : ""}`}
                  key={role.id}
                  onClick={() => onRoleChange?.(role.id)}
                  type="button"
                >
                  <div className="settings-role-avatar">
                    <CharacterSprite roleId={role.id} />
                  </div>
                  <strong>{role.name}</strong>
                  <span>{role.description}</span>
                  {isActive && <em>ACTIVE</em>}
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
