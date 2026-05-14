import { useState } from "react";
import { Lock, Mail, UserRound } from "lucide-react";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "../services/authService.js";

const authCopy = {
  login: {
    title: "Masuk ke guild",
    subtitle: "Lanjutkan quest produktivitasmu hari ini.",
    button: "Masuk",
    switchText: "Belum punya akun?",
    switchButton: "Daftar",
  },
  register: {
    title: "Buat karakter baru",
    subtitle: "Siapkan akun dan class pertamamu.",
    button: "Register",
    switchText: "Sudah punya akun?",
    switchButton: "Masuk",
  },
};

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

function saveStoredUser(accountId) {
  const normalizedAccount = accountId.toLowerCase();
  const users = getStoredUsers();
  const existingUser = users.find((user) => user.id === normalizedAccount);

  if (existingUser) return;

  window.localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify([
      ...users,
      {
        id: normalizedAccount,
        username: normalizedAccount.includes("@")
          ? normalizedAccount.split("@")[0]
          : normalizedAccount,
        accountId: normalizedAccount,
        roleId: "",
      },
    ]),
  );
}

export function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = authCopy[mode];

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmittedMessage("");

    const formData = new FormData(event.currentTarget);
    const googleAccount = formData.get("googleAccount")?.trim();
    const username = formData.get("username")?.trim();
    const password = formData.get("password");
    const accountId = googleAccount || username;

    if (!accountId?.includes("@")) {
      setSubmittedMessage("Supabase Auth membutuhkan email. Gunakan email pada kolom username atau Akun Google.");
      setIsSubmitting(false);
      return;
    }

    try {
      const authenticatedAccount =
        mode === "login"
          ? await signInWithPassword(accountId, password)
          : await signUpWithPassword(accountId, password);

      saveStoredUser(authenticatedAccount || accountId);
      setSubmittedMessage(
        mode === "login"
          ? "Login berhasil."
          : "Register berhasil. Jika email confirmation aktif, cek inbox sebelum login.",
      );
      onAuthenticated(authenticatedAccount || accountId);
    } catch (error) {
      setSubmittedMessage(error.message || "Autentikasi gagal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    try {
      setSubmittedMessage("");
      await signInWithGoogle();
    } catch (error) {
      setSubmittedMessage(error.message || "Login Google gagal.");
    }
  }

  return (
    <section className="auth-shell" aria-label="Form autentikasi">
      <div className="auth-card">
        <div className="auth-card__header">
          <div>
            <p className="eyebrow">Student RPG Productivity</p>
            <h2>{copy.title}</h2>
            <p>{copy.subtitle}</p>
          </div>
        </div>

        <div className="mode-tabs" role="tablist" aria-label="Mode autentikasi">
          <button
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "is-active" : ""}
            onClick={() => setMode("register")}
            type="button"
            role="tab"
            aria-selected={mode === "register"}
          >
            Register
          </button>
        </div>

        <button className="google-button" onClick={handleGoogleAuth} type="button">
          <span aria-hidden="true">G</span>
          {mode === "login" ? "Masuk dengan Google" : "Daftar dengan Google"}
        </button>

        <div className="divider">
          <span>atau</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="input-group">
              <span>Akun Google</span>
              <div>
                <Mail size={18} />
                <input
                  type="email"
                  name="googleAccount"
                  placeholder="nama@student.ac.id"
                  autoComplete="email"
                />
              </div>
            </label>
          )}

          <label className="input-group">
            <span>Email</span>
            <div>
              <UserRound size={18} />
              <input
                type="text"
                name="username"
                placeholder="nama@student.ac.id"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="input-group">
            <span>Password</span>
            <div>
              <Lock size={18} />
              <input
                type="password"
                name="password"
                placeholder="Minimal 8 karakter"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            </div>
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Memproses..." : copy.button}
          </button>
        </form>

        {submittedMessage && (
          <p className="auth-feedback" role="status">
            {submittedMessage}
          </p>
        )}

        <p className="auth-switch">
          {copy.switchText}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {copy.switchButton}
          </button>
        </p>
      </div>
    </section>
  );
}
