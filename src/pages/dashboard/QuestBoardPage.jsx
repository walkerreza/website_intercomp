import { Plus, Trash2 } from "lucide-react";
import { QuestColumn } from "../../features/dashboard/components/quest/QuestColumn.jsx";

export function QuestBoardPage({
  canDeleteWorkspace,
  activeMission,
  columns,
  dragState,
  onOpenComposer,
  onCardPointerCancel,
  onCardPointerDown,
  onCardPointerEnd,
  onCardPointerMove,
  onChecklistToggle,
  onCompleteMission,
  onDeleteWorkspace,
  onEditQuest,
  onOpenQuestDetail,
  onStartMission,
  workspaceState,
  workspaceViewer,
}) {
  return (
    <>
      <div className="sync-section-title">
        <div>
          <h1>ACTIVE QUESTS</h1>
          <span>
            {workspaceState.name} | VIEW AS: {workspaceViewer?.name ?? "Owner"}
          </span>
        </div>
        <div className="sync-section-actions">
          <button onClick={onOpenComposer} type="button">
            <Plus size={16} />
            New Mission
          </button>
          {canDeleteWorkspace ? (
            <button className="is-danger" onClick={onDeleteWorkspace} type="button">
              <Trash2 size={16} />
              Delete Workspace
            </button>
          ) : null}
        </div>
      </div>

      <section className="sync-quest-board">
        {columns.map((column) => (
          <QuestColumn
            activeMission={activeMission}
            column={column}
            dragState={dragState}
            key={column.id}
            onCardPointerCancel={onCardPointerCancel}
            onCardPointerDown={onCardPointerDown}
            onCardPointerEnd={onCardPointerEnd}
            onCardPointerMove={onCardPointerMove}
            onChecklistToggle={onChecklistToggle}
            onCompleteMission={onCompleteMission}
            onEditQuest={onEditQuest}
            onOpenQuestDetail={onOpenQuestDetail}
            onStartMission={onStartMission}
          />
        ))}
      </section>
    </>
  );
}
