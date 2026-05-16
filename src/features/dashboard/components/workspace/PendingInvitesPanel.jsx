import { Eye, UserCheck, UserX } from "lucide-react";

export function PendingInvitesPanel({ onApproveMember, onRejectMember, pendingMembers }) {
  return (
    <article className="sync-panel">
      <div className="sync-panel-heading">
        <h2>PENDING INVITATIONS</h2>
        <span>{pendingMembers.length} WAITING</span>
      </div>
      <div className="sync-pending-invites">
        {pendingMembers.length ? (
          pendingMembers.map((member) => (
            <article key={member.id}>
              <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
              <span>
                {member.name}
                <small>{member.role} | Menunggu persetujuan</small>
              </span>
              <div className="sync-pending-actions">
                <button onClick={() => onApproveMember(member.id)} type="button">
                  <UserCheck size={15} />
                  Approve
                </button>
                <button onClick={() => onRejectMember(member.id)} type="button">
                  <UserX size={15} />
                  Reject
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="sync-visibility-note">
            <Eye size={16} />
            Belum ada undangan yang menunggu persetujuan.
          </div>
        )}
      </div>
    </article>
  );
}
