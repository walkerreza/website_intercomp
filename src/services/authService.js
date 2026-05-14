import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.",
    );
  }
}

function getAccountId(user) {
  return user?.email || user?.user_metadata?.email || user?.id || "";
}

export async function signInWithPassword(email, password) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return getAccountId(data.user);
}

export async function signUpWithPassword(email, password) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  return getAccountId(data.user) || email;
}

export async function signInWithGoogle() {
  assertSupabaseConfigured();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) throw error;
}

export async function getCurrentAccount() {
  if (!isSupabaseConfigured) return "";

  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  return getAccountId(data.session?.user);
}

export async function signOut() {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}
