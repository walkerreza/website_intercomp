import { productivityShopItems } from "../data/productivityItems.js";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

const SHOP_STORAGE_KEY = "questify:shop-inventory";
let shouldUseLocalShopFallback = false;

const emptySummary = {
  activeBoosts: [],
  catalog: productivityShopItems,
  inventory: [],
  profile: { gold: 0 },
};

function normalizeSummary(data = emptySummary) {
  return {
    activeBoosts: (data.activeBoosts ?? []).map((boost) => ({
      effectType: boost.effectType,
      effectValue: Number(boost.effectValue ?? 0),
      expiresAt: boost.expiresAt ?? "",
      id: boost.id,
      itemId: boost.itemId,
      name: boost.name,
      rarity: boost.rarity ?? "Normal",
      remainingUses: Number(boost.remainingUses ?? 0),
    })),
    catalog: (data.catalog?.length ? data.catalog : productivityShopItems).map((item) => ({
      category: item.category ?? "Consumable",
      description: item.description ?? "",
      durationHours: Number(item.durationHours ?? 24),
      effectType: item.effectType,
      effectValue: Number(item.effectValue ?? 0),
      id: item.id,
      maxUses: Number(item.maxUses ?? 1),
      name: item.name,
      price: Number(item.price ?? 0),
      rarity: item.rarity ?? "Normal",
    })),
    inventory: (data.inventory ?? []).map((item) => ({
      acquiredAt: item.acquiredAt ?? "",
      activatedAt: item.activatedAt ?? "",
      category: item.category ?? "Consumable",
      description: item.description ?? "",
      durationHours: Number(item.durationHours ?? 24),
      effectType: item.effectType,
      effectValue: Number(item.effectValue ?? 0),
      id: item.id,
      itemId: item.itemId,
      maxUses: Number(item.maxUses ?? 1),
      name: item.name,
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 0),
      rarity: item.rarity ?? "Normal",
      remainingUses: Number(item.remainingUses ?? 0),
      status: item.status ?? "available",
    })),
    profile: {
      gold: Number(data.profile?.gold ?? 0),
    },
  };
}

function getLocalSummary(accountId, gold = 0) {
  try {
    const saved = window.localStorage.getItem(`${SHOP_STORAGE_KEY}:${accountId}`);
    const parsed = saved ? JSON.parse(saved) : {};
    return normalizeSummary({
      ...emptySummary,
      ...parsed,
      profile: { gold },
    });
  } catch {
    return normalizeSummary({ ...emptySummary, profile: { gold } });
  }
}

function saveLocalSummary(accountId, summary) {
  window.localStorage.setItem(
    `${SHOP_STORAGE_KEY}:${accountId}`,
    JSON.stringify({
      activeBoosts: summary.activeBoosts,
      inventory: summary.inventory,
    }),
  );
}

function isMissingShopRpcError(error) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""} ${error?.details ?? ""}`;
  return (
    error?.code === "PGRST202" ||
    message.includes("schema cache") ||
    message.includes("Could not find the function")
  );
}

export async function loadShopInventorySummary({ accountId, gold = 0 } = {}) {
  if (isSupabaseConfigured && !shouldUseLocalShopFallback) {
    const { data, error } = await supabase.rpc("get_shop_inventory_summary");
    if (error) {
      if (isMissingShopRpcError(error)) {
        shouldUseLocalShopFallback = true;
        return getLocalSummary(accountId, gold);
      }

      throw error;
    }
    return normalizeSummary(data);
  }

  return getLocalSummary(accountId, gold);
}

export async function buyShopItem(itemId, { accountId, gold = 0 } = {}) {
  if (isSupabaseConfigured && !shouldUseLocalShopFallback) {
    const { data, error } = await supabase.rpc("buy_shop_item", {
      target_item_id: itemId,
    });
    if (error) {
      if (isMissingShopRpcError(error)) {
        shouldUseLocalShopFallback = true;
      } else {
        throw error;
      }
    } else {
      return normalizeSummary(data);
    }
  }

  const summary = getLocalSummary(accountId, gold);
  const targetItem = productivityShopItems.find((item) => item.id === itemId);

  if (!targetItem) throw new Error("Item tidak ditemukan.");
  if (summary.profile.gold < targetItem.price) throw new Error("Gold tidak cukup.");

  const nextSummary = normalizeSummary({
    ...summary,
    inventory: [
      {
        ...targetItem,
        acquiredAt: new Date().toISOString(),
        id: `local-item-${Date.now()}`,
        itemId: targetItem.id,
        quantity: 1,
        remainingUses: targetItem.maxUses,
        status: "available",
      },
      ...summary.inventory,
    ],
    profile: { gold: summary.profile.gold - targetItem.price },
  });

  saveLocalSummary(accountId, nextSummary);
  return nextSummary;
}

export async function activateInventoryItem(userItemId, { accountId, gold = 0 } = {}) {
  if (isSupabaseConfigured && !shouldUseLocalShopFallback) {
    const { data, error } = await supabase.rpc("activate_inventory_item", {
      target_user_item_id: userItemId,
    });
    if (error) {
      if (isMissingShopRpcError(error)) {
        shouldUseLocalShopFallback = true;
      } else {
        throw error;
      }
    } else {
      return normalizeSummary(data);
    }
  }

  const summary = getLocalSummary(accountId, gold);
  const targetItem = summary.inventory.find((item) => item.id === userItemId);

  if (!targetItem || targetItem.status !== "available" || targetItem.quantity <= 0) {
    throw new Error("Item tidak tersedia.");
  }

  const now = Date.now();
  const nextSummary = normalizeSummary({
    ...summary,
    activeBoosts: [
      {
        effectType: targetItem.effectType,
        effectValue: targetItem.effectValue,
        expiresAt: new Date(now + targetItem.durationHours * 60 * 60 * 1000).toISOString(),
        id: `local-boost-${now}`,
        itemId: targetItem.itemId,
        name: targetItem.name,
        rarity: targetItem.rarity,
        remainingUses: targetItem.maxUses,
      },
      ...summary.activeBoosts,
    ],
    inventory: summary.inventory.map((item) =>
      item.id === userItemId
        ? {
            ...item,
            activatedAt: new Date(now).toISOString(),
            quantity: 0,
            remainingUses: 0,
            status: "activated",
          }
        : item,
    ),
  });

  saveLocalSummary(accountId, nextSummary);
  return nextSummary;
}
