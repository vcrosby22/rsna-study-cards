export function tapHaptic(): void {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(8);
    } catch {
      // Some iOS Safari versions throw; ignore.
    }
  }
}

export function rateHaptic(strong: boolean = false): void {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(strong ? [10, 30, 10] : 12);
    } catch {
      // ignore
    }
  }
}
