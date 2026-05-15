import { useState } from "react";
import { roles } from "../data/roles.js";
import { ArrowLeft, LogOut } from "lucide-react";

export function SettingsPage({ currentRoleId, onRoleChange, onBack, onLogout }) {
  const [isLightMode, setIsLightMode] = useState(() => {
    return window.localStorage.getItem("questify:theme") === "light";
  });

  function toggleTheme() {
    const nextTheme = !isLightMode;
    setIsLightMode(nextTheme);
    if (nextTheme) {
      document.body.classList.add("light-theme");
      window.localStorage.setItem("questify:theme", "light");
    } else {
      document.body.classList.remove("light-theme");
      window.localStorage.setItem("questify:theme", "dark");
    }
  }

  return (
    <div className="sync-settings-page" style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto", minHeight: "100vh", animation: "fade-in 0.3s ease" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <button 
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1rem", opacity: 0.8, transition: "opacity 0.2s" }}
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <button 
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold" }}
        >
          <LogOut size={18} /> Log out
        </button>
      </header>
      
      <div className="sync-section-title" style={{ marginBottom: "2rem" }}>
        <div>
          <h1>SYSTEM SETTINGS</h1>
          <span>Configure Your Interface & Role</span>
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <section style={{ background: "rgba(255,255,255,0.03)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "#60a5fa", letterSpacing: "0.05em" }}>APPEARANCE</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong style={{ display: "block", fontSize: "1.1rem" }}>Theme Mode</strong>
              <small style={{ opacity: 0.7 }}>Switch between Cyberpunk Dark and Light mode interfaces.</small>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                background: isLightMode ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.1)",
                color: isLightMode ? "#000" : "#fff",
                border: isLightMode ? "none" : "1px solid rgba(255,255,255,0.2)",
                padding: "10px 24px",
                borderRadius: "20px",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                boxShadow: isLightMode ? "0 0 12px rgba(245,158,11,0.4)" : "none"
              }}
            >
              {isLightMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </section>

        <section style={{ background: "rgba(255,255,255,0.03)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "#60a5fa", letterSpacing: "0.05em" }}>CHARACTER PROFILE</h2>
          <p style={{ opacity: 0.7, marginBottom: "2rem", fontSize: "1rem" }}>Change your active role. This will immediately update your dashboard aesthetics and passive abilities.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {roles.map((r) => {
              const RoleIcon = r.icon;
              const isActive = r.id === currentRoleId;
              return (
                <button
                  key={r.id}
                  onClick={() => onRoleChange?.(r.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    padding: "2rem 1rem",
                    background: isActive ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))" : "rgba(0,0,0,0.3)",
                    border: isActive ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: isActive ? "#60a5fa" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <RoleIcon size={48} style={{ filter: isActive ? "drop-shadow(0 0 8px rgba(59,130,246,0.8))" : "none" }} />
                  <strong style={{ fontSize: "1.2rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{r.name}</strong>
                  {isActive && (
                    <span style={{ 
                      position: "absolute", 
                      top: "12px", 
                      right: "12px", 
                      fontSize: "0.75rem", 
                      background: "#3b82f6", 
                      color: "#000", 
                      padding: "4px 10px", 
                      borderRadius: "12px", 
                      fontWeight: 900 
                    }}>
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
