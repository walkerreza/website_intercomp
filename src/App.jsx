import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DASHBOARD_BACKGROUND_KEY } from "./data/dashboardBackgrounds.js";
import { MUSIC_TRACK_KEY, MUSIC_VOLUME_KEY, musicTracks } from "./data/musicTracks.js";
import { LandingPage } from "./pages/LandingPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RoleSetupPage } from "./pages/RoleSetupPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { getCurrentAccount, signOut, updateCurrentUserRole } from "./services/authService.js";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage.jsx").then((module) => ({
    default: module.DashboardPage,
  })),
);

const ROLE_STORAGE_KEY = "questify:selected-role";
const USERS_STORAGE_KEY = "questify:users";
const THEME_STORAGE_KEY = "questify:theme";
const PUBLIC_ROUTES = new Set(["/", "/login"]);
const DASHBOARD_VIEW_BY_PATH = {
  "/dashboard": "command",
  "/dashboard/workspace": "workspace",
  "/dashboard/clan": "clan",
  "/dashboard/archive": "archive",
  "/dashboard/inventory": "inventory",
  "/dashboard/shop": "shop",
  "/dashboard/quests": "quests",
};
const DASHBOARD_PATH_BY_VIEW = Object.fromEntries(
  Object.entries(DASHBOARD_VIEW_BY_PATH).map(([path, view]) => [view, path]),
);

function normalizePath(pathname) {
  const pathnameOnly = pathname || "/";
  if (pathnameOnly.length > 1 && pathnameOnly.endsWith("/")) {
    return pathnameOnly.slice(0, -1);
  }
  return pathnameOnly;
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

function isDashboardPath(pathname) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isKnownRoute(pathname) {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    pathname === "/settings" ||
    pathname === "/role-setup" ||
    Boolean(DASHBOARD_VIEW_BY_PATH[pathname])
  );
}

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
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
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
  const [shouldAutoStartMusic, setShouldAutoStartMusic] = useState(false);
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
  const normalizedPath = isKnownRoute(currentPath) ? currentPath : "/";
  const isSettingsOpen = normalizedPath === "/settings";
  const dashboardView = DASHBOARD_VIEW_BY_PATH[normalizedPath] ?? "command";

  function navigateTo(pathname, { replace = false } = {}) {
    const nextPath = normalizePath(pathname);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentUrl !== nextPath) {
      const method = replace ? "replaceState" : "pushState";
      window.history[method](window.history.state, "", nextPath);
    }

    setCurrentPath(nextPath);
  }

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const accountId = await getCurrentAccount();

        if (isMounted && accountId) {
          handleAuthenticated(accountId, { redirect: false });
        }
      } catch {
        // The login form will show configuration/auth errors when the user acts.
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(getCurrentPath());
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (isRestoringSession) return;

    if (!isKnownRoute(currentPath)) {
      navigateTo(isDashboardPath(currentPath) ? "/dashboard" : "/", { replace: true });
      return;
    }

    if (!isAuthenticated && (isDashboardPath(currentPath) || currentPath === "/settings" || currentPath === "/role-setup")) {
      navigateTo("/login", { replace: true });
      return;
    }

    if (isAuthenticated && currentPath === "/login") {
      navigateTo(savedRole ? "/dashboard" : "/role-setup", { replace: true });
      return;
    }

    if (isAuthenticated && !savedRole && currentPath !== "/role-setup") {
      navigateTo("/role-setup", { replace: true });
      return;
    }

    if (isAuthenticated && savedRole && currentPath === "/role-setup") {
      navigateTo("/dashboard", { replace: true });
      return;
    }

    if (isAuthenticated && savedRole && currentPath === "/") {
      navigateTo("/dashboard", { replace: true });
    }
  }, [currentPath, isAuthenticated, isRestoringSession, savedRole]);

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

  useEffect(() => {
    if (!isAuthenticated || !shouldAutoStartMusic) return;

    if (!selectedTrack && musicTracks[0]) {
      setSelectedTrackId(musicTracks[0].id);
      return;
    }

    if (!audioRef.current || !selectedTrack) return;

    let isCancelled = false;

    async function playLoginMusic() {
      try {
        setMusicError("");
        await audioRef.current.play();

        if (!isCancelled) {
          setIsMusicPlaying(true);
          setShouldAutoStartMusic(false);
        }
      } catch (error) {
        if (!isCancelled) {
          setIsMusicPlaying(false);
          setShouldAutoStartMusic(false);
          setMusicError(
            error.message ||
              "Browser menolak autoplay. Tekan Play di Settings untuk memulai musik.",
          );
        }
      }
    }

    playLoginMusic();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, selectedTrack, shouldAutoStartMusic]);

  function handleAuthenticated(accountId, { redirect = true } = {}) {
    const normalizedAccount = accountId.toLowerCase();
    saveStoredUser(normalizedAccount, roleByAccount[normalizedAccount]);
    setCurrentAccount(normalizedAccount);
    setShouldAutoStartMusic(true);
    setIsAuthenticated(true);

    if (redirect) {
      navigateTo(roleByAccount[normalizedAccount] ? "/dashboard" : "/role-setup", { replace: true });
    }
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

    navigateTo("/dashboard", { replace: true });
  }

  async function handleLogout() {
    audioRef.current?.pause();
    setIsMusicPlaying(false);
    await signOut();
    setIsAuthenticated(false);
    setCurrentAccount("");
    navigateTo("/", { replace: true });
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

  if (isRestoringSession) {
    return <main aria-busy="true" />;
  }

  if (!isAuthenticated) {
    if (normalizedPath === "/login") {
      return <LoginPage onAuthenticated={handleAuthenticated} />;
    }

    return <LandingPage onStart={() => navigateTo("/login")} />;
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
          onBack={() => navigateTo("/dashboard")}
          onLogout={handleLogout}
          selectedTrackId={selectedTrackId}
        />
      </>
    );
  }

  return (
    <>
      {musicPlayer}
      <Suspense fallback={<main className="sync-dashboard" aria-busy="true" />}>
        <DashboardPage
          accountId={currentAccount}
          initialView={dashboardView}
          roleId={savedRole}
          onLogout={handleLogout}
          onNavigateView={(viewId) => navigateTo(DASHBOARD_PATH_BY_VIEW[viewId] ?? "/dashboard")}
          onOpenSettings={() => navigateTo("/settings")}
        />
      </Suspense>
    </>
  );
}
