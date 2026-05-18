import { isSupabaseConfigured, supabase } from "../lib/supabase.js";
import { roles } from "../data/roles.js";
import { starterEquipment } from "../data/cosmetics.js";
import { resolveWorkspaceCoverKey } from "../data/workspaceCovers.js";
import { getTargetColumnId } from "../features/dashboard/utils/dashboardUtils.js";
import { difficultyWeight, questLabelOptions } from "../features/dashboard/config/dashboardConfig.js";

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
}

let workspaceRealtimeChannel = null;

function teardownWorkspaceRealtimeChannel() {
  if (!workspaceRealtimeChannel) return;
  supabase.removeChannel(workspaceRealtimeChannel);
  workspaceRealtimeChannel = null;
}

function normalizeColumnKey(column) {
  const name = column.name?.toLowerCase();
  if (column.type === "done" || name === "completed" || name === "done") return "done";
  if (name === "hard") return "hard";
  if (name === "easy") return "easy";
  return "medium";
}

function roleName(roleId) {
  return roles.find((role) => role.id === roleId)?.name ?? "Adventurer";
}

function userDisplayName(user) {
  return user?.username || user?.email?.split("@")[0] || "Adventurer";
}

function labelForQuest(label) {
  return questLabelOptions.find((option) => option.value === label) ?? questLabelOptions[1];
}

function parseLocalDateTime(dateValue) {
  if (!dateValue) return null;

  if (dateValue.length <= 10) {
    return new Date(`${dateValue}T23:59`).toISOString();
  }

  return new Date(dateValue).toISOString();
}

function formatDateTimeInput(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getNotificationType(dueAt) {
  if (!dueAt) return "";

  const dueTime = new Date(dueAt).getTime();
  if (Number.isNaN(dueTime)) return "";

  const now = Date.now();
  const hoursUntilDue = (dueTime - now) / 36e5;
  const today = new Date();
  const dueDate = new Date(dueAt);
  const isToday =
    today.getFullYear() === dueDate.getFullYear() &&
    today.getMonth() === dueDate.getMonth() &&
    today.getDate() === dueDate.getDate();

  if (hoursUntilDue < 0) return "overdue";
  if (hoursUntilDue <= 2) return "due_soon";
  if (isToday) return "due_today";
  return "";
}

function isMissingQuestActivitiesError(error) {
  const message = error?.message ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("quest_activities") ||
    message.includes("schema cache")
  );
}

function isMissingQuestNotificationsError(error) {
  const message = error?.message ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("quest_notifications") ||
    message.includes("schema cache")
  );
}

function isMissingDismissedAtError(error) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""} ${error?.details ?? ""}`;
  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    message.includes("dismissed_at")
  );
}

function isMissingFocusSessionRpcError(error) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""} ${error?.details ?? ""}`;
  return (
    error?.code === "PGRST202" ||
    message.includes("schema cache") ||
    message.includes("Could not find the function") ||
    message.includes("record_quest_focus_session")
  );
}

function mapMember(member) {
  const profile = member.users ?? member.profile ?? {};
  const characterId = profile.character_id || "healer";

  return {
    id: member.user_id,
    name: userDisplayName(profile),
    accountId: profile.email ?? "",
    roleId: characterId,
    role: roleName(characterId),
    workspaceRole: member.role === "owner" ? "Owner" : "Member",
    status: member.status === "active" ? "Active" : "Menunggu persetujuan",
    hp: `${profile.hp ?? 100}/100`,
  };
}

function mapRegisteredUser(user) {
  return {
    id: user.id,
    username: userDisplayName(user),
    accountId: user.email ?? "",
    roleId: user.character_id ?? "",
  };
}

function mapWorkspaceOption(workspace) {
  const workspaceType = workspace.type ?? (workspace.clan_id ? "clan" : "solo");

  return {
    id: workspace.id,
    name: workspace.name,
    type: workspaceType,
    ownerId: workspace.owner_id,
    clanId: workspace.clan_id ?? null,
    coverKey: resolveWorkspaceCoverKey(workspaceType, workspace.cover_key),
    coverType: workspace.cover_type ?? "preset",
    coverUrl: workspace.cover_url ?? "",
    role: workspace.role === "owner" ? "Owner" : "Member",
    status: workspace.status === "active" ? "Active" : "Menunggu persetujuan",
    joinCode: workspace.join_code ?? "",
    joinCodeEnabled: Boolean(workspace.join_code_enabled),
    memberCount: Number(workspace.member_count ?? 0),
    pendingCount: Number(workspace.pending_count ?? 0),
  };
}

