/**
 * State name normalization and coverage checking utilities.
 * Handles discrepancies like "Delhi (NCT)" vs "Delhi", "Jammu & Kashmir" vs "Jammu and Kashmir", etc.
 */

export function normalizeStateName(state: string | undefined): string {
  if (!state) return '';
  const cleaned = state
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return cleaned;
}

/**
 * Returns true if the scheme covered states array includes the target state,
 * or if the scheme is 'All India'.
 */
export function isStateCovered(
  coveredStates: string[] | undefined,
  targetState: string | undefined
): boolean {
  if (!coveredStates || coveredStates.length === 0 || coveredStates.includes('All India')) {
    return true;
  }
  if (!targetState || targetState === 'All India') {
    return true;
  }
  const normTarget = normalizeStateName(targetState);
  if (!normTarget) return true;

  return coveredStates.some((st) => {
    const normSt = normalizeStateName(st);
    return normSt === normTarget || normSt.includes(normTarget) || normTarget.includes(normSt);
  });
}

/**
 * Returns true only if the scheme specifically covers the user's state (not All India).
 */
export function isSpecificStateMatch(
  coveredStates: string[] | undefined,
  targetState: string | undefined
): boolean {
  if (!targetState || targetState === 'All India') {
    return false;
  }
  if (!coveredStates || coveredStates.length === 0) {
    return false;
  }
  const normTarget = normalizeStateName(targetState);
  if (!normTarget) return false;

  return coveredStates.some((st) => {
    if (st === 'All India') return false;
    const normSt = normalizeStateName(st);
    return normSt !== '' && (normSt === normTarget || normSt.includes(normTarget) || normTarget.includes(normSt));
  });
}
