import { QuestCardContent } from "./QuestCardContent.jsx";

export function QuestColumn({
  activeMission,
  column,
  dragState,
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
          }`}
          data-quest-card-id={card.id}
          key={card.id}
          onDragStart={(event) => event.preventDefault()}
          onPointerCancel={onCardPointerCancel}
          onPointerDown={(event) => onCardPointerDown(event, column.id, card)}
          onPointerMove={onCardPointerMove}
          onPointerUp={onCardPointerEnd}
        >
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
