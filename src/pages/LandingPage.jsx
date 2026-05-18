import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Columns3,
  Gamepad2,
  Shield,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { QuestifyLogo } from "../components/QuestifyLogo.jsx";

const questCards = [
  {
    title: "Review Materi Basis Data",
    meta: "Pomodoro / Medium / 4 SKS",
    reward: "+70 XP",
    tone: "blue",
  },
  {
    title: "Finalisasi UI Kanban",
    meta: "Deep Work / Hard / 8 SKS",
    reward: "+140 XP",
    tone: "yellow",
  },
  {
    title: "Daily Standup Guild",
    meta: "Sprint / Low / 2 SKS",
    reward: "+30 XP",
    tone: "green",
  },
];

const statItems = [
  { icon: Trophy, value: "XP", label: "Reward dari task selesai" },
  { icon: Users, value: "Guild", label: "Kerja solo atau tim" },
  { icon: Clock3, value: "15/25/50", label: "Mode fokus bawaan" },
];

const featureItems = [
  {
    icon: Columns3,
    title: "Kanban Quest",
    copy: "Kelola pekerjaan solo atau tim dalam board RPG yang mudah dipindah antar status.",
  },
  {
    icon: Trophy,
    title: "XP dan Reward",
    copy: "Difficulty, SKS, dan mode fokus mengubah task biasa menjadi progress karakter.",
  },
  {
    icon: Shield,
    title: "Guild Workspace",
    copy: "Bagi jatah pekerjaan, assign member, dan pantau kontribusi tiap pemain.",
  },
];

const seoItems = [
  {
    title: "Questify untuk task harian",
    copy: "Questify membantu mengubah daftar tugas biasa menjadi quest yang lebih jelas, terukur, dan terasa seperti progres karakter RPG.",
  },
  {
    title: "Kanban RPG untuk solo dan tim",
    copy: "Gunakan board Todo, In Progress, Review, dan Done sebagai quest board untuk mengelola pekerjaan solo, squad, atau clan workspace.",
  },
  {
    title: "Alternatif Trello RPG",
    copy: "Questify RPG cocok untuk pengguna yang ingin task management ala Trello, tetapi dengan XP, gold, reward, rank, dan focus timer.",
  },
];

const faqItems = [
  {
    question: "Apa itu Questify RPG?",
    answer:
      "Questify RPG adalah aplikasi produktivitas gamifikasi yang mengubah task menjadi quest dengan kanban board, XP, gold, workspace, clan, dan focus timer.",
  },
  {
    question: "Apa itu kanban RPG?",
    answer:
      "Kanban RPG adalah cara mengelola tugas memakai kolom kanban seperti Todo, In Progress, dan Done, tetapi diberi elemen RPG seperti quest, reward, XP, dan rank.",
  },
  {
    question: "Apakah Questify bisa dipakai untuk tim?",
    answer:
      "Bisa. Questify mendukung workspace solo, squad board, clan workspace, dan pembagian quest untuk produktivitas tim.",
  },
];

const steps = [
  "Buat workspace atau guild.",
  "Tambah quest dengan difficulty, SKS, dan timer.",
  "Selesaikan task untuk naik XP dan progress.",
];

