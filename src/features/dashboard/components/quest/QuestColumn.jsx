import { useState } from "react";
import { GripVertical } from "lucide-react";
import { QuestCardContent } from "./QuestCardContent.jsx";

export function QuestColumn({
  activeMission,
  column,
  dragState,
  isPositionEditMode,
  onCardPointerCancel,
  onCardPointerDown,
  onCardPointerEnd,
  onCardPointerMove,
  onChecklistToggle,
  onCompleteMission,
  onEditQuest,
  onOpenQuestDetail,
  onStartMission,
}) {
  const [expandedCardIds, setExpandedCardIds] = useState(() => new Set());

  function handleCardToggle(cardId) {
    if (isPositionEditMode) return;

    setExpandedCardIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(cardId)) {
        nextIds.delete(cardId);
      } else {
        nextIds.add(cardId);
      }

      return nextIds;
    });
  }

  return (
    <div
      className={`sync-quest-column ${
        dragState?.overColumnId === column.id ? "is-drop-target" : ""
      }`}
      data-quest-column-id={column.id}
    >
      <header>
        <span>{column.title}</span>
        <strong>{column.cards.length}</strong>
      </header>
      {column.cards.map((card) => (
        <article
          className={`sync-quest-card sync-quest-card--${card.accent} ${
            dragState?.cardId === card.id ? "is-dragging" : ""
          } ${isPositionEditMode ? "is-position-editable" : ""} ${
            expandedCardIds.has(card.id) ? "is-expanded" : ""
          }`}
          data-quest-card-id={card.id}
          key={card.id}
          onClick={() => handleCardToggle(card.id)}
          onDragStart={(event) => event.preventDefault()}
        >
          {isPositionEditMode && (
            <button
              aria-label={`Drag ${card.title}`}
              className="sync-card-drag-handle"
              data-drag-handle="true"
              onPointerCancel={onCardPointerCancel}
              onPointerDown={(event) => onCardPointerDown(event, column.id, card)}
              onPointerMove={onCardPointerMove}
              onPointerUp={onCardPointerEnd}
              type="button"
            >
              <GripVertical size={15} />
              Drag
            </button>
          )}
          <QuestCardContent
            activeMission={activeMission}
            card={card}
            columnId={column.id}
            onEditQuest={onEditQuest}
            onChecklistToggle={onChecklistToggle}
            onCompleteMission={onCompleteMission}
            onStartMission={onStartMission}
            onOpenQuestDetail={onOpenQuestDetail}
          />
        </article>
      ))}
    </div>
  );
}
