import { Bell, CheckCheck, Clock, Trash2, TriangleAlert, X } from "lucide-react";

function notificationIcon(type) {
  if (type === "overdue") return <TriangleAlert size={16} />;
  return <Clock size={16} />;
}

export function NotificationCenter({
  isOpen,
  notifications,
  onClearAll,
  onClose,
  onMarkAllRead,
  onOpenQuest,
  onToggle,
}) {
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="sync-notification-center">
      <button
        aria-label="Deadline notifications"
        className="sync-notification-trigger"
        onClick={onToggle}
        type="button"
      >
        <Bell size={17} />
        {unreadCount > 0 ? <span>{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <section className="sync-notification-popover" aria-label="Deadline notifications">
          <header>
            <div>
              <strong>Deadline Alerts</strong>
              <small>{unreadCount} unread</small>
            </div>
            <button aria-label="Close notifications" onClick={onClose} type="button">
              <X size={16} />
            </button>
          </header>

          <div className="sync-notification-actions">
            <button disabled={!unreadCount} onClick={onMarkAllRead} type="button">
              <CheckCheck size={15} />
              Mark read
            </button>
            <button
              className="is-danger"
              disabled={!notifications.length}
              onClick={onClearAll}
              type="button"
            >
              <Trash2 size={15} />
              Clear all
            </button>
          </div>

          <div className="sync-notification-list">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  className={notification.isRead ? "is-read" : ""}
                  key={notification.id}
                  onClick={() => onOpenQuest(notification.questId)}
                  type="button"
                >
                  {notificationIcon(notification.type)}
                  <span>
                    <strong>{notification.type.replace("_", " ")}</strong>
                    <small>{notification.message}</small>
                  </span>
                </button>
              ))
            ) : (
              <p>Belum ada deadline alert.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