export function LandingPage({ onStart }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Questify navigation">
        <a className="landing-logo" href="#top" aria-label="Questify home">
          <QuestifyLogo className="questify-logo--landing-nav" />
        </a>
        <div className="landing-nav__links">
          <a href="#board">Board</a>
          <button onClick={onStart} type="button">
            Masuk
          </button>
        </div>
      </nav>

      <section className="landing-hero" id="top">
        <div className="landing-hero__copy">
          <span className="landing-kicker">
            <Gamepad2 size={18} />
            Productivity RPG System
          </span>
          <h1 className="landing-logo-heading">
            <QuestifyLogo className="questify-logo--landing-hero" />
            <span>Questify RPG</span>
          </h1>
          <p>
            Questify RPG adalah Trello RPG untuk tim dan solo. Ubah tugas, SKS, sprint, dan deep
            work menjadi quest 8-bit dengan XP, guild, dan reward progress.
          </p>
          <div className="landing-actions">
            <button className="landing-primary" onClick={onStart} type="button">
              Mulai Quest
              <ArrowRight size={20} />
            </button>
            <a className="landing-secondary" href="#board">
              Lihat Board
            </a>
          </div>
          <div className="landing-mini-stats" aria-label="Ringkasan fitur">
            {statItems.map(({ icon: Icon, value, label }) => (
              <span key={value}>
                <Icon size={17} />
                <strong>{value}</strong>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="landing-stage" aria-label="Preview dashboard Questify">
          <div className="landing-stage__top">
            <span>Quest Board</span>
            <strong>8-BIT MODE</strong>
          </div>
          <div className="landing-stage__body">
            <aside className="landing-player-card">
              <img
                alt="Karakter warrior Questify"
                src="/assets/characters/warrior.png"
              />
              <div>
                <span>Lv. 12 Warrior</span>
                <strong>Deadline Breaker</strong>
              </div>
              <div className="landing-pixel-bars" aria-hidden="true">
                <span />
                <span />
              </div>
            </aside>

            <div className="landing-board-preview" id="board">
              {["Available", "In Progress", "Completed"].map((column, index) => (
                <div className="landing-column" key={column}>
                  <header>
                    <span>{column}</span>
                    <strong>{index + 2}</strong>
                  </header>
                  {questCards.slice(0, index === 2 ? 1 : 2).map((card) => (
                    <article
                      className={`landing-quest is-${card.tone}`}
                      key={card.title}
                    >
                      <small>{card.meta}</small>
                      <h2>{card.title}</h2>
                      <footer>
                        <span>{card.reward}</span>
                        {index === 2 ? <CheckCircle2 size={16} /> : <Zap size={16} />}
                      </footer>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <figure className="landing-showcase-image">
        <img
          alt="Questify RPG pixel art landing preview with quest board"
          src="/assets/seo/questify-og.png"
        />
      </figure>

      <section className="landing-section" id="fitur">
        <div className="landing-section__header">
          <span>Core System</span>
          <h2>Produktifitas yang terasa seperti menjalankan guild.</h2>
        </div>
        <div className="landing-feature-grid">
          {featureItems.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-seo-section" id="questify-rpg">
        <div className="landing-section__header">
          <span>Questify RPG</span>
          <h2>Kanban RPG untuk mengubah task menjadi quest board.</h2>
          <p>
            Questify, atau Questify RPG, adalah productivity RPG app untuk pengguna
            yang ingin mengelola tugas dengan sistem kanban RPG. Setiap task bisa
            menjadi quest dengan rank, XP, gold, deadline, dan focus timer.
          </p>
        </div>
        <div className="landing-seo-grid">
          {seoItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--split">
        <div className="landing-section__header">
          <span>How It Works</span>
          <h2>Dari task list menjadi quest board.</h2>
        </div>
        <ol className="landing-steps">
          {steps.map((step, index) => (
            <li key={step}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section landing-faq-section" id="faq">
        <div className="landing-section__header">
          <span>FAQ</span>
          <h2>Pertanyaan tentang Questify, Questify RPG, dan kanban RPG.</h2>
        </div>
        <div className="landing-faq-list">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <div>
          <span>Ready for quest</span>
          <h2>Bangun ritme kerja tim dengan sistem RPG.</h2>
        </div>
        <button className="landing-primary" onClick={onStart} type="button">
          Mulai Sekarang
          <ArrowRight size={20} />
        </button>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__content">
          <a className="landing-logo" href="#top" aria-label="Questify home">
            <QuestifyLogo className="questify-logo--landing-footer" />
          </a>
          <nav aria-label="Footer navigation">
            <a href="#top">Home</a>
            <a href="#board">Board</a>
            <a href="#fitur">Fitur</a>
          </nav>
          <small>Questify - Trello RPG produktifitas gamifikasi.</small>
        </div>
        <div className="landing-footer-rpg" aria-hidden="true">
          <span className="footer-pixel footer-pixel--tree" />
          <span className="footer-pixel footer-pixel--knight" />
          <span className="footer-pixel footer-pixel--slime" />
          <span className="footer-pixel footer-pixel--wizard" />
          <span className="footer-pixel footer-pixel--tree footer-pixel--tree-right" />
        </div>
      </footer>
    </main>
  );
}
