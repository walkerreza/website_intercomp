import { Coins, Heart, Shield, Sparkles, Star, Zap } from "lucide-react";

export function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="Questify preview">
      <div className="brand-panel__content">
        <div className="brand-mark" aria-hidden="true">
          <Sparkles size={24} />
        </div>

        <div>
          <p className="eyebrow">Questify Guild Board</p>
          <h1>Build habits. Level up.</h1>
          <p className="brand-panel__copy">
            Pilih class, selesaikan tugas kuliah, kumpulkan XP, gold, dan
            reward seperti petualangan RPG harian.
          </p>
        </div>

        <div className="avatar-card" aria-hidden="true">
          <div className="pixel-avatar">
            <span className="pixel-avatar__hair" />
            <span className="pixel-avatar__face" />
            <span className="pixel-avatar__robe" />
            <span className="pixel-avatar__staff" />
          </div>
          <div className="avatar-card__body">
            <div>
              <span>Lv. 1 Student Mage</span>
              <strong>Ready for quest</strong>
            </div>
            <div className="bar-stack">
              <div className="stat-bar stat-bar--hp">
                <Heart size={14} />
                <span />
              </div>
              <div className="stat-bar stat-bar--xp">
                <Star size={14} />
                <span />
              </div>
            </div>
          </div>
        </div>

        <div className="quest-preview" aria-hidden="true">
          <div className="quest-preview__header">
            <span>Today&apos;s Quest</span>
            <strong>3/5 done</strong>
          </div>
          <div className="task-color-strip">
            <span className="is-blue" />
            <span className="is-green" />
            <span className="is-yellow" />
            <span className="is-orange" />
            <span className="is-red" />
          </div>
          <div className="quest-card quest-card--positive">
            <span className="quest-card__difficulty">Daily</span>
            <strong>Review materi 30 menit</strong>
            <small>+12 XP +3 Gold</small>
          </div>
          <div className="quest-card quest-card--boss">
            <span className="quest-card__difficulty">Boss</span>
            <strong>Presentasi Sistem Informasi</strong>
            <small>Deadline: Jumat</small>
          </div>
        </div>

        <div className="stat-strip" aria-hidden="true">
          <div>
            <Zap size={18} />
            <span>1,240 XP</span>
          </div>
          <div>
            <Coins size={18} />
            <span>320 Gold</span>
          </div>
          <div>
            <Shield size={18} />
            <span>Party Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
