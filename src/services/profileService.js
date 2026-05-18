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

  const [{ data: profile, error: profileError }, { data: friendships, error: friendsError }] =
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

  const friendIds = (friendships ?? []).map((friendship) =>
    friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id,
  );
  let friends = [];

  if (friendIds.length) {
    const { data: friendProfiles, error: friendProfilesError } = await supabase
      .from("users")
      .select("id,email,username")
      .in("id", friendIds);

    if (friendProfilesError) throw friendProfilesError;

    const profileMap = new Map((friendProfiles ?? []).map((friend) => [friend.id, friend]));
    friends = (friendships ?? []).map((friendship) => {
      const friendId =
        friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id;
      const friendProfile = profileMap.get(friendId) ?? {};

      return {
        email: friendProfile.email ?? "",
        friendshipId: friendship.id,
        status: friendship.status,
        userId: friendId,
        username: friendProfile.username ?? "Unknown Player",
      };
    });
  }

  return {
    canChangePassword: Boolean(
      userData.user.app_metadata?.providers?.includes("email") ||
        userData.user.identities?.some((identity) => identity.provider === "email"),
    ),
    email: profile.email ?? userData.user.email ?? "",
    friendCount: friendships?.length ?? 0,
    friends,
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

export async function deleteFriendByUserId(friendUserId) {
  assertSupabaseConfigured();

  const cleanedFriendUserId = friendUserId.trim();
  if (!cleanedFriendUserId) throw new Error("User ID teman tidak boleh kosong.");

  const { error } = await supabase.rpc("remove_friend_by_user_id", {
    target_user_id: cleanedFriendUserId,
  });

  if (error) throw error;
}

function normalizeDirectMessage(message = {}) {
  return {
    content: message.content ?? "",
    createdAt: message.created_at ?? message.createdAt ?? new Date().toISOString(),
    id: message.id,
    receiverId: message.receiver_id ?? message.receiverId ?? "",
    senderId: message.sender_id ?? message.senderId ?? "",
    senderName: message.sender_name ?? message.senderName ?? "Player",
  };
}

export async function loadFriendMessages(friendUserId) {
  assertSupabaseConfigured();

  const cleanedFriendUserId = friendUserId.trim();
  if (!cleanedFriendUserId) return [];

  const { data, error } = await supabase.rpc("get_friend_messages", {
    target_user_id: cleanedFriendUserId,
  });

  if (error) throw error;

  return (data ?? []).map((message) => normalizeDirectMessage(message));
}

export async function sendFriendMessage(friendUserId, content) {
  assertSupabaseConfigured();

  const cleanedFriendUserId = friendUserId.trim();
  const cleanedContent = content.trim();

  if (!cleanedFriendUserId) throw new Error("User ID teman tidak boleh kosong.");
  if (!cleanedContent) throw new Error("Pesan tidak boleh kosong.");

  const { data, error } = await supabase.rpc("send_friend_message", {
    message_content: cleanedContent,
    target_user_id: cleanedFriendUserId,
  });

  if (error) throw error;

  const message = Array.isArray(data) ? data[0] : data;
  if (!message) throw new Error("Pesan gagal dikirim.");

  return normalizeDirectMessage(message);
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
