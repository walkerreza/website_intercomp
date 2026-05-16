import { Crown, Eye, Lock, UserPlus } from "lucide-react";

export function WorkspaceRulesPanel() {
  return (
    <article className="sync-panel">
      <div className="sync-panel-heading">
        <h2>REWARD RULE</h2>
      </div>
      <div className="sync-rule-list">
        <span><Eye size={17} /> Owner task: visible to all invited users.</span>
        <span><Lock size={17} /> Invited task: visible only to owner and creator.</span>
        <span><UserPlus size={17} /> Invite masuk sebagai pending sampai user menerima undangan.</span>
        <span><Crown size={17} /> Owner gets 1.6x XP and 1.35x coins on completed quests.</span>
      </div>
    </article>
  );
}

