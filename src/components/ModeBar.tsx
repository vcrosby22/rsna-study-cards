import type { Mode } from '../lib/types';

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
  dueCount: number;
};

const ITEMS: { id: Mode; label: string; hint: string }[] = [
  { id: 'due', label: 'Due', hint: 'Spaced review' },
  { id: 'cram', label: 'Cram', hint: 'All cards' },
  { id: 'drill', label: 'Drill', hint: 'Interview prompts' },
  { id: 'search', label: 'Search', hint: 'Look up' },
];

export function ModeBar({ mode, onChange, dueCount }: Props) {
  return (
    <nav className="modebar" aria-label="Study mode">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`modebar__btn${mode === item.id ? ' modebar__btn--active' : ''}`}
          onClick={() => onChange(item.id)}
          aria-pressed={mode === item.id}
        >
          <span className="modebar__label">{item.label}</span>
          {item.id === 'due' && dueCount > 0 && (
            <span className="modebar__badge" aria-label={`${dueCount} due`}>
              {dueCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
