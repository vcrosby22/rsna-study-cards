import type { CardProgress, Mode, ProgressMap, TopicFilter } from './types';
import { ALL_TOPICS } from './types';

const PROGRESS_KEY = 'rsna-study::progress::v1';
const PREFS_KEY = 'rsna-study::prefs::v1';

export type Prefs = {
  mode: Mode;
  topic: TopicFilter;
  showHints: boolean;
};

const DEFAULT_PREFS: Prefs = {
  mode: 'due',
  topic: ALL_TOPICS,
  showHints: true,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadProgress(): ProgressMap {
  if (typeof localStorage === 'undefined') return {};
  return safeParse<ProgressMap>(localStorage.getItem(PROGRESS_KEY), {});
}

export function saveProgress(map: ProgressMap): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    // quota or private mode — silently ignore; progress will not persist this session.
  }
}

export function setCardProgress(
  map: ProgressMap,
  id: string,
  p: CardProgress,
): ProgressMap {
  const next = { ...map, [id]: p };
  saveProgress(next);
  return next;
}

export function loadPrefs(): Prefs {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFS;
  const raw = safeParse<Partial<Prefs>>(localStorage.getItem(PREFS_KEY), {});
  return { ...DEFAULT_PREFS, ...raw };
}

export function savePrefs(prefs: Prefs): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function resetAllProgress(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PROGRESS_KEY);
}
