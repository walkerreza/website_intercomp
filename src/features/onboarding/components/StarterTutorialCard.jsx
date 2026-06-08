import { HelpCircle, X } from "lucide-react";
import { starterOnboardingSteps } from "../onboardingSteps.js";

function getGuideCopy(step) {
  if (!step) {
    return "Semua fitur dasar sudah dikenalkan. Kamu bisa membuka panduan ini lagi dari tombol Panduan di sidebar.";
  }

  return step.description;
}

export function StarterTutorialCard({
  isOpen = true,
  nextStep,
  onClose,
  onDismiss,
  onOpen,
  onSkipStep,
  onStepAction,
  progress,
  variant = "panel",
}) {
  const completedSteps = new Set(progress.completedSteps ?? []);
  const completedCount = completedSteps.size;
  const totalSteps = starterOnboardingSteps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  if (variant === "button") {
    return (
      <button className="sync-tutorial-help-button" onClick={onOpen} type="button">
        <HelpCircle size={16} />
        Panduan
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="sync-tutorial-popup" role="presentation">
      <aside className="sync-tutorial-card" aria-label="Panduan awal Questify" role="dialog" aria-modal="false">
      <header>
        <div>
          <span>PANDUAN</span>
          <h2>{nextStep?.title ?? "Panduan selesai"}</h2>
        </div>
        <button aria-label="Tutup panduan" onClick={onClose ?? onDismiss} type="button">
          <X size={16} />
        </button>
      </header>

      <p>{getGuideCopy(nextStep)}</p>

      <div className="sync-tutorial-progress" aria-label={`Progress tutorial ${progressPercent}%`}>
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="sync-tutorial-step-counter">
        <span>Step {Math.min(completedCount + 1, totalSteps)} / {totalSteps}</span>
        <strong>{progressPercent}%</strong>
      </div>

      <footer>
        <span>{completedCount}/{totalSteps} selesai</span>
        <div className="sync-tutorial-actions">
          {nextStep ? (
            <button className="is-primary" onClick={() => onStepAction(nextStep)} type="button">
              {nextStep.actionLabel}
            </button>
          ) : (
            <button className="is-primary" onClick={onClose ?? onDismiss} type="button">
              Tutup
            </button>
          )}
          <button
            className="is-skip"
            onClick={() => {
              if (nextStep) {
                onSkipStep?.(nextStep);
                return;
              }
              onDismiss?.();
            }}
            type="button"
          >
            Lewati step
          </button>
        </div>
      </footer>
    </aside>
    </div>
  );
}
