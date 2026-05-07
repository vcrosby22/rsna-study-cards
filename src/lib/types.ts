export const TOPICS = [
  "Recruiter Q's",
  'HR Screen Prep',
  'Pitch: RSNA at the Read',
  'RSNA / Ventures',
  'Competitor Landscape',
  'Pricing Strategy',
  'Radiology Workflow',
  'Standards',
  'AI in Radiology',
  'AI/ML Systems',
  'Imaging AI / Foundation Models',
  'Healthcare APIs',
  'System Design',
  'Data & Cloud',
  'Security & DevOps',
  'Regulatory',
  'PM Methodologies',
  'PM Frameworks',
  'Interview Answers',
  'Negotiation & Offer',
  'Questions to Ask',
] as const;

export type Topic = (typeof TOPICS)[number];

export type Difficulty = 'core' | 'stretch';

export type PromptType =
  | 'definition'
  | 'compare'
  | 'star'
  | 'question'
  | 'concept';

export type Card = {
  id: string;
  topic: Topic;
  front: string;
  back: string;
  sourceSection?: string;
  difficulty: Difficulty;
  tags: string[];
  promptType: PromptType;
};

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export type CardProgress = {
  ease: number;
  intervalDays: number;
  dueAt: number | null;
  reviewCount: number;
  lastReviewedAt: number | null;
  lapses: number;
};

export type ProgressMap = Record<string, CardProgress>;

export const MODES = ['due', 'cram', 'drill', 'search'] as const;
export type Mode = (typeof MODES)[number];

export const ALL_TOPICS = '__all__' as const;
export type TopicFilter = Topic | typeof ALL_TOPICS;
