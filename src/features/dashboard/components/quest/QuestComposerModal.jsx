import { useState } from "react";
import { Activity, Eye, Lock, MessageSquare, Pencil, Plus, X } from "lucide-react";
import { roles } from "../../../../data/roles.js";
import { questLabelOptions } from "../../config/dashboardConfig.js";

const ALL_ROLE_VALUE = "";

export function QuestComposerModal({
  initialQuest,
  mode = "create",
  onClose,
  onCreate,
  onUpdate,
  workspaceState,
}) {
  const isEditMode = mode === "edit";
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    ALL_ROLE_VALUE;
  const [creatorId, setCreatorId] = useState(initialCreatorId);
  const [assignedRoleId, setAssignedRoleId] = useState(initialAssignedRoleId);
  const activeWorkspaceMembers = workspaceState.members.filter(
    (member) => member.status === "Active" || member.workspaceRole === "Owner",
  );
  const assignableMembers = assignedRoleId
    ? activeWorkspaceMembers.filter((member) => member.roleId === assignedRoleId)
    : activeWorkspaceMembers;
  const selectedCreator =
    activeWorkspaceMembers.find((member) => member.id === creatorId) ??
    activeWorkspaceMembers[0];

  function handleAssignedRoleChange(nextRoleId) {
    const nextAssignableNames = new Set(
      (nextRoleId
        ? activeWorkspaceMembers.filter((member) => member.roleId === nextRoleId)
        : activeWorkspaceMembers
      ).map((member) => member.name),
    );

    setAssignedRoleId(nextRoleId);
    setSelectedMembers((currentMembers) =>
      currentMembers.filter((memberName) => nextAssignableNames.has(memberName)),
    );
  }

  function handleMemberToggle(memberName) {
    setSelectedMembers((currentMembers) =>
      currentMembers.includes(memberName)
        ? currentMembers.filter((name) => name !== memberName)
        : [...currentMembers, memberName],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

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
      assignedRoleId: formData.get("assignedRoleId") || null,
      deadline: formData.get("deadline"),
      difficulty: formData.get("difficulty"),
      checklist,
      members: selectedMembers,
      comment: comment.trim(),
    };

    setIsSubmitting(true);
    if (isEditMode) {
      await Promise.resolve(onUpdate(questPayload));
      setIsSubmitting(false);
      return;
    }

    await Promise.resolve(onCreate(questPayload));
    setIsSubmitting(false);
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function formatActivityPreview(activityItem) {
    if (typeof activityItem === "string") return activityItem;
    return activityItem?.message ?? activityItem?.action ?? "Activity updated.";
  }

  return (
    <div
      className="sync-modal-backdrop"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
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
              <span>Quest Type / Reward Label</span>
              <select defaultValue={initialLabel} name="label">
                {questLabelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.reward}
                  </option>
                ))}
              </select>
              <small className="sync-form-help">
                Kategori quest untuk tag, warna card, dan reward default. Ini bukan hak akses owner/clan.
              </small>
            </label>

            <div className="sync-form-split">
              <label className="sync-form-field">
                <span>Deadline (DDL + Jam)</span>
                <input
                  type="datetime-local"
                  name="deadline"
                  defaultValue={initialQuest?.deadline ?? ""}
                  required
                />
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
                <span>Mission Creator</span>
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
                <span>Target Role / Class</span>
                <select
                  name="assignedRoleId"
                  onChange={(event) => handleAssignedRoleChange(event.target.value)}
                  value={assignedRoleId}
                >
                  <option value={ALL_ROLE_VALUE}>All Role</option>
                  {roles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <small className="sync-form-help">
                  Filter daftar Assigned Members berdasarkan class. Pilih All Role untuk menampilkan semua member.
                </small>
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
              <span>Assigned Members</span>
              <small className="sync-form-help">
                Pilih user yang benar-benar mendapat jatah pekerjaan pada quest ini.
              </small>
              <div className="sync-member-picker">
                {assignableMembers.map((member) => (
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
                {!assignableMembers.length && (
                  <small className="sync-form-help">
                    Belum ada member aktif dengan role ini.
                  </small>
                )}
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
                {initialQuest?.activity?.slice(0, 3).map((activityItem, index) => (
                  <li key={activityItem?.id ?? `${formatActivityPreview(activityItem)}-${index}`}>
                    {formatActivityPreview(activityItem)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sync-composer-actions">
              <button className="sync-composer-submit" disabled={isSubmitting} type="submit">
                {isEditMode ? <Pencil size={17} /> : <Plus size={17} />}
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Quest"
                    : "Add Card"}
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
