import type { CardProgress, Rating } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

export function newProgress(): CardProgress {
  return {
    ease: DEFAULT_EASE,
    intervalDays: 0,
    dueAt: null,
    reviewCount: 0,
    lastReviewedAt: null,
    lapses: 0,
  };
}

function clampEase(e: number): number {
  return Math.max(MIN_EASE, Math.min(3.0, e));
}

/** SM-2 lite. Returns the next progress for a card given a rating. */
export function applyRating(
  prev: CardProgress | undefined,
  rating: Rating,
  now: number = Date.now(),
): CardProgress {
  const p = prev ?? newProgress();
  let { ease, intervalDays, lapses } = p;

  switch (rating) {
    case 'again':
      ease = clampEase(ease - 0.2);
      intervalDays = 0;
      lapses += 1;
      break;
    case 'hard':
      ease = clampEase(ease - 0.15);
      intervalDays = Math.max(1, Math.round(Math.max(intervalDays, 1) * 1.2));
      break;
    case 'good':
      intervalDays = Math.max(
        1,
        Math.round(intervalDays === 0 ? 1 : intervalDays * ease),
      );
      break;
    case 'easy':
      ease = clampEase(ease + 0.15);
      intervalDays = Math.max(
        2,
        Math.round((intervalDays === 0 ? 1 : intervalDays * ease) * 1.3),
      );
      break;
  }

  const dueAt = intervalDays === 0 ? now : now + intervalDays * DAY_MS;

  return {
    ease,
    intervalDays,
    dueAt,
    reviewCount: p.reviewCount + 1,
    lastReviewedAt: now,
    lapses,
  };
}

/** A card is due if it has never been reviewed or its dueAt is past. */
export function isDue(p: CardProgress | undefined, now: number = Date.now()): boolean {
  if (!p || p.dueAt === null) return true;
  return p.dueAt <= now;
}

/** True if the card has never been reviewed. */
export function isNew(p: CardProgress | undefined): boolean {
  return !p || p.reviewCount === 0;
}

/** Human-readable next-review label. */
export function describeInterval(p: CardProgress | undefined): string {
  if (!p || p.intervalDays === 0 || p.dueAt === null) return 'now';
  const days = p.intervalDays;
  if (days < 1) return '<1d';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.round(days / 365)}y`;
}
