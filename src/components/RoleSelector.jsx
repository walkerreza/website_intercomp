import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { roles } from "../data/roles.js";

export function RoleSelector({ selectedRole, onSelectRole }) {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const activeRole = roles.find((role) => role.id === selectedRole) ?? roles[0];
  const ActiveIcon = activeRole.icon;

  function handleMobileRoleSelect(roleId) {
    onSelectRole(roleId);
    setIsRoleMenuOpen(false);
  }

  return (
    <fieldset className="role-selector">
      <legend>Pilih role karakter</legend>

      <div className="role-select">
        <button
          className={`role-select__trigger${isRoleMenuOpen ? " is-open" : ""}`}
          onClick={() => setIsRoleMenuOpen((current) => !current)}
          type="button"
          aria-expanded={isRoleMenuOpen}
          aria-controls="mobile-role-menu"
        >
          <span
            className="role-select__icon"
            style={{ "--role-accent": activeRole.accent }}
          >
            <ActiveIcon size={18} />
          </span>
          <span className="role-select__text">
            <strong>{activeRole.name}</strong>
            <small>Class aktif</small>
          </span>
          <ChevronDown size={18} />
        </button>
        <p>{activeRole.description}</p>

        {isRoleMenuOpen && (
          <div className="role-select__menu" id="mobile-role-menu">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <button
                  className={`role-select__option${
                    isSelected ? " is-selected" : ""
                  }`}
                  key={role.id}
                  onClick={() => handleMobileRoleSelect(role.id)}
                  style={{ "--role-accent": role.accent }}
                  type="button"
                >
                  <span className="role-select__option-icon">
                    <Icon size={17} />
                  </span>
                  <span>
                    <strong>{role.name}</strong>
                    <small>{role.description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="role-grid">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <button
              className={`role-card${isSelected ? " is-selected" : ""}`}
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              style={{ "--role-accent": role.accent }}
              type="button"
              aria-pressed={isSelected}
            >
              <span className="role-card__icon">
                <Icon size={18} />
              </span>
              <span>
                <strong>{role.name}</strong>
                <small>{role.description}</small>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
