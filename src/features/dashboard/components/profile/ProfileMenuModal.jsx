import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FriendSearchPanel } from "./FriendSearchPanel.jsx";
import { ProfileAccountForms } from "./ProfileAccountForms.jsx";
import { ProfileSummary } from "./ProfileSummary.jsx";

export function ProfileMenuModal({
  gold,
  onAddFriend,
  onChangeName,
  onChangePassword,
  onClose,
  onDeleteAccount,
  onSearchFriend,
  profile,
  profileError,
  profileMessage,
}) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [password, setPassword] = useState("");
  const [friendQuery, setFriendQuery] = useState("");
  const [friendResults, setFriendResults] = useState([]);
  const [isSearchingFriend, setIsSearchingFriend] = useState(false);
  const [hasSearchedFriend, setHasSearchedFriend] = useState(false);
  const [addingFriendIds, setAddingFriendIds] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const searchRequestIdRef = useRef(0);
  const lastSearchedQueryRef = useRef("");

  function handleNameSubmit(event) {
    event.preventDefault();
    onChangeName(username);
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    onChangePassword(password);
    setPassword("");
  }

  async function runFriendSearch(query, { force = false } = {}) {
    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      searchRequestIdRef.current += 1;
      lastSearchedQueryRef.current = "";
      setFriendResults([]);
      setIsSearchingFriend(false);
      setHasSearchedFriend(false);
      return;
    }

    if (!force && cleanedQuery === lastSearchedQueryRef.current) return;

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    lastSearchedQueryRef.current = cleanedQuery;
    setHasSearchedFriend(true);
    setIsSearchingFriend(true);

    try {
      const results = await onSearchFriend(cleanedQuery);

      if (searchRequestIdRef.current === requestId) {
        setFriendResults(results);
      }
    } finally {
      if (searchRequestIdRef.current === requestId) {
        setIsSearchingFriend(false);
      }
    }
  }

  async function handleFriendSubmit(event) {
    event.preventDefault();
    await runFriendSearch(friendQuery, { force: true });
  }

  async function handleAddFriendDebounced(userId) {
    if (addingFriendIds.includes(userId)) return;

    setAddingFriendIds((ids) => [...ids, userId]);

    try {
      await onAddFriend(userId);
      setFriendResults((results) =>
        results.map((friend) =>
          friend.user_id === userId ? { ...friend, is_friend: true } : friend,
        ),
      );
    } finally {
      window.setTimeout(() => {
        setAddingFriendIds((ids) => ids.filter((id) => id !== userId));
      }, 700);
    }
  }

  function handleDeleteSubmit(event) {
    event.preventDefault();
    onDeleteAccount(deleteConfirmation);
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="sync-modal-backdrop"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <section
        aria-label="Profile menu"
        aria-modal="true"
        className="sync-profile-modal"
        role="dialog"
      >
        <header className="sync-profile-modal__header">
          <div>
            <span>PLAYER PROFILE</span>
            <h2>{profile.username || "Player"}</h2>
          </div>
          <button aria-label="Tutup profile" onClick={onClose} type="button">
            <ChevronDown size={18} />
          </button>
        </header>

        <ProfileSummary gold={gold} profile={profile} />

        {(profileMessage || profileError) && (
          <p className={profileError ? "sync-profile-alert is-error" : "sync-profile-alert"}>
            {profileError || profileMessage}
          </p>
        )}

        <div className="sync-profile-grid sync-profile-grid--split">
          <ProfileAccountForms
            deleteConfirmation={deleteConfirmation}
            onDeleteConfirmationChange={setDeleteConfirmation}
            onDeleteSubmit={handleDeleteSubmit}
            onNameSubmit={handleNameSubmit}
            onPasswordChange={setPassword}
            onPasswordSubmit={handlePasswordSubmit}
            onUsernameChange={setUsername}
            password={password}
            profile={profile}
            username={username}
          />

          <FriendSearchPanel
            addingFriendIds={addingFriendIds}
            friendQuery={friendQuery}
            friendResults={friendResults}
            hasSearchedFriend={hasSearchedFriend}
            isSearchingFriend={isSearchingFriend}
            onAddFriend={handleAddFriendDebounced}
            onFriendQueryChange={setFriendQuery}
            onFriendSearchSubmit={handleFriendSubmit}
          />
        </div>
      </section>
    </div>
  );
}
