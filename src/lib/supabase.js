import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const AUTH_TOKEN_HASH_KEYS = [
  "access_token",
  "refresh_token",
  "provider_token",
  "expires_at",
  "expires_in",
  "token_type",
];

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
    })
  : null;

export function scrubAuthTokensFromUrl() {
  if (typeof window === "undefined") return;

  const hash = window.location.hash || "";
  const hashWithoutPrefix = hash.startsWith("#") ? hash.slice(1) : hash;
  const hashParams = new URLSearchParams(hashWithoutPrefix);
  const hasAuthToken = AUTH_TOKEN_HASH_KEYS.some((key) => hashParams.has(key));

  if (!hasAuthToken) return;

  for (const key of AUTH_TOKEN_HASH_KEYS) {
    hashParams.delete(key);
  }

  const nextHash = hashParams.toString();
  const nextUrl = `${window.location.pathname}${window.location.search}${
    nextHash ? `#${nextHash}` : ""
  }`;

  window.history.replaceState(window.history.state, document.title, nextUrl);
}
