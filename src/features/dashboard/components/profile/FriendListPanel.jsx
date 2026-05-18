import { MessageCircle, Trash2, UsersRound } from "lucide-react";

export function FriendListPanel({
  deletingFriendIds = [],
  friends = [],
  onDeleteFriend,
  onOpenChat,
}) {
  return (
    <section className="sync-profile-form sync-profile-friend-list">
      <header className="sync-profile-panel-heading">
        <h3>
          <UsersRound size={17} />
          Friend List
        </h3>
        <span>{friends.length} accepted</span>
      </header>

      <div className="sync-profile-friend-list__items">
        {friends.map((friend) => {
          const isDeleting = deletingFriendIds.includes(friend.userId);
          const canChat = friend.status === "accepted";

          return (
            <article
              key={friend.friendshipId || friend.userId}
            >
              <div>
                <strong>{friend.username || "Unknown Player"}</strong>
                <span>{friend.userId}</span>
                <small>{friend.email || "No email"}</small>
              </div>
              <div className="sync-profile-friend-list__actions">
                <button
                  disabled={!canChat}
                  onClick={() => onOpenChat(friend)}
                  title={canChat ? "Open chat" : "Chat aktif setelah accepted"}
                  type="button"
                >
                  <MessageCircle size={15} />
                  Chat
                </button>
                <button
                  className="is-danger"
                  disabled={isDeleting}
                  onClick={() => onDeleteFriend(friend)}
                  type="button"
                >
                  <Trash2 size={15} />
                  {isDeleting ? "..." : "Del"}
                </button>
              </div>
            </article>
          );
        })}

        {!friends.length && (
          <small className="sync-profile-help">
            Belum ada teman. Search user lalu tekan Add untuk membuat koneksi.
          </small>
        )}
      </div>
    </section>
  );
}