function mapBoardDirectory(data) {
  return {
    boards: (data?.boards ?? []).map((board) => ({
      coverKey: resolveWorkspaceCoverKey(board.type === "clan" ? "clan" : "solo", board.coverKey),
      coverType: board.coverType ?? "preset",
      coverUrl: board.coverUrl ?? "",
      id: board.id,
      name: board.name,
      ownerId: board.ownerId,
      clanId: board.clanId,
      clanName: board.clanName,
      type: board.type ?? "personal",
      role: board.role === "owner" ? "Owner" : "Member",
      status: board.status === "active" ? "Active" : "Menunggu persetujuan",
      memberCount: Number(board.memberCount ?? 0),
      questCount: Number(board.questCount ?? 0),
    })),
    clans: (data?.clans ?? []).map((clan) => ({
      id: clan.id,
      name: clan.name,
      ownerId: clan.ownerId,
      role: clan.role === "owner" ? "Owner" : "Member",
      status: clan.status === "active" ? "Active" : "Menunggu persetujuan",
      joinCode: clan.joinCode ?? "",
      joinCodeEnabled: Boolean(clan.joinCodeEnabled),
      memberCount: Number(clan.memberCount ?? 0),
      pendingCount: Number(clan.pendingCount ?? 0),
      boardCount: Number(clan.boardCount ?? 0),
    })),
  };
}

function mapCommandCenterSummary(data) {
  return {
    profile: {
      gold: Number(data?.profile?.gold ?? 0),
      xp: Number(data?.profile?.xp ?? 0),
    },
    questStats: {
      active: Number(data?.questStats?.active ?? 0),
      completed: Number(data?.questStats?.completed ?? 0),
      overdue: Number(data?.questStats?.overdue ?? 0),
      dueSoon: Number(data?.questStats?.dueSoon ?? 0),
    },
    workspaces: (data?.workspaces ?? []).map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      type: workspace.type ?? "solo",
      clanId: workspace.clanId ?? null,
      clanName: workspace.clanName ?? "",
      activeQuestCount: Number(workspace.activeQuestCount ?? 0),
      completedQuestCount: Number(workspace.completedQuestCount ?? 0),
      memberCount: Number(workspace.memberCount ?? 0),
    })),
    clans: (data?.clans ?? []).map((clan) => ({
      id: clan.id,
      name: clan.name,
      role: clan.role === "owner" ? "Owner" : "Member",
      memberCount: Number(clan.memberCount ?? 0),
      boardCount: Number(clan.boardCount ?? 0),
    })),
    priorityQuests: (data?.priorityQuests ?? []).map((quest) => ({
      id: quest.id,
      title: quest.title,
      difficulty: quest.difficulty ?? "medium",
      dueAt: quest.dueAt ?? "",
      workspaceId: quest.workspaceId,
      workspaceName: quest.workspaceName,
      workspaceType: quest.workspaceType ?? "solo",
    })),
  };
}

function mapActivity(activity, memberById) {
  return {
    id: activity.id,
    action: activity.action,
    actorName: memberById.get(activity.actor_id)?.name ?? "System",
    createdAt: activity.created_at,
    message: activity.message,
  };
}

function mapQuest(quest, memberById, checklistByQuest, commentsByQuest, rewardsByQuest, activitiesByQuest) {
  const labelOption = labelForQuest(quest.label);
  const assigneeIds = quest.quest_assignees?.map((assignee) => assignee.user_id) ?? [];
  const assignees = assigneeIds
    .map((id) => memberById.get(id))
    .filter(Boolean)
    .map((member) => ({
      id: member.id,
      name: member.name,
      roleId: member.roleId,
      role: member.role,
    }));
  const creator = memberById.get(quest.creator_id);
  const rewardRows = rewardsByQuest.get(quest.id) ?? [];
  const activityRows = activitiesByQuest.get(quest.id) ?? [];

  return {
    id: quest.id,
    title: quest.title,
    description: quest.description ?? "",
    reward: `+${quest.reward_xp ?? labelOption.reward?.replace(/\D/g, "") ?? 50} XP`,
    penalty: labelOption.penalty,
    tag: quest.claimed_at ? "CLAIMED" : labelOption.tag,
    accent: quest.claimed_at ? "muted" : labelOption.accent,
    label: quest.label ?? labelOption.value,
    workspaceId: quest.workspace_id,
    creatorId: quest.creator_id,
    creatorName: creator?.name ?? "Unknown",
    visibility: quest.visibility ?? "workspace",
    assignedRoleId: quest.assigned_role_id ?? "",
    assignedRoleName: quest.assigned_role_id ? roleName(quest.assigned_role_id) : "All Role",
    rewardXp: quest.reward_xp ?? 50,
    rewardGold: quest.reward_gold ?? 15,
    claimed: Boolean(quest.claimed_at),
    deadline: formatDateTimeInput(quest.due_at),
    difficulty: quest.difficulty ?? "C-Rank",
    checklist: checklistByQuest.get(quest.id) ?? [],
    assigneeIds,
    assignees,
    members: assignees.map((assignee) => assignee.name),
    comments: commentsByQuest.get(quest.id) ?? [],
    activity: activityRows.length
      ? activityRows.map((activity) => mapActivity(activity, memberById))
      : [
          quest.claimed_at ? "Reward sudah diklaim dari backend." : "Quest tersinkron dengan Supabase.",
          ...(rewardRows.length ? [`Reward tercatat untuk ${rewardRows.length} member.`] : []),
        ],
  };
}

