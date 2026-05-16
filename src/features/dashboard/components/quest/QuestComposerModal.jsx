import { useState } from "react";
import { Activity, Eye, Lock, MessageSquare, Pencil, Plus, X } from "lucide-react";
import { roles } from "../../../../data/roles.js";
import { questLabelOptions } from "../../config/dashboardConfig.js";

export function QuestComposerModal({
  initialQuest,
  mode = "create",
  onClose,
  onCreate,
  onUpdate,
  workspaceState,
}) {
  const isEditMode = mode === "edit";
  const [selectedMembers, setSelectedMembers] = useState(
    initialQuest?.members ?? [],
  );
  const [comment, setComment] = useState("");
  const initialChecklist = (initialQuest?.checklist ?? [])
    .map((item) => item.text)
    .join("\n");
  const initialLabel = initialQuest?.label ?? "study";
  const initialCreatorId = initialQuest?.creatorId ?? workspaceState.ownerId;
  const initialAssignedRoleId =
    initialQuest?.assignedRoleId ??
    workspaceState.members.find((member) => member.id === initialCreatorId)?.roleId ??
    "healer";
  const [creatorId, setCreatorId] = useState(initialCreatorId);
  const activeWorkspaceMembers = workspaceState.members.filter(
    (member) => member.status === "Active" || member.workspaceRole === "Owner",
  );
  const selectedCreator =
    activeWorkspaceMembers.find((member) => member.id === creatorId) ??
    activeWorkspaceMembers[0];

  function handleMemberToggle(memberName) {
    setSelectedMembers((currentMembers) =>
      currentMembers.includes(memberName)
        ? currentMembers.filter((name) => name !== memberName)
        : [...currentMembers, memberName],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const checklist = formData
      .get("checklist")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const questPayload = {
      id: initialQuest?.id,
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      label: formData.get("label"),
      creatorId: formData.get("creatorId"),
      assignedRoleId: formData.get("assignedRoleId"),
      deadline: formData.get("deadline"),
      difficulty: formData.get("difficulty"),
      checklist,
      members: selectedMembers,
      comment: comment.trim(),
    };

    if (isEditMode) {
      onUpdate(questPayload);
      return;
    }

    onCreate(questPayload);
  }

  return (
    <div className="sync-modal-backdrop" role="presentation">
      <section
        aria-label={isEditMode ? "Edit quest" : "Tambah quest baru"}
        aria-modal="true"
        className="sync-card-composer"
        role="dialog"
      >
        <header className="sync-composer-header">
          <div>
            <span>{isEditMode ? "EDIT QUEST CARD" : "NEW QUEST CARD"}</span>
            <h2>{isEditMode ? "Update Mission Brief" : "Create Mission Brief"}</h2>
          </div>
          <button aria-label="Tutup form tambah quest" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <form className="sync-composer-body" onSubmit={handleSubmit}>
          <div className="sync-composer-main">
            <label className="sync-form-field">
              <span>Title</span>
              <input
                autoFocus
                defaultValue={initialQuest?.title ?? ""}
                name="title"
                placeholder="Contoh: Review materi UTS basis data"
                required
                type="text"
              />
            </label>

            <label className="sync-form-field">
              <span>Description</span>
              <textarea
                name="description"
                defaultValue={initialQuest?.description ?? ""}
                placeholder="Tulis detail tugas, deadline, atau catatan penting."
                required
                rows={4}
              />
            </label>

            <label className="sync-form-field">
              <span>Label</span>
              <select defaultValue={initialLabel} name="label">
                {questLabelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.reward}
                  </option>
                ))}
              </select>
            </label>

            <div className="sync-form-split">
              <label className="sync-form-field">
                <span>Deadline (DDL)</span>
                <input type="date" name="deadline" defaultValue={initialQuest?.deadline ?? ""} required />
              </label>

              <label className="sync-form-field">
                <span>Tingkat Kesulitan</span>
                <select defaultValue={initialQuest?.difficulty ?? "C-Rank"} name="difficulty">
                  <option value="E-Rank">E-Rank (Sangat Mudah)</option>
                  <option value="D-Rank">D-Rank (Mudah)</option>
                  <option value="C-Rank">C-Rank (Normal)</option>
                  <option value="B-Rank">B-Rank (Sulit)</option>
                  <option value="A-Rank">A-Rank (Sangat Sulit)</option>
                  <option value="S-Rank">S-Rank (Legendaris)</option>
                </select>
              </label>
            </div>

            <div className="sync-form-split">
              <label className="sync-form-field">
                <span>Creator</span>
                <select
                  defaultValue={initialCreatorId}
                  name="creatorId"
                  onChange={(event) => setCreatorId(event.target.value)}
                >
                  {activeWorkspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.workspaceRole}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sync-form-field">
                <span>Target Role</span>
                <select defaultValue={initialAssignedRoleId} name="assignedRoleId">
                  {roles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="sync-visibility-note">
              {selectedCreator?.id === workspaceState.ownerId ? (
                <>
                  <Eye size={16} />
                  Task dari owner akan terlihat oleh semua user di workspace.
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Task dari invited user hanya terlihat oleh owner dan creator task.
                </>
              )}
            </div>

            <label className="sync-form-field">
              <span>Checklist</span>
              <textarea
                name="checklist"
                defaultValue={initialChecklist}
                placeholder={"Baca modul 1\nKerjakan latihan\nUpload catatan"}
                rows={4}
              />
            </label>

            <div className="sync-form-field">
              <span>Members</span>
              <div className="sync-member-picker">
                {activeWorkspaceMembers.map((member) => (
                  <button
                    className={selectedMembers.includes(member.name) ? "is-selected" : ""}
                    key={member.name}
                    onClick={() => handleMemberToggle(member.name)}
                    type="button"
                  >
                    <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="sync-composer-side">
            <div>
              <h3>
                <MessageSquare size={17} />
                Comment
              </h3>
              <textarea
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tambahkan komentar awal untuk card ini."
                rows={5}
                value={comment}
              />
            </div>

            <div>
              <h3>
                <Activity size={17} />
                Activity
              </h3>
              <ul>
                <li>
                  {isEditMode
                    ? "Perubahan akan disimpan ke card ini."
                    : "Card akan dibuat di Available Quests."}
                </li>
                {selectedMembers.length > 0 && (
                  <li>{selectedMembers.length} member siap ditugaskan.</li>
                )}
                {comment && (
                  <li>
                    {isEditMode
                      ? "Komentar baru akan ditambahkan."
                      : "Komentar awal akan disimpan."}
                  </li>
                )}
                {initialQuest?.activity?.slice(0, 3).map((activityItem) => (
                  <li key={activityItem}>{activityItem}</li>
                ))}
              </ul>
            </div>

            <div className="sync-composer-actions">
              <button className="sync-composer-submit" type="submit">
                {isEditMode ? <Pencil size={17} /> : <Plus size={17} />}
                {isEditMode ? "Save Quest" : "Add Card"}
              </button>
              <button className="sync-composer-cancel" onClick={onClose} type="button">
                Cancel
              </button>
            </div>
          </aside>
        </form>
      </section>
    </div>
  );
}

