import { useEffect, useRef, useState } from "react";
import { DASHBOARD_BACKGROUND_KEY } from "./data/dashboardBackgrounds.js";
import { MUSIC_TRACK_KEY, MUSIC_VOLUME_KEY, musicTracks } from "./data/musicTracks.js";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RoleSetupPage } from "./pages/RoleSetupPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { getCurrentAccount, signOut, updateCurrentUserRole } from "./services/authService.js";

const ROLE_STORAGE_KEY = "questify:selected-role";
const USERS_STORAGE_KEY = "questify:users";
const THEME_STORAGE_KEY = "questify:theme";

function getStoredUsers() {
  try {
    const savedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch {
    return [];
  }
}

function saveStoredUser(accountId, roleId = "") {
  const normalizedAccount = accountId.toLowerCase();
  const users = getStoredUsers();
  const existingUser = users.find((user) => user.id === normalizedAccount);
  const nextUser = {
    id: normalizedAccount,
    username: normalizedAccount.includes("@")
      ? normalizedAccount.split("@")[0]
      : normalizedAccount,
    accountId: normalizedAccount,
    roleId: roleId || existingUser?.roleId || "",
  };
  const nextUsers = existingUser
    ? users.map((user) => (user.id === normalizedAccount ? nextUser : user))
    : [...users, nextUser];

  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [currentAccount, setCurrentAccount] = useState("");
  const [themeMode, setThemeMode] = useState(() => {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  });
  const audioRef = useRef(null);
  const [selectedTrackId, setSelectedTrackId] = useState(() => {
    return window.localStorage.getItem(MUSIC_TRACK_KEY) || musicTracks[0]?.id || "off";
  });
  const [musicVolume, setMusicVolume] = useState(() => {
    const savedVolume = Number(window.localStorage.getItem(MUSIC_VOLUME_KEY));
    return Number.isFinite(savedVolume) ? savedVolume : 60;
  });
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [roleByAccount, setRoleByAccount] = useState(() => {
    const savedRoles = window.localStorage.getItem(ROLE_STORAGE_KEY);

    if (!savedRoles) {
      return {};
    }

    try {
      const parsedRoles = JSON.parse(savedRoles);
      return typeof parsedRoles === "object" && !Array.isArray(parsedRoles)
        ? parsedRoles
        : {};
    } catch {
      return {};
    }
  });

  const savedRole = currentAccount ? roleByAccount[currentAccount] : "";
  const selectedTrack = musicTracks.find((track) => track.id === selectedTrackId);
  const isLightMode = themeMode === "light";

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const accountId = await getCurrentAccount();

        if (isMounted && accountId) {
          handleAuthenticated(accountId);
        }
      } catch {
        // The login form will show configuration/auth errors when the user acts.
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light-theme", isLightMode);
    document.body.dataset.theme = themeMode;
    document.body.dataset.dashboardBackground =
      window.localStorage.getItem(DASHBOARD_BACKGROUND_KEY) || "base";
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [isLightMode, themeMode]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = musicVolume / 100;
    window.localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
  }, [musicVolume]);

  useEffect(() => {
    window.localStorage.setItem(MUSIC_TRACK_KEY, selectedTrackId);

    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.load();
    setIsMusicPlaying(false);
    setMusicError("");
  }, [selectedTrackId]);

  function handleAuthenticated(accountId) {
    const normalizedAccount = accountId.toLowerCase();
    saveStoredUser(normalizedAccount, roleByAccount[normalizedAccount]);
    setCurrentAccount(normalizedAccount);
    setShowLanding(false);
    setIsAuthenticated(true);
  }

  async function handleRoleComplete(roleId) {
    const nextRoleByAccount = {
      ...roleByAccount,
      [currentAccount]: roleId,
    };

    window.localStorage.setItem(
      ROLE_STORAGE_KEY,
      JSON.stringify(nextRoleByAccount),
    );
    saveStoredUser(currentAccount, roleId);
    setRoleByAccount(nextRoleByAccount);

    try {
      await updateCurrentUserRole(roleId);
    } catch {
      // Dashboard still works with local role fallback when Supabase profile update fails.
    }
  }

  async function handleLogout() {
    audioRef.current?.pause();
    setIsMusicPlaying(false);
    await signOut();
    setIsAuthenticated(false);
    setCurrentAccount("");
    setShowLanding(true);
  }

  async function handleMusicToggle() {
    if (!selectedTrack && musicTracks[0]) {
      setSelectedTrackId(musicTracks[0].id);
      return;
    }

    if (!audioRef.current || !selectedTrack) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
      return;
    }

    try {
      setMusicError("");
      await audioRef.current.play();
      setIsMusicPlaying(true);
    } catch (error) {
      setIsMusicPlaying(false);
      setMusicError(error.message || "Browser menolak memutar audio.");
    }
  }

  function handleThemeChange(nextThemeMode) {
    setThemeMode(nextThemeMode === "light" ? "light" : "dark");
  }

  const musicPlayer = selectedTrack ? (
    <audio
      loop
      onEnded={() => setIsMusicPlaying(false)}
      onError={() => setMusicError("File musik gagal dimuat. Cek nama file di public/assets/music.")}
      onPause={() => setIsMusicPlaying(false)}
      onPlay={() => setIsMusicPlaying(true)}
      preload="auto"
      ref={audioRef}
      src={selectedTrack.src}
    />
  ) : null;

  if (!isAuthenticated) {
    if (showLanding) {
      return <LandingPage onStart={() => setShowLanding(false)} />;
    }

    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  if (!savedRole) {
    return (
      <>
        {musicPlayer}
        <RoleSetupPage onComplete={handleRoleComplete} />
      </>
    );
  }

  if (isSettingsOpen) {
    return (
      <>
        {musicPlayer}
        <SettingsPage
          currentRoleId={savedRole}
          isLightMode={isLightMode}
          isMusicPlaying={isMusicPlaying}
          musicError={musicError}
          musicVolume={musicVolume}
          onMusicTrackChange={setSelectedTrackId}
          onMusicToggle={handleMusicToggle}
          onMusicVolumeChange={setMusicVolume}
          onRoleChange={handleRoleComplete}
          onThemeChange={handleThemeChange}
          onBack={() => setIsSettingsOpen(false)}
          onLogout={handleLogout}
          selectedTrackId={selectedTrackId}
        />
      </>
    );
  }

  return (
    <>
      {musicPlayer}
      <DashboardPage
        accountId={currentAccount}
        roleId={savedRole}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </>
  );
}
