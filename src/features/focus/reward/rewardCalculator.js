/**
 * Generic reward calculation for any focus method.
 * Works universally for Pomodoro, Sprint, Deep Work, and future modes.
 */

/** Penalty multiplier when aborting early — user gets effort credit but not full reward */
const ABORT_PENALTY = 0.8;

/**
 * Calculate the XP earned for a fully completed session.
 * @param {number} baseXp - Base XP of the quest card
 * @param {number} methodMultiplier - Multiplier from the chosen work method
 * @param {number} ownerMultiplier - 1.6 for workspace owner, 1.0 for others
 * @returns {number} Final earned XP
 */
export function calculateFullXp(baseXp, methodMultiplier, ownerMultiplier = 1) {
  return Math.round(baseXp * methodMultiplier * ownerMultiplier);
}

/**
 * Calculate the XP earned when aborting a session mid-way.
 * Uses proportional reward based on time elapsed, with an abort penalty.
 *
 * @param {number} baseXp - Base XP of the quest card
 * @param {number} methodMultiplier - Multiplier from the chosen work method
 * @param {number} elapsedMs - Time elapsed in milliseconds
 * @param {number} totalMs - Total session duration in milliseconds
 * @param {number} ownerMultiplier - 1.6 for workspace owner, 1.0 for others
 * @returns {{ earnedXp: number, progressPercentage: number }}
 */
export function calculateAbortXp(baseXp, methodMultiplier, elapsedMs, totalMs, ownerMultiplier = 1) {
  const progressPercentage = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 0;
  const fullXp = calculateFullXp(baseXp, methodMultiplier, ownerMultiplier);
  const earnedXp = Math.round(fullXp * progressPercentage * ABORT_PENALTY);
  return { earnedXp, progressPercentage };
}

/**
 * Calculate gold reward (always based on full completion for simplicity).
 * Abort gives 0 gold.
 * @param {number} baseGold
 * @param {number} ownerMultiplier
 * @returns {number}
 */
export function calculateGold(baseGold, ownerMultiplier = 1) {
  return Math.round(baseGold * ownerMultiplier);
}
