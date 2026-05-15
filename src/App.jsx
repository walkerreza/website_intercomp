import { useEffect, useState } from "react";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RoleSetupPage } from "./pages/RoleSetupPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { getCurrentAccount, signOut } from "./services/authService.js";

const ROLE_STORAGE_KEY = "questify:selected-role";
const USERS_STORAGE_KEY = "questify:users";

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
  const [currentAccount, setCurrentAccount] = useState("");
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

  function handleAuthenticated(accountId) {
    const normalizedAccount = accountId.toLowerCase();
    saveStoredUser(normalizedAccount, roleByAccount[normalizedAccount]);
    setCurrentAccount(normalizedAccount);
    setIsAuthenticated(true);
  }

  function handleRoleComplete(roleId) {
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
  }

  async function handleLogout() {
    await signOut();
    setIsAuthenticated(false);
    setCurrentAccount("");
  }

  if (!isAuthenticated) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  if (!savedRole) {
    return <RoleSetupPage onComplete={handleRoleComplete} />;
  }

  if (isSettingsOpen) {
    return (
      <SettingsPage
        currentRoleId={savedRole}
        onRoleChange={handleRoleComplete}
        onBack={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <DashboardPage
      accountId={currentAccount}
      roleId={savedRole}
      onLogout={handleLogout}
      onOpenSettings={() => setIsSettingsOpen(true)}
    />
  );
}
