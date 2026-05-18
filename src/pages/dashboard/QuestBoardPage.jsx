import { useEffect, useState } from "react";
import { Archive, GripVertical, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { getWorkspaceCoverImageSrc } from "../../data/workspaceCovers.js";
import { QuestColumn } from "../../features/dashboard/components/quest/QuestColumn.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

export function QuestBoardPage({
  canDeleteWorkspace,
  activeMission,
  columns,
  dragState,
  isPositionEditMode,
  onOpenComposer,
  onCardPointerCancel,
  onCardPointerDown,
  onCardPointerEnd,
  onCardPointerMove,
  onChecklistToggle,
  onCompleteMission,
  onDeleteWorkspace,
  onEditQuest,
  onArchiveQuest,
  onFilterChange,
  onOpenQuestDetail,
  onResetFilters,
  onStartMission,
  onTogglePositionEditMode,
  questFilters,
  workspaceState,
  workspaceViewer,
}) {
  const [searchInput, setSearchInput] = useState(questFilters.search);
  const debouncedSearchInput = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    setSearchInput(questFilters.search);
  }, [questFilters.search]);

  useEffect(() => {
    if (debouncedSearchInput !== questFilters.search) {
      onFilterChange("search", debouncedSearchInput);
    }
  }, [debouncedSearchInput, onFilterChange, questFilters.search]);

  return (
    <>
      <div className="sync-section-title">
        <div className="sync-board-title-with-cover">
          <span
            className="workspace-cover-preview workspace-cover-preview--header"
          >
            <img
              alt=""
              src={getWorkspaceCoverImageSrc(
                workspaceState.type === "clan" ? "clan" : "solo",
                workspaceState.coverKey,
              )}
            />
          </span>
          <div>
            <h1>ACTIVE QUESTS</h1>
            <span>
              {workspaceState.name} | VIEW AS: {workspaceViewer?.name ?? "Owner"}
            </span>
          </div>
        </div>
        <div className="sync-section-actions">
          <button onClick={onOpenComposer} type="button">
            <Plus size={16} />
            New Mission
          </button>
          <button
            className={isPositionEditMode ? "is-active" : ""}
            onClick={onTogglePositionEditMode}
            type="button"
          >
            <GripVertical size={16} />
            {isPositionEditMode ? "Done Sorting" : "Sunting Posisi"}
          </button>
          {canDeleteWorkspace ? (
            <button className="is-danger" onClick={onDeleteWorkspace} type="button">
              <Trash2 size={16} />
              Delete Workspace
            </button>
          ) : null}
        </div>
      </div>

      <section className="sync-board-filter-bar" aria-label="Quest filters">
        <label>
          <Search size={15} />
          <input
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search quest"
            type="search"
            value={searchInput}
          />
        </label>
        <select
          onChange={(event) => onFilterChange("member", event.target.value)}
          value={questFilters.member}
        >
          <option value="">All members</option>
          {(workspaceState.members ?? []).map((member) => (
            <option key={member.id} value={member.name}>{member.name}</option>
          ))}
        </select>
        <select
          onChange={(event) => onFilterChange("difficulty", event.target.value)}
          value={questFilters.difficulty}
        >
          <option value="">All ranks</option>
          {["S-Rank", "A-Rank", "B-Rank", "C-Rank", "D-Rank", "E-Rank"].map((rank) => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>
        <select
          onChange={(event) => onFilterChange("dueStatus", event.target.value)}
          value={questFilters.dueStatus}
        >
          <option value="">Any deadline</option>
          <option value="overdue">Overdue</option>
          <option value="soon">Under 2h</option>
          <option value="today">Today</option>
          <option value="none">No deadline</option>
        </select>
        <select
          onChange={(event) => onFilterChange("label", event.target.value)}
          value={questFilters.label}
        >
          <option value="">All labels</option>
          <option value="bounty">Bounty</option>
          <option value="study">Study</option>
          <option value="daily">Daily</option>
          <option value="guild">Guild</option>
        </select>
        <button onClick={onResetFilters} type="button">
          <RotateCcw size={15} />
          Reset
        </button>
      </section>

      <section className="sync-quest-board">
        {columns.map((column) => (
          <QuestColumn
            activeMission={activeMission}
            column={column}
            dragState={dragState}
            isPositionEditMode={isPositionEditMode}
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
            renderColumnAction={
              column.id === "done" && column.cards.length
                ? (card) => (
                    <button
                      className="sync-card-archive-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onArchiveQuest(card);
                      }}
                      type="button"
                    >
                      <Archive size={14} />
                      Archive
                    </button>
                  )
                : null
            }
          />
        ))}
      </section>
    </>
  );
}
