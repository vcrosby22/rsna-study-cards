import { useEffect, useMemo, useState } from 'react';
import type { Card, Mode, ProgressMap, Rating, TopicFilter } from './lib/types';
import { ALL_TOPICS } from './lib/types';
import { applyRating, isDue } from './lib/srs';
import {
  loadPrefs,
  loadProgress,
  resetAllProgress,
  savePrefs,
  setCardProgress,
} from './lib/storage';
import { ModeBar } from './components/ModeBar';
import { StudyDeck } from './components/StudyDeck';
import { TopicPicker } from './components/TopicPicker';
import { SearchView } from './components/SearchView';
import cardsData from './data/cards.json';

const ALL_CARDS = cardsData as Card[];

export function App() {
  const initialPrefs = useMemo(() => loadPrefs(), []);
  const [mode, setMode] = useState<Mode>(initialPrefs.mode);
  const [topic, setTopic] = useState<TopicFilter>(initialPrefs.topic);
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    savePrefs({ mode, topic, showHints: true });
  }, [mode, topic]);

  const filteredForCount =
    topic === ALL_TOPICS
      ? ALL_CARDS
      : ALL_CARDS.filter((c) => c.topic === topic);
  const dueCount = filteredForCount.filter((c) => isDue(progress[c.id])).length;

  function handleRate(id: string, rating: Rating) {
    const next = applyRating(progress[id], rating);
    setProgress((prev) => setCardProgress(prev, id, next));
  }

  function handleReset() {
    if (
      typeof window !== 'undefined' &&
      window.confirm('Reset all study progress? This cannot be undone.')
    ) {
      resetAllProgress();
      setProgress({});
      setMenuOpen(false);
    }
  }

  const topicLabel = topic === ALL_TOPICS ? 'All topics' : topic;

  return (
    <div className="app">
      <header className="app__header">
        <button
          type="button"
          className="app__topic-chip"
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="app__topic-label">{topicLabel}</span>
          <span className="app__topic-caret" aria-hidden>
            {'\u25BE'}
          </span>
        </button>
        <button
          type="button"
          className="app__menu-btn"
          onClick={() => setMenuOpen((m) => !m)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="More"
        >
          <span aria-hidden>{'\u22EE'}</span>
        </button>
        {menuOpen && (
          <div className="app__menu" role="menu">
            <button
              type="button"
              className="app__menu-item"
              role="menuitem"
              onClick={handleReset}
            >
              Reset progress
            </button>
            <div className="app__menu-meta">
              {ALL_CARDS.length} cards · {dueCount} due
            </div>
          </div>
        )}
      </header>

      <main className="app__main">
        {mode === 'search' ? (
          <SearchView cards={ALL_CARDS} />
        ) : (
          <StudyDeck
            cards={ALL_CARDS}
            mode={mode}
            topic={topic}
            progress={progress}
            onUpdateProgress={handleRate}
            onChangeTopic={() => setPickerOpen(true)}
          />
        )}
      </main>

      <ModeBar mode={mode} onChange={setMode} dueCount={dueCount} />

      <TopicPicker
        open={pickerOpen}
        cards={ALL_CARDS}
        progress={progress}
        topic={topic}
        onSelect={setTopic}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
