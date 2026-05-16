import {
  ChevronDown,
  Shield,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
} from "lucide-react";
import { CharacterSprite } from "../../../../components/CharacterSprite.jsx";

export function DashboardSidebar({
  activeView,
  characterState,
  dashboard,
  isCollapsed,
  isMobileMenuOpen,
  levelProgress,
  navItems,
  onLogout,
  onNavigate,
  onOpenProfile,
  onOpenSettings,
  onToggleCollapsed,
  onToggleMobileMenu,
  operatorName,
  role,
  roleIcon: RoleIcon,
}) {
  const safeLevelProgress = levelProgress ?? {
    currentXp: 0,
    level: 0,
    nextLevelXp: 100,
    progress: 0,
  };

  return (
    <aside className={`sync-sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
      <button
        aria-expanded={isMobileMenuOpen}
        className={`sync-mobile-menu-button ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={onToggleMobileMenu}
        type="button"
      >
        <span>
          <span className="sync-mobile-menu-icon">
            <RoleIcon size={18} />
          </span>
          <span>
            <strong>{operatorName}</strong>
            <small>{role.name} menu</small>
          </span>
        </span>
        <ChevronDown size={18} />
      </button>

      <div className={`sync-sidebar-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div className="sync-sidebar-desktop-tools">
          <button
            aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            onClick={onToggleCollapsed}
            type="button"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <section className="sync-operator-card">
          <div className="sync-avatar-frame">
            <CharacterSprite
              roleId={role.id}
              equipment={characterState.equipment}
            />
          </div>
          <div className="sync-sidebar-label">
            <div className="sync-operator-heading">
              <strong>{operatorName}</strong>
              <span className="sync-level-badge">
                <Shield size={13} />
                LV {safeLevelProgress.level}
              </span>
            </div>
            <span>{role.name}</span>
            <div className="sync-sidebar-xp">
              <div className="sync-sidebar-xp-copy">
                <small>XP</small>
                <small>{safeLevelProgress.currentXp}/{safeLevelProgress.nextLevelXp}</small>
              </div>
              <div className="sync-progress sync-progress--xp">
                <span style={{ width: `${safeLevelProgress.progress}%` }} />
              </div>
            </div>
            <small>{dashboard.codename} | {dashboard.classLine}</small>
          </div>
        </section>

        <nav className="sync-side-nav" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const NavIcon = item.icon;

            return (
              <button
                aria-label={item.label}
                className={activeView === item.id ? "is-active" : ""}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <NavIcon size={18} />
                <span className="sync-sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sync-sidebar-footer">
          <button type="button" onClick={onOpenProfile}>
            <User size={18} />
            <span className="sync-sidebar-label">Profile</span>
          </button>
          <button type="button" onClick={onOpenSettings}>
            <Settings size={18} />
            <span className="sync-sidebar-label">Settings</span>
          </button>
          <button onClick={onLogout} type="button">
            <LogOut size={18} />
            <span className="sync-sidebar-label">Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
