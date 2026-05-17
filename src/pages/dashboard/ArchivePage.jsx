import { ArchiveRestore, Trash2 } from "lucide-react";

export function ArchivePage({
  archivedQuests,
  isLoading,
  message,
  onDeleteQuest,
  onRestoreQuest,
  workspaceState,
}) {
  return (
    <>
      <div className="sync-section-title">
        <div>
          <h1>ARCHIVE VAULT</h1>
          <span>{workspaceState.name} | RESTORE OR PURGE OLD QUESTS</span>
        </div>
      </div>

      {message ? <div className="sync-visibility-note">{message}</div> : null}

      <section className="sync-archive-grid">
        {isLoading ? (
          <div className="sync-visibility-note">Memuat archived quest...</div>
        ) : archivedQuests.length ? (
          archivedQuests.map((quest) => (
            <article className="sync-archive-card" key={quest.id}>
              <div>
                <small>{quest.tag} | {quest.difficulty}</small>
                <strong>{quest.title}</strong>
                <span>{quest.description || "No brief."}</span>
                {quest.archivedAt ? (
                  <em>Archived {new Date(quest.archivedAt).toLocaleDateString("id-ID")}</em>
                ) : null}
              </div>
              <footer>
                <button onClick={() => onRestoreQuest(quest.id)} type="button">
                  <ArchiveRestore size={16} />
                  Restore
                </button>
                <button className="is-danger" onClick={() => onDeleteQuest(quest)} type="button">
                  <Trash2 size={16} />
                  Delete
                </button>
              </footer>
            </article>
          ))
        ) : (
          <div className="sync-visibility-note">Archive masih kosong.</div>
        )}
      </section>
    </>
  );
}