async function getCurrentUser() {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Session Supabase tidak ditemukan. Login ulang dulu.");
  return data.user;
}

async function ensureProfile(user, roleId) {
  const username =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "questify";

  const { data: existingProfile, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existingProfile) {
    const { data, error } = await supabase
      .from("users")
      .update({
        username: existingProfile.username || username,
        character_id: roleId,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      username,
      character_id: roleId,
      xp: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function ensureWorkspace(user, profile) {
  const { data: workspaceId, error: createWorkspaceError } = await supabase.rpc(
    "ensure_default_workspace_for_current_user",
    { target_name: `${userDisplayName(profile)}'s Solo Board` },
  );

  if (createWorkspaceError) throw createWorkspaceError;

  const { data: workspace, error: refetchError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (refetchError) throw refetchError;
  return workspace;
}

async function loadMyWorkspaces() {
  const { data, error } = await supabase.rpc("list_my_workspaces");
  if (error) throw error;
  return (data ?? []).map(mapWorkspaceOption);
}

export async function loadBoardsAndClansFromSupabase() {
  const { data, error } = await supabase.rpc("list_my_boards_and_clans");
  if (error) throw error;
  return mapBoardDirectory(data ?? {});
}

export async function loadCommandCenterSummaryFromSupabase() {
  const { data, error } = await supabase.rpc("get_command_center_summary");
  if (error) throw error;
  return mapCommandCenterSummary(data ?? {});
}

export async function loadClanDetailFromSupabase(clanId) {
  const { data, error } = await supabase.rpc("get_clan_detail", {
    target_clan_id: clanId,
  });

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    ownerId: data.ownerId,
    viewerRole: data.viewerRole === "owner" ? "Owner" : "Member",
    joinCode: data.joinCode ?? "",
    joinCodeEnabled: Boolean(data.joinCodeEnabled),
    members: (data.members ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role === "owner" ? "Owner" : "Member",
      status: member.status === "active" ? "Active" : "Menunggu persetujuan",
      characterId: member.characterId,
    })),
    boards: (data.boards ?? []).map((board) => ({
      id: board.id,
      name: board.name,
      joinCode: board.joinCode ?? "",
      joinCodeEnabled: Boolean(board.joinCodeEnabled),
      coverKey: resolveWorkspaceCoverKey("clan", board.coverKey),
      coverType: board.coverType ?? "preset",
      coverUrl: board.coverUrl ?? "",
      questCount: Number(board.questCount ?? 0),
    })),
  };
}

async function loadWorkspaceById(workspaceId) {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (error) throw error;
  return data;
}

async function loadWorkspaceRows(workspaceId) {
  const [
    columnsResult,
    membersResult,
    questsResult,
    directoryResult,
  ] = await Promise.all([
    supabase.from("board_columns").select("*").eq("workspace_id", workspaceId).order("position"),
    supabase
      .from("workspace_members")
      .select("*, users(id,email,username,character_id,hp,xp,gold,equipment,owned_items)")
      .eq("workspace_id", workspaceId)
      .order("created_at"),
    supabase
      .from("quests")
      .select("*, quest_assignees(user_id)")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("position"),
    supabase.from("users").select("id,email,username,character_id").order("username"),
  ]);

  const firstError = [
    columnsResult.error,
    membersResult.error,
    questsResult.error,
    directoryResult.error,
  ].find(Boolean);
  if (firstError) throw firstError;

  const questIds = (questsResult.data ?? []).map((quest) => quest.id);
  const [
    checklistResult,
    commentsResult,
    rewardsResult,
    activitiesResult,
  ] = await Promise.all([
    questIds.length
      ? supabase.from("quest_checklists").select("*").in("quest_id", questIds).order("position")
      : { data: [], error: null },
    questIds.length
      ? supabase
          .from("quest_comments")
          .select("*")
          .in("quest_id", questIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null },
    questIds.length
      ? supabase.from("quest_rewards").select("*").in("quest_id", questIds)
      : { data: [], error: null },
    supabase
      .from("quest_activities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  const firstChildError = [
    checklistResult.error,
    commentsResult.error,
    rewardsResult.error,
  ].find(Boolean);
  if (firstChildError) throw firstChildError;

  if (activitiesResult.error && !isMissingQuestActivitiesError(activitiesResult.error)) {
    throw activitiesResult.error;
  }

  return {
    columns: columnsResult.data ?? [],
    members: membersResult.data ?? [],
    quests: questsResult.data ?? [],
    checklist: checklistResult.data ?? [],
    comments: commentsResult.data ?? [],
    rewards: rewardsResult.data ?? [],
    activities: activitiesResult.error ? [] : activitiesResult.data ?? [],
    directory: directoryResult.data ?? [],
  };
}

export async function loadDashboardFromSupabase(roleId, activeWorkspaceId = "") {
  const user = await getCurrentUser();
  const profile = await ensureProfile(user, roleId);
  const soloWorkspace = await ensureWorkspace(user, profile);
  const workspaceOptions = await loadMyWorkspaces();
  const activeWorkspace = workspaceOptions.find(
    (workspace) => workspace.id === activeWorkspaceId && workspace.status === "Active",
  );
  const fallbackWorkspace =
    workspaceOptions.find((workspace) => workspace.id === soloWorkspace.id) ??
    workspaceOptions.find((workspace) => workspace.status === "Active");
  const workspace = activeWorkspace
    ? await loadWorkspaceById(activeWorkspace.id)
    : fallbackWorkspace
      ? await loadWorkspaceById(fallbackWorkspace.id)
      : soloWorkspace;
  const selectedWorkspaceOption =
    workspaceOptions.find((option) => option.id === workspace.id) ?? null;
  const rows = await loadWorkspaceRows(workspace.id);
  const members = rows.members.map(mapMember);
  const memberById = new Map(members.map((member) => [member.id, member]));
  const owner = members.find((member) => member.workspaceRole === "Owner") ?? members[0];

  const checklistByQuest = new Map();
  rows.checklist.forEach((item) => {
    const items = checklistByQuest.get(item.quest_id) ?? [];
    items.push({ id: item.id, text: item.text, done: item.done });
    checklistByQuest.set(item.quest_id, items);
  });

  const commentsByQuest = new Map();
  rows.comments.forEach((comment) => {
    const comments = commentsByQuest.get(comment.quest_id) ?? [];
    comments.push(comment.body);
    commentsByQuest.set(comment.quest_id, comments);
  });

  const rewardsByQuest = new Map();
  rows.rewards.forEach((reward) => {
    const rewards = rewardsByQuest.get(reward.quest_id) ?? [];
    rewards.push(reward);
    rewardsByQuest.set(reward.quest_id, rewards);
  });

  const activitiesByQuest = new Map();
  rows.activities.forEach((activity) => {
    if (!activity.quest_id) return;
    const activities = activitiesByQuest.get(activity.quest_id) ?? [];
    activities.push(activity);
    activitiesByQuest.set(activity.quest_id, activities);
  });

  const columnMap = {};
  const columns = rows.columns.map((column) => {
    const key = normalizeColumnKey(column);
    columnMap[key] = column.id;
    return {
      id: key,
      backendId: column.id,
      title: column.name,
      cards: [],
    };
  });

  rows.quests.forEach((quest) => {
    const backendColumn = rows.columns.find((column) => column.id === quest.column_id);
    const columnKey = backendColumn ? normalizeColumnKey(backendColumn) : getTargetColumnId(quest.difficulty);
    const targetColumn = columns.find((column) => column.id === columnKey);
    targetColumn?.cards.push(mapQuest(quest, memberById, checklistByQuest, commentsByQuest, rewardsByQuest, activitiesByQuest));
  });

  return {
    currentUserId: user.id,
    characterState: {
      gold: profile.gold ?? 220,
      xp: profile.xp ?? 0,
      ownedItems: profile.owned_items ?? [],
      equipment: profile.equipment && Object.keys(profile.equipment).length ? profile.equipment : starterEquipment,
    },
    registeredUsers: rows.directory.map(mapRegisteredUser),
    workspaceState: {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type ?? "solo",
      coverKey: resolveWorkspaceCoverKey(workspace.type ?? "solo", workspace.cover_key),
      coverType: workspace.cover_type ?? "preset",
      coverUrl: workspace.cover_url ?? "",
      ownerId: workspace.owner_id,
      members,
      columnMap,
      joinCode: selectedWorkspaceOption?.joinCode ?? workspace.join_code ?? "",
      joinCodeEnabled: selectedWorkspaceOption?.joinCodeEnabled ?? Boolean(workspace.join_code_enabled),
      membershipStatus: selectedWorkspaceOption?.status ?? "Active",
      membershipRole: selectedWorkspaceOption?.role ?? (workspace.owner_id === user.id ? "Owner" : "Member"),
    },
    questColumns: columns,
    workspaceOptions,
    owner,
  };
}

async function createQuestActivity({ workspaceId, questId, actorId, action, message, metadata = {} }) {
  if (!workspaceId || !questId || !action || !message) return;

  const { error } = await supabase.from("quest_activities").insert({
    workspace_id: workspaceId,
    quest_id: questId,
    actor_id: actorId,
    action,
    message,
    metadata,
  });

  if (isMissingQuestActivitiesError(error)) return;
  if (error) throw error;
}

export async function updateWorkspaceName(workspaceId, name) {
  const { error } = await supabase.from("workspaces").update({ name }).eq("id", workspaceId);
  if (error) throw error;
}

export async function createPersonalWorkspaceInSupabase(name, coverKey = "study-desk") {
  const { data, error } = await supabase.rpc("create_personal_workspace", {
    target_cover_key: coverKey,
    target_name: name,
  });

  if (error) throw error;
  return data;
}

export async function createClanInSupabase(name) {
  const { data, error } = await supabase.rpc("create_clan", {
    target_name: name,
  });

  if (error) throw error;
  return data;
}

export async function createWorkspaceForClanInSupabase(clanId, name, coverKey = "guild-hall") {
  const { data, error } = await supabase.rpc("create_clan_workspace", {
    target_clan_id: clanId,
    target_cover_key: coverKey,
    target_name: name,
  });

  if (error) throw error;
  return data;
}

export async function requestJoinWorkspaceByCodeInSupabase(code) {
  const { data, error } = await supabase.rpc("request_join_workspace_by_code", {
    raw_code: code,
  });

  if (error) throw error;
  return data;
}

export async function requestJoinClanByCodeInSupabase(code) {
  const { data, error } = await supabase.rpc("request_join_clan_by_code", {
    raw_code: code,
  });

  if (error) throw error;
  return data;
}

export async function approveClanMemberInSupabase(clanId, userId) {
  const { error } = await supabase.rpc("approve_clan_member", {
    target_clan_id: clanId,
    target_user_id: userId,
  });

  if (error) throw error;
}

export async function rejectClanMemberInSupabase(clanId, userId) {
  const { error } = await supabase.rpc("reject_clan_member", {
    target_clan_id: clanId,
    target_user_id: userId,
  });

  if (error) throw error;
}

export async function regenerateClanJoinCodeInSupabase(clanId) {
  const { data, error } = await supabase.rpc("regenerate_clan_join_code", {
    target_clan_id: clanId,
  });

  if (error) throw error;
  return data;
}

export async function deleteWorkspaceInSupabase(workspaceId) {
  const { error } = await supabase.rpc("delete_workspace", {
    target_workspace_id: workspaceId,
  });

  if (error) throw error;
}

function resolveAssigneeIds(questData, workspaceState, fallbackUserId) {
  const selectedNames = new Set(questData.members ?? []);
  const ids = workspaceState.members
    .filter((member) => selectedNames.has(member.name))
    .map((member) => member.id);

  if (!ids.length && fallbackUserId) ids.push(fallbackUserId);
  return [...new Set(ids)];
}

async function replaceQuestAssignees(questId, userIds) {
  await supabase.from("quest_assignees").delete().eq("quest_id", questId);
  if (!userIds.length) return;

  const { error } = await supabase.from("quest_assignees").insert(
    userIds.map((userId) => ({
      quest_id: questId,
      user_id: userId,
    })),
  );
  if (error) throw error;
}

async function replaceQuestChecklist(questId, items) {
  await supabase.from("quest_checklists").delete().eq("quest_id", questId);
  if (!items.length) return;

  const { error } = await supabase.from("quest_checklists").insert(
    items.map((item, index) => ({
      quest_id: questId,
      text: typeof item === "string" ? item : item.text,
      done: typeof item === "string" ? false : Boolean(item.done),
      position: index,
    })),
  );
  if (error) throw error;
}

export async function createQuestInSupabase(questData, workspaceState, currentUserId) {
  const label = labelForQuest(questData.label);
  const rewardXp = parseInt(label.reward, 10) || 50;
  const targetColumnId = getTargetColumnId(questData.difficulty);
  const columnId = workspaceState.columnMap?.[targetColumnId];
  if (!columnId) throw new Error("Kolom board Supabase belum sinkron.");

  const { data: createdQuest, error } = await supabase
    .from("quests")
    .insert({
      workspace_id: workspaceState.id,
      column_id: columnId,
      creator_id: currentUserId,
      title: questData.title,
      description: questData.description,
      difficulty: questData.difficulty,
      effort_points: difficultyWeight[questData.difficulty] ?? 1,
      due_at: parseLocalDateTime(questData.deadline),
      label: questData.label,
      visibility: currentUserId === workspaceState.ownerId ? "workspace" : "private",
      assigned_role_id: questData.assignedRoleId || null,
      reward_xp: rewardXp,
      reward_gold: Math.max(10, Math.round(rewardXp * 0.28)),
      position: 0,
    })
    .select()
    .single();

  if (error) throw error;

  await replaceQuestAssignees(createdQuest.id, resolveAssigneeIds(questData, workspaceState, currentUserId));
  await replaceQuestChecklist(createdQuest.id, questData.checklist ?? []);

  if (questData.comment) {
    const { error: commentError } = await supabase.from("quest_comments").insert({
      quest_id: createdQuest.id,
      user_id: currentUserId,
      body: questData.comment,
    });
    if (commentError) throw commentError;
  }

  await createQuestActivity({
    workspaceId: workspaceState.id,
    questId: createdQuest.id,
    actorId: currentUserId,
    action: "created",
    message: `Quest "${questData.title}" created.`,
  });
}

export async function updateQuestInSupabase(questData, workspaceState, currentUserId) {
  const label = labelForQuest(questData.label);
  const rewardXp = parseInt(label.reward, 10) || 50;

  const { error } = await supabase
    .from("quests")
    .update({
      title: questData.title,
      description: questData.description,
      difficulty: questData.difficulty,
      due_at: parseLocalDateTime(questData.deadline),
      label: questData.label,
      assigned_role_id: questData.assignedRoleId || null,
      reward_xp: rewardXp,
      reward_gold: Math.max(10, Math.round(rewardXp * 0.28)),
    })
    .eq("id", questData.id);

  if (error) throw error;

  await replaceQuestAssignees(questData.id, resolveAssigneeIds(questData, workspaceState, currentUserId));
  await replaceQuestChecklist(questData.id, questData.checklist ?? []);

  if (questData.comment) {
    const { error: commentError } = await supabase.from("quest_comments").insert({
      quest_id: questData.id,
      user_id: currentUserId,
      body: questData.comment,
    });
    if (commentError) throw commentError;
  }

  await createQuestActivity({
    workspaceId: workspaceState.id,
    questId: questData.id,
    actorId: currentUserId,
    action: "updated",
    message: `Quest "${questData.title}" updated.`,
  });
}

export async function updateChecklistItemInSupabase(checklistId, done, card = null, actorId = null) {
  const { error } = await supabase.from("quest_checklists").update({ done }).eq("id", checklistId);
  if (error) throw error;

  if (card?.workspaceId && card?.id) {
    const item = card.checklist?.find((checklistItem) => checklistItem.id === checklistId);
    await createQuestActivity({
      workspaceId: card.workspaceId,
      questId: card.id,
      actorId,
      action: "checklist",
      message: `${done ? "Checked" : "Unchecked"} checklist: ${item?.text ?? "item"}.`,
    });
  }
}

export async function addQuestCommentInSupabase(questId, userId, body, card = null) {
  const cleanedBody = body.trim();
  if (!cleanedBody) throw new Error("Komentar tidak boleh kosong.");

  const { error } = await supabase.from("quest_comments").insert({
    quest_id: questId,
    user_id: userId,
    body: cleanedBody,
  });

  if (error) throw error;

  if (card?.workspaceId) {
    await createQuestActivity({
      workspaceId: card.workspaceId,
      questId,
      actorId: userId,
      action: "commented",
      message: "Comment added.",
    });
  }
}

export async function archiveQuestInSupabase(questId, card = null, actorId = null) {
  const { error } = await supabase
    .from("quests")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", questId);

  if (error) throw error;

  if (card?.workspaceId) {
    await createQuestActivity({
      workspaceId: card.workspaceId,
      questId,
      actorId,
      action: "archived",
      message: `Quest "${card.title}" archived.`,
    });
  }
}

export async function deleteQuestInSupabase(questId) {
  const { error } = await supabase.from("quests").delete().eq("id", questId);

  if (error) throw error;
}

export async function moveQuestInSupabase(cardId, columnId, workspaceState, orderedColumns = null, actorId = null) {
  const backendColumnId = workspaceState.columnMap?.[columnId];
  if (!backendColumnId) throw new Error("Kolom tujuan Supabase tidak ditemukan.");

  if (Array.isArray(orderedColumns)) {
    const updates = orderedColumns.flatMap((column) => {
      const columnBackendId = workspaceState.columnMap?.[column.id];

      if (!columnBackendId) return [];

      return column.cards.map((card, position) => ({
        id: card.id,
        column_id: columnBackendId,
        position,
      }));
    });

    const firstError = (
      await Promise.all(
        updates.map((update) =>
          supabase
            .from("quests")
            .update({
              column_id: update.column_id,
              position: update.position,
            })
            .eq("id", update.id),
        ),
      )
    ).find((result) => result.error)?.error;

    if (firstError) throw firstError;
    await createQuestActivity({
      workspaceId: workspaceState.id,
      questId: cardId,
      actorId,
      action: "moved",
      message: `Quest moved to ${columnId}.`,
    });
    return;
  }

  const { error } = await supabase
    .from("quests")
    .update({ column_id: backendColumnId })
    .eq("id", cardId);
  if (error) throw error;

  await createQuestActivity({
    workspaceId: workspaceState.id,
    questId: cardId,
    actorId,
    action: "moved",
    message: `Quest moved to ${columnId}.`,
  });
}

export async function claimQuestRewardInSupabase(questId, card = null, actorId = null, methodMultiplier = 1) {
  const { data, error } = await supabase.rpc("claim_quest_reward", {
    method_multiplier: methodMultiplier,
    target_quest_id: questId,
  });
  if (error) throw error;

  if (card?.workspaceId) {
    await createQuestActivity({
      workspaceId: card.workspaceId,
      questId,
      actorId,
      action: "completed",
      message: `Quest "${card.title}" completed and reward claimed.`,
    });
  }

  return data ?? [];
}

export async function recordQuestFocusSessionInSupabase({
  durationMinutes,
  methodName,
  questId,
  resultedInCompletion = false,
}) {
  if (!questId) return null;

  const { data, error } = await supabase.rpc("record_quest_focus_session", {
    duration_minutes: Math.max(Number(durationMinutes) || 1, 1),
    focus_method: methodName || "Focus Session",
    resulted_in_completion: resultedInCompletion,
    target_quest_id: questId,
  });

  if (error && isMissingFocusSessionRpcError(error)) return null;
  if (error) throw error;

  return data;
}

export async function loadArchivedQuestsFromSupabase(workspaceState) {
  const workspaceId = workspaceState?.id;
  if (!workspaceId) return [];

  const questsResult = await supabase
    .from("quests")
    .select("*, quest_assignees(user_id)")
    .eq("workspace_id", workspaceId)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (questsResult.error) throw questsResult.error;

  const questIds = (questsResult.data ?? []).map((quest) => quest.id);
  const [
    checklistResult,
    commentsResult,
    rewardsResult,
    activitiesResult,
  ] = await Promise.all([
    questIds.length
      ? supabase.from("quest_checklists").select("*").in("quest_id", questIds).order("position")
      : { data: [], error: null },
    questIds.length
      ? supabase
          .from("quest_comments")
          .select("*")
          .in("quest_id", questIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null },
    questIds.length
      ? supabase.from("quest_rewards").select("*").in("quest_id", questIds)
      : { data: [], error: null },
    supabase
      .from("quest_activities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  const firstChildError = [
    checklistResult.error,
    commentsResult.error,
    rewardsResult.error,
  ].find(Boolean);
  if (firstChildError) throw firstChildError;

  if (activitiesResult.error && !isMissingQuestActivitiesError(activitiesResult.error)) {
    throw activitiesResult.error;
  }

  const memberById = new Map((workspaceState.members ?? []).map((member) => [member.id, member]));
  const checklistByQuest = new Map();
  const commentsByQuest = new Map();
  const rewardsByQuest = new Map();
  const activitiesByQuest = new Map();

  (checklistResult.data ?? []).forEach((item) => {
    const items = checklistByQuest.get(item.quest_id) ?? [];
    items.push({ id: item.id, text: item.text, done: item.done });
    checklistByQuest.set(item.quest_id, items);
  });

  (commentsResult.data ?? []).forEach((comment) => {
    const comments = commentsByQuest.get(comment.quest_id) ?? [];
    comments.push(comment.body);
    commentsByQuest.set(comment.quest_id, comments);
  });

  (rewardsResult.data ?? []).forEach((reward) => {
    const rewards = rewardsByQuest.get(reward.quest_id) ?? [];
    rewards.push(reward);
    rewardsByQuest.set(reward.quest_id, rewards);
  });

  (activitiesResult.error ? [] : activitiesResult.data ?? []).forEach((activity) => {
    if (!activity.quest_id) return;
    const activities = activitiesByQuest.get(activity.quest_id) ?? [];
    activities.push(activity);
    activitiesByQuest.set(activity.quest_id, activities);
  });

  return (questsResult.data ?? []).map((quest) => ({
    ...mapQuest(quest, memberById, checklistByQuest, commentsByQuest, rewardsByQuest, activitiesByQuest),
    archivedAt: quest.archived_at,
  }));
}

export async function restoreQuestInSupabase(questId) {
  const { error } = await supabase.rpc("restore_quest", {
    target_quest_id: questId,
  });

  if (error) throw error;
}

export async function loadDeadlineNotificationsFromSupabase(workspaceState, currentUserId) {
  if (!workspaceState?.id || !currentUserId) return [];

  const { data: quests, error: questError } = await supabase
    .from("quests")
    .select("id,title,due_at,workspace_id,archived_at,claimed_at")
    .eq("workspace_id", workspaceState.id)
    .is("archived_at", null)
    .is("claimed_at", null)
    .not("due_at", "is", null);

  if (questError) throw questError;

  const notificationRows = (quests ?? [])
    .map((quest) => {
      const type = getNotificationType(quest.due_at);
      if (!type) return null;

      const dueLabel = new Date(quest.due_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      const label =
        type === "overdue"
          ? "Overdue"
          : type === "due_soon"
            ? "Deadline kurang dari 2 jam"
            : "Deadline hari ini";

      return {
        message: `${label}: ${quest.title} (${dueLabel})`,
        quest_id: quest.id,
        type,
        user_id: currentUserId,
        workspace_id: workspaceState.id,
      };
    })
    .filter(Boolean);

  if (notificationRows.length) {
    const { error: upsertError } = await supabase
      .from("quest_notifications")
      .upsert(notificationRows, { onConflict: "quest_id,user_id,type", ignoreDuplicates: true });

    if (upsertError && !isMissingQuestNotificationsError(upsertError)) throw upsertError;
  }

  let notificationsQuery = supabase
    .from("quest_notifications")
    .select("id,quest_id,type,message,read_at,created_at,dismissed_at")
    .eq("workspace_id", workspaceState.id)
    .eq("user_id", currentUserId)
    .is("dismissed_at", null);

  let { data, error } = await notificationsQuery
    .order("created_at", { ascending: false })
    .limit(30);

  if (error && isMissingDismissedAtError(error)) {
    const fallbackResult = await supabase
      .from("quest_notifications")
      .select("id,quest_id,type,message,read_at,created_at")
      .eq("workspace_id", workspaceState.id)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(30);

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error && isMissingQuestNotificationsError(error)) return [];
  if (error) throw error;

  return (data ?? []).map((notification) => ({
    id: notification.id,
    createdAt: notification.created_at,
    isRead: Boolean(notification.read_at),
    message: notification.message,
    questId: notification.quest_id,
    type: notification.type,
  }));
}

export async function markDeadlineNotificationsReadInSupabase(notificationIds) {
  if (!notificationIds?.length) return;

  const { error } = await supabase
    .from("quest_notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", notificationIds);

  if (error && isMissingQuestNotificationsError(error)) return;
  if (error) throw error;
}

export async function deleteDeadlineNotificationsInSupabase(notificationIds) {
  if (!notificationIds?.length) return;

  const { error } = await supabase
    .from("quest_notifications")
    .update({ dismissed_at: new Date().toISOString() })
    .in("id", notificationIds);

  if (error && isMissingDismissedAtError(error)) {
    const { error: deleteError } = await supabase
      .from("quest_notifications")
      .delete()
      .in("id", notificationIds);

    if (deleteError && isMissingQuestNotificationsError(deleteError)) return;
    if (deleteError) throw deleteError;
    return;
  }

  if (error && isMissingQuestNotificationsError(error)) return;
  if (error) throw error;
}

export function subscribeWorkspaceRealtime(workspaceId, handlers = {}) {
  assertSupabaseConfigured();
  teardownWorkspaceRealtimeChannel();

  if (!workspaceId) {
    return () => {};
  }

  const channelName = `workspace:${workspaceId}:${Date.now()}`;
  const channel = supabase.channel(channelName);
  workspaceRealtimeChannel = channel;

  const onEvent = typeof handlers.onEvent === "function" ? handlers.onEvent : null;
  const onStatus = typeof handlers.onStatus === "function" ? handlers.onStatus : null;
  const onError = typeof handlers.onError === "function" ? handlers.onError : null;
  const hasQuestFilter = Array.isArray(handlers.questIds);
  const activeQuestIdSet = new Set(handlers.questIds ?? []);

  function getPayloadQuestId(payload) {
    return payload?.new?.quest_id ?? payload?.old?.quest_id ?? "";
  }

  function shouldHandleQuestChildEvent(payload) {
    if (!hasQuestFilter) return true;
    const questId = getPayloadQuestId(payload);
    return Boolean(questId && activeQuestIdSet.has(questId));
  }

  channel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "quests", filter: `workspace_id=eq.${workspaceId}` },
      (payload) => onEvent?.({ source: "quests", payload }),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "quest_assignees" },
      (payload) => {
        if (shouldHandleQuestChildEvent(payload)) {
          onEvent?.({ source: "quest_assignees", payload });
        }
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "quest_checklists" },
      (payload) => {
        if (shouldHandleQuestChildEvent(payload)) {
          onEvent?.({ source: "quest_checklists", payload });
        }
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "quest_comments" },
      (payload) => {
        if (shouldHandleQuestChildEvent(payload)) {
          onEvent?.({ source: "quest_comments", payload });
        }
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "quest_activities", filter: `workspace_id=eq.${workspaceId}` },
      (payload) => onEvent?.({ source: "quest_activities", payload }),
    )
    .subscribe((status) => {
      onStatus?.(status);
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(new Error("Realtime channel disconnected."));
      }
    });

  return () => {
    if (workspaceRealtimeChannel?.topic === channel.topic) {
      teardownWorkspaceRealtimeChannel();
    }
  };
}
