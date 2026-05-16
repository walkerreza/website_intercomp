import { useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { BrandPanel } from "../components/BrandPanel.jsx";
import { CharacterSprite } from "../components/CharacterSprite.jsx";
import { QuestifyLogo } from "../components/QuestifyLogo.jsx";
import { RoleSelector } from "../components/RoleSelector.jsx";
import { roles } from "../data/roles.js";

export function RoleSetupPage({ onComplete }) {
  const [selectedRole, setSelectedRole] = useState("healer");
  const [step, setStep] = useState("select");
  const role = roles.find((item) => item.id === selectedRole) ?? roles[0];
  const Icon = role.icon;

  function handleSubmit(event) {
    event.preventDefault();

    if (step === "select") {
      setStep("preview");
      return;
    }

    onComplete(selectedRole);
  }

  return (
    <main className="login-page role-setup-page">
      <BrandPanel />
      <section className="auth-shell" aria-label="Pilih role karakter">
        <form className="auth-card role-setup-card" onSubmit={handleSubmit}>
          <div className="role-setup-brand">
            <QuestifyLogo className="questify-logo--auth" />
            <span>Starter Class</span>
          </div>

          <div className="auth-card__header">
            <p className="eyebrow">First Login Setup</p>
            <h2>
              {step === "select" ? "Pilih class pertamamu" : "Cek petualangmu"}
            </h2>
            <p>
              {step === "select"
                ? "Tentukan gaya bermain produktivitasmu sebelum masuk guild board."
                : "Pastikan class awal ini sudah cocok sebelum kamu mulai mengerjakan quest."}
            </p>
          </div>

          <div className="locked-note">
            <LockKeyhole size={18} />
            <span>Class dikunci setelah kamu konfirmasi di preview.</span>
          </div>

          {step === "select" ? (
            <div className="role-setup-select-grid">
              <section className="role-preview-card role-preview-card--compact" aria-label="Class aktif">
                <div className="character-stage character-stage--preview">
                  <CharacterSprite roleId={role.id} />
                </div>
                <div className="role-preview-card__body">
                  <span className="role-chip" style={{ "--role-accent": role.accent }}>
                    <Icon size={16} />
                    {role.name}
                  </span>
                  <h3>{role.name}</h3>
                  <p>{role.description}</p>
                </div>
              </section>

              <RoleSelector
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            </div>
          ) : (
            <section className="role-preview-card" aria-label="Preview karakter">
              <div className="character-stage character-stage--preview">
                <CharacterSprite roleId={role.id} />
              </div>

              <div className="role-preview-card__body">
                <span className="role-chip" style={{ "--role-accent": role.accent }}>
                  <Icon size={16} />
                  {role.name}
                </span>
                <h3>Starter {role.name}</h3>
                <p>{role.description}</p>
              </div>
            </section>
          )}

          <div className="role-setup-actions">
            {step === "preview" && (
              <button
                className="ghost-button"
                onClick={() => setStep("select")}
                type="button"
              >
                <ArrowLeft size={18} />
                Ganti role
              </button>
            )}
            <button className="primary-button primary-button--login" type="submit">
              {step === "select" ? "Preview class" : "Mulai quest"}
              {step === "preview" ? <Sparkles size={18} /> : <ArrowRight size={18} />}
            </button>
            {step === "select" ? null : (
              <span className="role-setup-confirm-note">Kamu masih bisa mengatur profile setelah masuk dashboard.</span>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
