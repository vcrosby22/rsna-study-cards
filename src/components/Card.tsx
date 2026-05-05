import { useEffect, useRef, useState } from 'react';
import type { Card as CardType, CardProgress } from '../lib/types';
import { describeInterval, isNew } from '../lib/srs';
import { tapHaptic } from '../lib/haptics';

type Props = {
  card: CardType;
  progress?: CardProgress;
  index: number;
  total: number;
  flipped: boolean;
  onFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
};

const SWIPE_THRESHOLD = 80;
const ROTATION_LIMIT = 12;

function CardBack({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return <div className="card__text card__text--back">{text}</div>;
  }

  return (
    <ul className="card__bullets">
      {lines.map((line, i) => (
        <li key={i}>{renderInlineLabel(line)}</li>
      ))}
    </ul>
  );
}

/**
 * Render a single bullet line. If the line starts with "Label: rest of text",
 * render the label in a slightly emphasized style for scanability.
 */
function renderInlineLabel(line: string) {
  const m = line.match(/^([A-Z][A-Za-z0-9 /+\-&.]{1,28}?):\s+(.*)$/);
  if (!m) return line;
  return (
    <>
      <span className="card__bullet-label">{m[1]}:</span> {m[2]}
    </>
  );
}

export function Card({
  card,
  progress,
  index,
  total,
  flipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: Props) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    setDrag(null);
    startRef.current = null;
    movedRef.current = false;
  }, [card.id]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    movedRef.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movedRef.current = true;
    setDrag({ x: dx, y: dy });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const elapsed = Date.now() - startRef.current.t;
    startRef.current = null;
    setDrag(null);

    const isTap = !movedRef.current && elapsed < 350;

    if (isTap) {
      tapHaptic();
      onFlip();
      return;
    }

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    }
  }

  const dragX = drag?.x ?? 0;
  const rotation = Math.max(
    -ROTATION_LIMIT,
    Math.min(ROTATION_LIMIT, dragX / 12),
  );
  const swipeHint =
    dragX <= -SWIPE_THRESHOLD
      ? 'again'
      : dragX >= SWIPE_THRESHOLD
        ? 'good'
        : null;

  const reviewLabel = progress
    ? isNew(progress)
      ? 'New'
      : `Next: ${describeInterval(progress)}`
    : 'New';

  const transform = `translate3d(${dragX}px, 0, 0) rotate(${rotation}deg)`;

  return (
    <div className="card-stage">
      <div className="card-meta">
        <span className="badge badge--topic">{card.topic}</span>
        <div className="card-nav">
          <button
            type="button"
            className="card-nav__btn"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="Previous card"
          >
            {'\u2039'}
          </button>
          <span className="badge badge--counter">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            className="card-nav__btn"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Next card"
          >
            {'\u203A'}
          </button>
        </div>
      </div>

      <div
        className={`card${flipped ? ' card--flipped' : ''}${swipeHint ? ` card--hint-${swipeHint}` : ''}`}
        style={{ transform }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="button"
        aria-pressed={flipped}
        aria-label={flipped ? 'Card showing answer. Tap to hide.' : 'Card showing question. Tap to reveal answer.'}
      >
        <div className="card__inner">
          <div className="card__face card__face--front">
            <div className="card__eyebrow">{card.promptType}</div>
            <div className="card__text">{card.front}</div>
            <div className="card__hint">tap to reveal</div>
          </div>
          <div className="card__face card__face--back">
            <div className="card__eyebrow">answer</div>
            <CardBack text={card.back} />
            {card.sourceSection && (
              <div className="card__source">{card.sourceSection}</div>
            )}
          </div>
        </div>
        <div className="swipe-hint swipe-hint--left">Again</div>
        <div className="swipe-hint swipe-hint--right">Good</div>
      </div>

      <div className="card-foot">
        <span className="card-foot__review">{reviewLabel}</span>
        {card.tags.length > 0 && (
          <span className="card-foot__tags">
            {card.tags.slice(0, 3).map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
