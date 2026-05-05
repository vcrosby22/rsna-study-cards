import { useEffect } from 'react';
import type { Card, ProgressMap, TopicFilter } from '../lib/types';
import { ALL_TOPICS, TOPICS } from '../lib/types';
import { isDue } from '../lib/srs';

type Props = {
  open: boolean;
  cards: Card[];
  progress: ProgressMap;
  topic: TopicFilter;
  onSelect: (topic: TopicFilter) => void;
  onClose: () => void;
};

export function TopicPicker({
  open,
  cards,
  progress,
  topic,
  onSelect,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const allCount = cards.length;
  const allDue = cards.filter((c) => isDue(progress[c.id])).length;

  function topicCounts(t: TopicFilter): { total: number; due: number } {
    const list = t === ALL_TOPICS ? cards : cards.filter((c) => c.topic === t);
    return {
      total: list.length,
      due: list.filter((c) => isDue(progress[c.id])).length,
    };
  }

  return (
    <div
      className={`sheet${open ? ' sheet--open' : ''}`}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Choose topic"
    >
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__handle" />
        <h2 className="sheet__title">Topic</h2>
        <ul className="sheet__list">
          <Row
            active={topic === ALL_TOPICS}
            label="All topics"
            total={allCount}
            due={allDue}
            onClick={() => {
              onSelect(ALL_TOPICS);
              onClose();
            }}
          />
          {TOPICS.map((t) => {
            const { total, due } = topicCounts(t);
            return (
              <Row
                key={t}
                active={topic === t}
                label={t}
                total={total}
                due={due}
                onClick={() => {
                  onSelect(t);
                  onClose();
                }}
              />
            );
          })}
        </ul>
        <button type="button" className="sheet__close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function Row({
  active,
  label,
  total,
  due,
  onClick,
}: {
  active: boolean;
  label: string;
  total: number;
  due: number;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`sheet__row${active ? ' sheet__row--active' : ''}`}
        onClick={onClick}
        aria-pressed={active}
      >
        <span className="sheet__row-label">{label}</span>
        <span className="sheet__row-meta">
          <span className="sheet__row-due">{due} due</span>
          <span className="sheet__row-total">/ {total}</span>
        </span>
      </button>
    </li>
  );
}
