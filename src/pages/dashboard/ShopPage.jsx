import { Coins, Gem, ShoppingBag, Sparkles } from "lucide-react";

function formatBoostEffect(item) {
  if (item.effectType === "next_quest_xp_percent") return `+${item.effectValue}% XP next quest`;
  if (item.effectType === "next_quest_gold_percent") return `+${item.effectValue}% gold next quest`;
  if (item.effectType === "priority_highlight") return "Priority mode token";
  if (item.effectType === "streak_guard") return "Streak guard token";
  if (item.effectType === "guild_morale") return `+${item.effectValue}% squad morale`;
  return "Utility boost";
}

export function ShopPage({
  catalog,
  gold,
  isLoading,
  message,
  onBuyItem,
}) {
  return (
    <div className="sync-shop-page">
      <div className="sync-section-title">
        <div>
          <h1>BOOST SHOP</h1>
          <span>BUY PRODUCTIVITY ITEMS WITH QUEST GOLD</span>
        </div>
        <div className="sync-section-actions">
          <button type="button">
            <Coins size={16} />
            {gold} Gold
          </button>
        </div>
      </div>

      {message && <div className="sync-visibility-note">{message}</div>}

      <section className="sync-shop-grid">
        {catalog.map((item) => {
          const canBuy = gold >= item.price && !isLoading;

          return (
            <article className="sync-shop-item" data-rarity={item.rarity} key={item.id}>
              <div className="sync-shop-item__top">
                <strong>{item.name}</strong>
                <span>{item.rarity}</span>
              </div>
              <Gem size={24} />
              <small>{item.description}</small>
              <div className="sync-shop-item__meta">
                <span>
                  <Sparkles size={13} />
                  {formatBoostEffect(item)}
                </span>
                <span>{item.durationHours}h</span>
              </div>
              <div className="sync-shop-item__meta">
                <strong>
                  <Coins size={14} />
                  {item.price}
                </strong>
                <span>{item.category}</span>
              </div>
              <button disabled={!canBuy} onClick={() => onBuyItem(item.id)} type="button">
                <ShoppingBag size={16} />
                {gold >= item.price ? "Buy Item" : "Need Gold"}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
