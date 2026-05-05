import { useEffect, useMemo, useState } from 'react';
import type {
  Card as CardType,
  Mode,
  ProgressMap,
  Rating,
  TopicFilter,
} from '../lib/types';
import { ALL_TOPICS } from '../lib/types';
import { isDue, isNew } from '../lib/srs';
import { rateHaptic, tapHaptic } from '../lib/haptics';
import { Card } from './Card';
import { ConfidenceButtons } from './ConfidenceButtons';

type Props = {
  cards: CardType[];
  mode: Mode;
  topic: TopicFilter;
  progress: ProgressMap;
  onUpdateProgress: (id: string, rating: Rating) => void;
  onChangeTopic: () => void;
};

function shuffle<T>(arr: T[], seed: number): T[] {
  let s = seed;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQueue(
  cards: CardType[],
  mode: Mode,
  topic: TopicFilter,
  progress: ProgressMap,
): CardType[] {
  const filteredByTopic =
    topic === ALL_TOPICS ? cards : cards.filter((c) => c.topic === topic);

  switch (mode) {
    case 'due': {
      const due = filteredByTopic.filter((c) => isDue(progress[c.id]));
      due.sort((a, b) => {
        const pa = progress[a.id];
        const pb = progress[b.id];
        const da = pa?.dueAt ?? 0;
        const db = pb?.dueAt ?? 0;
        if (isNew(pa) && !isNew(pb)) return -1;
        if (!isNew(pa) && isNew(pb)) return 1;
        return da - db;
      });
      return due;
    }
    case 'cram':
      return shuffle(filteredByTopic, filteredByTopic.length || 1);
    case 'drill': {
      const drill = filteredByTopic.filter(
        (c) => c.promptType === 'star' || c.promptType === 'question',
      );
      return shuffle(drill, drill.length || 1);
    }
    case 'search':
      return [];
  }
}

export function StudyDeck({
  cards,
  mode,
  topic,
  progress,
  onUpdateProgress,
  onChangeTopic,
}: Props) {
  const queue = useMemo(
    () => buildQueue(cards, mode, topic, progress),
    [cards, mode, topic, progress],
  );

  const [queueSnapshot, setQueueSnapshot] = useState(queue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    setQueueSnapshot(queue);
    setIndex(0);
    setFlipped(false);
    setReviewedCount(0);
  }, [mode, topic, cards]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const card = queueSnapshot[index];
      if (!card) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
        return;
      }
      if (!flipped) return;
      const map: Record<string, Rating> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      };
      const rating = map[e.key];
      if (rating) {
        e.preventDefault();
        rate(rating);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, index, queueSnapshot]);

  function rate(rating: Rating) {
    const card = queueSnapshot[index];
    if (!card) return;
    rateHaptic(rating === 'again');
    onUpdateProgress(card.id, rating);
    setReviewedCount((n) => n + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  function goPrev() {
    if (index <= 0) return;
    tapHaptic();
    setFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    if (index >= queueSnapshot.length) return;
    tapHaptic();
    setFlipped(false);
    setIndex((i) => Math.min(queueSnapshot.length, i + 1));
  }

  if (queueSnapshot.length === 0) {
    return (
      <EmptyState mode={mode} topic={topic} onChangeTopic={onChangeTopic} />
    );
  }

  if (index >= queueSnapshot.length) {
    return (
      <DoneState
        mode={mode}
        reviewed={reviewedCount}
        total={queueSnapshot.length}
        onBack={() => {
          setIndex(queueSnapshot.length - 1);
          setFlipped(false);
        }}
        onRestart={() => {
          setQueueSnapshot(queue);
          setIndex(0);
          setFlipped(false);
          setReviewedCount(0);
        }}
        onChangeTopic={onChangeTopic}
      />
    );
  }

  const card = queueSnapshot[index];
  const cardProgress = progress[card.id];

  return (
    <div className="deck">
      <Card
        card={card}
        progress={cardProgress}
        index={index}
        total={queueSnapshot.length}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onSwipeLeft={() => flipped && rate('again')}
        onSwipeRight={() => flipped && rate('good')}
        onPrev={goPrev}
        onNext={goNext}
        canPrev={index > 0}
        canNext={index < queueSnapshot.length - 1}
      />
      {flipped ? (
        <ConfidenceButtons progress={cardProgress} onRate={rate} />
      ) : (
        <div className="reveal-prompt" aria-hidden="true">
          Tap to reveal · arrows to skip
        </div>
      )}
    </div>
  );
}

function EmptyState({
  mode,
  topic,
  onChangeTopic,
}: {
  mode: Mode;
  topic: TopicFilter;
  onChangeTopic: () => void;
}) {
  const message =
    mode === 'due'
      ? 'No cards are due in this filter. Either everything is reviewed, or switch to Cram.'
      : mode === 'drill'
        ? 'No drill cards in this topic. Try All Topics or switch modes.'
        : 'No cards match this topic.';
  return (
    <div className="empty">
      <h2>Caught up</h2>
      <p>{message}</p>
      <p className="empty__meta">
        {topic === ALL_TOPICS ? 'All topics' : topic} · {mode}
      </p>
      <button type="button" className="btn btn--primary" onClick={onChangeTopic}>
        Change topic
      </button>
    </div>
  );
}

function DoneState({
  mode,
  reviewed,
  total,
  onBack,
  onRestart,
  onChangeTopic,
}: {
  mode: Mode;
  reviewed: number;
  total: number;
  onBack: () => void;
  onRestart: () => void;
  onChangeTopic: () => void;
}) {
  const skipped = Math.max(0, total - reviewed);
  return (
    <div className="empty">
      <h2>End of deck</h2>
      <p>
        {reviewed > 0
          ? `Rated ${reviewed} card${reviewed === 1 ? '' : 's'} in ${mode} mode.`
          : `Reached the end without rating any cards in ${mode} mode.`}
        {skipped > 0 && ` Skipped ${skipped}.`}
      </p>
      <div className="empty__actions">
        <button type="button" className="btn btn--ghost" onClick={onChangeTopic}>
          Change topic
        </button>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          Back to last card
        </button>
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          Run again
        </button>
      </div>
    </div>
  );
}
