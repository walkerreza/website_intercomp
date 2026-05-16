export function WorkspaceMembersPanel({
  members,
  onViewerChange,
  viewerId,
  visibleQuestCount,
}) {
  return (
    <article className="sync-panel sync-panel--wide">
      <div className="sync-panel-heading">
        <h2>WORKSPACE MEMBERS</h2>
        <span>VISIBLE QUESTS: {visibleQuestCount}</span>
      </div>
      <div className="sync-workspace-members">
        {members.map((member) => (
          <article
            className={viewerId === member.id ? "is-selected" : ""}
            key={member.id}
          >
            <button onClick={() => onViewerChange(member.id)} type="button">
              <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
              <span>
                {member.name}
                <small>{member.workspaceRole} | {member.role}</small>
                <em>{member.status ?? "Active"}</em>
              </span>
            </button>
          </article>
        ))}
      </div>
    </article>
  );
}

