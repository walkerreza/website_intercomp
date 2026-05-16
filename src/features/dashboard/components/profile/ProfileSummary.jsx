import { Copy } from "lucide-react";

export function ProfileSummary({ profile }) {
  async function copyUserId() {
    await navigator.clipboard?.writeText(profile.id);
  }

  return (
    <div className="sync-profile-summary">
      <div>
        <span>User ID</span>
        <strong>{profile.id || "Local mode"}</strong>
      </div>
      <button disabled={!profile.id} onClick={copyUserId} type="button">
        <Copy size={16} />
        Copy
      </button>
      <div>
        <span>Email</span>
        <strong>{profile.email || "-"}</strong>
      </div>
      <div>
        <span>Friends</span>
        <strong>{profile.friendCount}</strong>
      </div>
    </div>
  );
}

