import type { Rating, CardProgress } from '../lib/types';
import { applyRating, describeInterval } from '../lib/srs';

type Props = {
  progress: CardProgress | undefined;
  onRate: (rating: Rating) => void;
  disabled?: boolean;
};

const RATINGS: { id: Rating; label: string; key: string }[] = [
  { id: 'again', label: 'Again', key: '1' },
  { id: 'hard', label: 'Hard', key: '2' },
  { id: 'good', label: 'Good', key: '3' },
  { id: 'easy', label: 'Easy', key: '4' },
];

export function ConfidenceButtons({ progress, onRate, disabled }: Props) {
  return (
    <div className="confidence">
      {RATINGS.map((r) => {
        const projected = applyRating(progress, r.id);
        const interval = describeInterval(projected);
        return (
          <button
            key={r.id}
            type="button"
            className={`confidence__btn confidence__btn--${r.id}`}
            onClick={() => onRate(r.id)}
            disabled={disabled}
            aria-keyshortcuts={r.key}
          >
            <span className="confidence__label">{r.label}</span>
            <span className="confidence__interval">{interval}</span>
          </button>
        );
      })}
    </div>
  );
}
