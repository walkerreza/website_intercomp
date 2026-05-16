import { UserPlus } from "lucide-react";

export function FriendSearchPanel({
  friendQuery,
  friendResults,
  isSearchingFriend,
  onAddFriend,
  onFriendQueryChange,
  onFriendSearchSubmit,
}) {
  return (
    <form className="sync-profile-form sync-profile-form--friend" onSubmit={onFriendSearchSubmit}>
      <h3>
        <UserPlus size={17} />
        Add Teman
      </h3>
      <label>
        <span>Search UUID Supabase atau Username</span>
        <input
          onChange={(event) => onFriendQueryChange(event.target.value)}
          placeholder="Contoh: 7f... atau username"
          type="text"
          value={friendQuery}
        />
      </label>
      <button type="submit">{isSearchingFriend ? "Searching..." : "Search User"}</button>
      <div className="sync-profile-friend-results">
        {friendResults.map((friend) => (
          <article key={friend.user_id}>
            <div>
              <strong>{friend.username}</strong>
              <span>{friend.user_id}</span>
              <small>{friend.email || "-"}</small>
            </div>
            <button
              disabled={friend.is_friend}
              onClick={() => onAddFriend(friend.user_id)}
              type="button"
            >
              {friend.is_friend ? "Added" : "Add"}
            </button>
          </article>
        ))}
        {!friendResults.length && friendQuery && !isSearchingFriend && (
          <small className="sync-profile-help">Search dulu untuk menampilkan user.</small>
        )}
      </div>
    </form>
  );
}

