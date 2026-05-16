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

function parseLocalDate(dateValue) {
  if (!dateValue) return null;
  return dateValue.length <= 10 ? `${dateValue}T00:00:00.000Z` : dateValue;
}

function formatDateInput(dateValue) {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
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

function mapQuest(quest, memberById, checklistByQuest, commentsByQuest, rewardsByQuest) {
  const labelOption = labelForQuest(quest.label);
  const assigneeIds = quest.quest_assignees?.map((assignee) => assignee.user_id) ?? [];
  const creator = memberById.get(quest.creator_id);
  const rewardRows = rewardsByQuest.get(quest.id) ?? [];

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
    assignedRoleId: quest.assigned_role_id ?? creator?.roleId ?? "healer",
    assignedRoleName: roleName(quest.assigned_role_id ?? creator?.roleId ?? "healer"),
    rewardXp: quest.reward_xp ?? 50,
    rewardGold: quest.reward_gold ?? 15,
    claimed: Boolean(quest.claimed_at),
    deadline: formatDateInput(quest.due_at),
    difficulty: quest.difficulty ?? "C-Rank",
    checklist: checklistByQuest.get(quest.id) ?? [],
    members: assigneeIds.map((id) => memberById.get(id)?.name).filter(Boolean),
    comments: commentsByQuest.get(quest.id) ?? [],
    activity: [
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
    checklistResult,
    commentsResult,
    rewardsResult,
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
    supabase.from("quest_checklists").select("*").order("position"),
    supabase.from("quest_comments").select("*").order("created_at", { ascending: false }),
    supabase.from("quest_rewards").select("*"),
    supabase.from("users").select("id,email,username,character_id").order("username"),
  ]);

  const firstError = [
    columnsResult.error,
    membersResult.error,
    questsResult.error,
    checklistResult.error,
    commentsResult.error,
    rewardsResult.error,
    directoryResult.error,
  ].find(Boolean);
  if (firstError) throw firstError;

  return {
    columns: columnsResult.data ?? [],
    members: membersResult.data ?? [],
    quests: questsResult.data ?? [],
    checklist: checklistResult.data ?? [],
    comments: commentsResult.data ?? [],
    rewards: rewardsResult.data ?? [],
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
    targetColumn?.cards.push(mapQuest(quest, memberById, checklistByQuest, commentsByQuest, rewardsByQuest));
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
      due_at: parseLocalDate(questData.deadline),
      label: questData.label,
      visibility: currentUserId === workspaceState.ownerId ? "workspace" : "private",
      assigned_role_id: questData.assignedRoleId,
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
      due_at: parseLocalDate(questData.deadline),
      label: questData.label,
      assigned_role_id: questData.assignedRoleId,
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
}

export async function updateChecklistItemInSupabase(checklistId, done) {
  const { error } = await supabase.from("quest_checklists").update({ done }).eq("id", checklistId);
  if (error) throw error;
}

export async function addQuestCommentInSupabase(questId, userId, body) {
  const cleanedBody = body.trim();
  if (!cleanedBody) throw new Error("Komentar tidak boleh kosong.");

  const { error } = await supabase.from("quest_comments").insert({
    quest_id: questId,
    user_id: userId,
    body: cleanedBody,
  });

  if (error) throw error;
}

export async function archiveQuestInSupabase(questId) {
  const { error } = await supabase
    .from("quests")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", questId);

  if (error) throw error;
}

export async function deleteQuestInSupabase(questId) {
  const { error } = await supabase.from("quests").delete().eq("id", questId);

  if (error) throw error;
}

export async function moveQuestInSupabase(cardId, columnId, workspaceState, orderedColumns = null) {
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
    return;
  }

  const { error } = await supabase
    .from("quests")
    .update({ column_id: backendColumnId })
    .eq("id", cardId);
  if (error) throw error;
}

export async function claimQuestRewardInSupabase(questId) {
  const { data, error } = await supabase.rpc("claim_quest_reward", {
    target_quest_id: questId,
  });
  if (error) throw error;
  return data ?? [];
}
