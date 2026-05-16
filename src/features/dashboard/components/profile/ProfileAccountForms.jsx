import { KeyRound, Trash2, User } from "lucide-react";

export function ProfileAccountForms({
  deleteConfirmation,
  onDeleteConfirmationChange,
  onDeleteSubmit,
  onNameSubmit,
  onPasswordSubmit,
  onPasswordChange,
  onUsernameChange,
  password,
  profile,
  username,
}) {
  return (
    <div className="sync-profile-stack">
      <form className="sync-profile-form" onSubmit={onNameSubmit}>
        <h3>
          <User size={17} />
          Ubah Nama
        </h3>
        <label>
          <span>Nama baru</span>
          <input
            onChange={(event) => onUsernameChange(event.target.value)}
            type="text"
            value={username}
          />
        </label>
        <button type="submit">Save Name</button>
      </form>

      <form className="sync-profile-form" onSubmit={onPasswordSubmit}>
        <h3>
          <KeyRound size={17} />
          Ubah Password
        </h3>
        <label>
          <span>Password baru</span>
          <input
            disabled={!profile.canChangePassword}
            minLength={6}
            onChange={(event) => onPasswordChange(event.target.value)}
            type="password"
            value={password}
          />
        </label>
        {!profile.canChangePassword && (
          <small className="sync-profile-help">
            Akun Google Auth tidak bisa mengubah password manual di sini.
          </small>
        )}
        <button disabled={!profile.canChangePassword} type="submit">
          Update Password
        </button>
      </form>

      <form className="sync-profile-form sync-profile-form--danger" onSubmit={onDeleteSubmit}>
        <h3>
          <Trash2 size={17} />
          Hapus Akun
        </h3>
        <label>
          <span>Ketik User ID kamu</span>
          <input
            onChange={(event) => onDeleteConfirmationChange(event.target.value)}
            placeholder={profile.id || "User ID"}
            type="text"
            value={deleteConfirmation}
          />
        </label>
        <button type="submit">Delete Account</button>
      </form>
    </div>
  );
}

