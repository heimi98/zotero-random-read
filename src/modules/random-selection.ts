const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_LOOKBACK_DAYS = 30;
const UNREAD_BOOST = 2.5;
const COOLDOWN_PENALTY = 0.2;

export interface WeightedCandidate<T> {
  value: T;
  weight: number;
}

export function buildHistoryKey(libraryID: number, itemKey: string) {
  return `${libraryID}/${itemKey}`;
}

export function computeCandidateWeight({
  nowISO,
  lastOpenedAt,
  openCount = 0,
}: {
  nowISO: string;
  lastOpenedAt?: string;
  openCount?: number;
}) {
  const now = Date.parse(nowISO);
  const lastOpened = lastOpenedAt ? Date.parse(lastOpenedAt) : Number.NaN;
  const hasHistory = Number.isFinite(lastOpened);

  const elapsedDays = hasHistory
    ? clamp((now - lastOpened) / DAY_IN_MS, 0, MAX_LOOKBACK_DAYS)
    : MAX_LOOKBACK_DAYS;
  const freshness = 1 + Math.log1p(elapsedDays);
  const rarity = 1 / Math.sqrt(1 + Math.max(0, openCount));
  const unreadBoost = hasHistory ? 1 : UNREAD_BOOST;
  const cooldownPenalty =
    hasHistory && now - lastOpened < DAY_IN_MS ? COOLDOWN_PENALTY : 1;

  return unreadBoost * freshness * rarity * cooldownPenalty;
}

export function pickWeighted<T>(
  candidates: WeightedCandidate<T>[],
  random: () => number = Math.random,
) {
  if (!candidates.length) {
    throw new Error("No weighted candidates available");
  }

  const positiveCandidates = candidates.filter((candidate) => candidate.weight > 0);
  if (!positiveCandidates.length) {
    throw new Error("All weighted candidates have non-positive weight");
  }

  const totalWeight = positiveCandidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );
  const threshold = random() * totalWeight;
  let runningWeight = 0;

  for (const candidate of positiveCandidates) {
    runningWeight += candidate.weight;
    if (threshold < runningWeight) {
      return candidate.value;
    }
  }

  return positiveCandidates[positiveCandidates.length - 1].value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
