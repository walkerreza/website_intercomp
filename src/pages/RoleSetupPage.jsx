import { useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { BrandPanel } from "../components/BrandPanel.jsx";
import { CharacterSprite } from "../components/CharacterSprite.jsx";
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
          <div className="auth-card__header">
            <p className="eyebrow">First Login Setup</p>
            <h2>
              {step === "select" ? "Pilih class pertamamu" : "Preview karakter"}
            </h2>
            <p>
              {step === "select"
                ? "Pilih role yang paling cocok dengan gaya produktivitasmu."
                : "Cek dulu tampilan awal karaktermu. Kalau belum cocok, kamu masih bisa ganti role."}
            </p>
          </div>

          <div className="locked-note">
            <LockKeyhole size={18} />
            <span>Role baru terkunci setelah kamu konfirmasi di halaman preview.</span>
          </div>

          {step === "select" ? (
            <RoleSelector
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
            />
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
            <button className="primary-button" type="submit">
              {step === "select" ? "Lihat karakter" : "Kunci role ini"}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
