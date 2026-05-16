import { Eye, Lock, UserPlus } from "lucide-react";

export function InviteMemberPanel({
  cleanedInviteQuery,
  existingWorkspaceMember,
  inviteQuery,
  isAlreadyMember,
  matchedUser,
  matchedUserRole,
  onInviteQueryChange,
  onSubmit,
}) {
  return (
    <article className="sync-panel">
      <div className="sync-panel-heading">
        <h2>INVITE USER</h2>
        <span>SEARCH REGISTERED ACCOUNT</span>
      </div>
      <form className="sync-inline-form" onSubmit={onSubmit}>
        <label className="sync-form-field">
          <span>User Name</span>
          <input
            onChange={(event) => onInviteQueryChange(event.target.value)}
            placeholder="Cari username atau email akun"
            required
            type="text"
            value={inviteQuery}
          />
        </label>

        {matchedUser && (
          <div className="sync-found-user-card">
            <strong>{matchedUser.username.slice(0, 2).toUpperCase()}</strong>
            <span>
              {matchedUser.username}
              <small>
                {matchedUserRole
                  ? `${matchedUser.accountId} | ${matchedUserRole.name}`
                  : "Akun ini belum memilih role"}
              </small>
            </span>
          </div>
        )}

        {!matchedUser && cleanedInviteQuery && (
          <div className="sync-visibility-note">
            <Lock size={16} />
            Akun tidak ditemukan. User harus register/login dan memilih role dulu.
          </div>
        )}

        {isAlreadyMember && (
          <div className="sync-visibility-note">
            <Eye size={16} />
            {existingWorkspaceMember?.status === "Menunggu persetujuan"
              ? "Undangan untuk user ini masih menunggu persetujuan."
              : "User ini sudah menjadi member workspace."}
          </div>
        )}

        <button
          className="sync-composer-submit"
          disabled={!matchedUser || isAlreadyMember || !matchedUserRole}
          type="submit"
        >
          <UserPlus size={17} />
          Invite Member
        </button>
      </form>
    </article>
  );
}

