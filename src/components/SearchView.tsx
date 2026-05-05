import { useMemo, useState } from 'react';
import type { Card } from '../lib/types';

type Props = {
  cards: Card[];
};

export function SearchView({ cards }: Props) {
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return cards.filter((c) => {
      const hay = [
        c.front,
        c.back,
        c.topic,
        c.sourceSection ?? '',
        ...c.tags,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    });
  }, [q, cards]);

  return (
    <div className="search">
      <label className="search__input-wrap">
        <span className="search__icon" aria-hidden>
          {'\u2315'}
        </span>
        <input
          autoFocus
          className="search__input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Search cards (DICOM, RAG, Rad AI...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            type="button"
            className="search__clear"
            onClick={() => setQ('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </label>

      <div className="search__results" role="list">
        {q.trim() === '' && (
          <p className="search__hint">
            Search the front, back, topic, or tags. Try "RAG", "PCCP", "Dexcom".
          </p>
        )}
        {q.trim() !== '' && results.length === 0 && (
          <p className="search__hint">No matches for "{q}".</p>
        )}
        {results.map((c) => {
          const open = openId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`search__row${open ? ' search__row--open' : ''}`}
              onClick={() => setOpenId(open ? null : c.id)}
              aria-expanded={open}
            >
              <div className="search__row-head">
                <span className="badge badge--topic">{c.topic}</span>
              </div>
              <div className="search__row-front">{c.front}</div>
              {open && <div className="search__row-back">{c.back}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
