import { Backpack, Clock3, Sparkles, Zap } from "lucide-react";

function formatBoostEffect(item) {
  if (item.effectType === "next_quest_xp_percent") return `+${item.effectValue}% XP next quest`;
  if (item.effectType === "next_quest_gold_percent") return `+${item.effectValue}% gold next quest`;
  if (item.effectType === "priority_highlight") return "Priority mode token";
  if (item.effectType === "streak_guard") return "Streak guard token";
  if (item.effectType === "guild_morale") return `+${item.effectValue}% squad morale`;
  return "Utility boost";
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return "No expiry";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(expiresAt));
}

export function InventoryPage({
  activeBoosts,
  inventory,
  isLoading,
  message,
  onActivateItem,
}) {
  return (
    <div className="sync-inventory-page">
      <div className="sync-section-title">
        <div>
          <h1>INVENTORY</h1>
          <span>BOOST ITEMS | ACTIVATE BEFORE QUEST CLAIM</span>
        </div>
      </div>

      {message && <div className="sync-visibility-note">{message}</div>}

      <section className="sync-panel sync-panel--wide">
        <div className="sync-panel-heading">
          <h2>Active Boosts</h2>
          <span>{activeBoosts.length} ACTIVE</span>
        </div>
        <div className="sync-inventory-grid">
          {activeBoosts.length ? (
            activeBoosts.map((boost) => (
              <article className="sync-inventory-item" data-rarity={boost.rarity} key={boost.id}>
                <div className="sync-item-title">
                  <strong>{boost.name}</strong>
                  <span>{boost.rarity}</span>
                </div>
                <Sparkles size={22} />
                <small>{formatBoostEffect(boost)}</small>
                <div className="sync-shop-item__meta">
                  <span>{boost.remainingUses} use</span>
                  <span>{formatExpiry(boost.expiresAt)}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="sync-empty-inventory">
              <Backpack size={28} />
              <strong>No active boost</strong>
              <small>Aktifkan item dari inventory sebelum menyelesaikan quest.</small>
            </div>
          )}
        </div>
      </section>

      <section className="sync-panel sync-panel--wide">
        <div className="sync-panel-heading">
          <h2>Bag Items</h2>
          <span>{inventory.length} ITEM</span>
        </div>
        <div className="sync-inventory-grid">
          {inventory.length ? (
            inventory.map((item) => (
              <article className="sync-inventory-item" data-rarity={item.rarity} key={item.id}>
                <div className="sync-item-title">
                  <strong>{item.name}</strong>
                  <span>{item.rarity}</span>
                </div>
                <Zap size={22} />
                <small>{item.description}</small>
                <div className="sync-shop-item__meta">
                  <span>{formatBoostEffect(item)}</span>
                  <span>
                    <Clock3 size={13} />
                    {item.durationHours}h
                  </span>
                </div>
                <button
                  disabled={item.status !== "available" || item.quantity <= 0 || isLoading}
                  onClick={() => onActivateItem(item.id)}
                  type="button"
                >
                  {item.status === "available" && item.quantity > 0 ? "Activate" : "Used"}
                </button>
              </article>
            ))
          ) : (
            <div className="sync-empty-inventory">
              <Backpack size={28} />
              <strong>Inventory empty</strong>
              <small>Beli boost dari Shop menggunakan gold hasil quest.</small>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
