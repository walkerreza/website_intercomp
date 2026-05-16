import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
}

export async function loadProfileSummary() {
  assertSupabaseConfigured();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!userData.user) throw new Error("Session Supabase tidak ditemukan.");

  const userId = userData.user.id;

  const [{ data: profile, error: profileError }, { data: friends, error: friendsError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id,email,username,character_id")
        .eq("id", userId)
        .single(),
      supabase
        .from("user_friends")
        .select("id,requester_id,addressee_id,status")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq("status", "accepted"),
    ]);

  if (profileError) throw profileError;
  if (friendsError) throw friendsError;

  return {
    canChangePassword: Boolean(
      userData.user.app_metadata?.providers?.includes("email") ||
        userData.user.identities?.some((identity) => identity.provider === "email"),
    ),
    email: profile.email ?? userData.user.email ?? "",
    friendCount: friends?.length ?? 0,
    id: userId,
    username: profile.username ?? userData.user.email?.split("@")[0] ?? "Player",
  };
}

export async function updateProfileName(username) {
  assertSupabaseConfigured();

  const cleanedUsername = username.trim();
  if (!cleanedUsername) throw new Error("Nama tidak boleh kosong.");

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!userData.user) throw new Error("Session Supabase tidak ditemukan.");

  const { error } = await supabase
    .from("users")
    .update({ username: cleanedUsername })
    .eq("id", userData.user.id);

  if (error) throw error;

  return cleanedUsername;
}

export async function updateAccountPassword(password) {
  assertSupabaseConfigured();

  if (!password || password.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) throw error;
}

export async function addFriendByUserId(identifier) {
  assertSupabaseConfigured();

  const cleanedIdentifier = identifier.trim();
  if (!cleanedIdentifier) throw new Error("User ID atau username teman tidak boleh kosong.");

  const { error } = await supabase.rpc("add_friend_by_identifier", {
    friend_identifier: cleanedIdentifier,
  });

  if (error) throw error;
}

export async function searchFriendProfiles(query) {
  assertSupabaseConfigured();

  const cleanedQuery = query.trim();
  if (!cleanedQuery) return [];

  const { data, error } = await supabase.rpc("search_friend_profiles_v2", {
    query_text: cleanedQuery,
  });

  if (error) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        cleanedQuery,
      );
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;
    const userQuery = supabase
      .from("users")
      .select("id,email,username")
      .neq("id", currentUserId)
      .limit(8);
    const { data: users, error: usersError } = isUuid
      ? await userQuery.eq("id", cleanedQuery)
      : await userQuery.ilike("username", `${cleanedQuery}%`);

    if (usersError) throw error;

    return (users ?? []).map((user) => ({
      email: user.email,
      is_friend: false,
      user_id: user.id,
      username: user.username,
    }));
  }

  return data ?? [];
}

export async function deleteCurrentUserAccount() {
  assertSupabaseConfigured();

  const { error } = await supabase.rpc("delete_current_user_account");

  if (error) throw error;

  await supabase.auth.signOut();
}
