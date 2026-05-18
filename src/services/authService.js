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

async function getCurrentProfileRole(userId) {
  if (!userId) return "";

  const { data, error } = await supabase
    .from("users")
    .select("character_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.character_id || "";
}

function mapAuthAccount(user, roleId = "") {
  return {
    accountId: getAccountId(user),
    roleId,
  };
}

export async function signInWithPassword(email, password) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return mapAuthAccount(data.user, await getCurrentProfileRole(data.user?.id));
}

export async function signUpWithPassword(email, password) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  return {
    accountId: getAccountId(data.user) || email,
    hasSession: Boolean(data.session),
  };
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
  if (!isSupabaseConfigured) return { accountId: "", roleId: "" };

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    const user = data.session?.user;
    if (!user) return { accountId: "", roleId: "" };

    return mapAuthAccount(user, await getCurrentProfileRole(user.id));
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
