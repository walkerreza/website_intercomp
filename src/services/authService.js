import {
  isSupabaseConfigured,
  scrubAuthTokensFromUrl,
  supabase,
} from "../lib/supabase.js";

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
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) throw error;
}

export async function getCurrentAccount() {
  if (!isSupabaseConfigured) return "";

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return getAccountId(data.session?.user);
  } finally {
    scrubAuthTokensFromUrl();
  }

}

export async function updateCurrentUserRole(roleId) {
  if (!isSupabaseConfigured) return;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  const user = sessionData.session?.user;

  if (!user) return;

  const username =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "questify";

  const { data: existingProfile, error: selectError } = await supabase
    .from("users")
    .select("id,username")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  const request = existingProfile
    ? supabase
        .from("users")
        .update({
          username: existingProfile.username || username,
          character_id: roleId,
        })
        .eq("id", user.id)
    : supabase.from("users").insert({
        id: user.id,
        email: user.email,
        username,
        character_id: roleId,
      });

  const { error } = await request;

  if (error) throw error;
}

export async function signOut() {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}
