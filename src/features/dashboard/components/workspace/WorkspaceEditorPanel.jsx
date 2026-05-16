import { Briefcase, Crown } from "lucide-react";

export function WorkspaceEditorPanel({
  accountId,
  activeMemberCount,
  onSubmit,
  owner,
  pendingMemberCount,
  setWorkspaceName,
  workspaceName,
}) {
  return (
    <article className="sync-panel">
      <div className="sync-panel-heading">
        <h2>CREATE WORKSPACE</h2>
        <span>{activeMemberCount} ACTIVE | {pendingMemberCount} PENDING</span>
      </div>
      <form className="sync-inline-form" onSubmit={onSubmit}>
        <label className="sync-form-field">
          <span>Workspace Name</span>
          <input
            onChange={(event) => setWorkspaceName(event.target.value)}
            value={workspaceName}
            type="text"
          />
        </label>
        <button className="sync-composer-submit" type="submit">
          <Briefcase size={17} />
          Save Workspace
        </button>
      </form>
      <div className="sync-workspace-owner">
        <Crown size={20} />
        <span>
          Owner: <strong>{owner?.name ?? accountId}</strong>
        </span>
      </div>
    </article>
  );
}

