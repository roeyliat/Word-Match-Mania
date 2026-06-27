// Game types and constants for Color & Category Words

export type GameColor = 'red' | 'blue' | 'green';
export type QuadrantColor = 'red' | 'blue' | 'green' | 'yellow';

export interface ColoredLetter {
  letter: string;
  color: QuadrantColor;
}

export const QUADRANT_COLORS: QuadrantColor[] = ['red', 'blue', 'green', 'yellow'];

export interface GameCard {
  id: number;
  sideA: {
    category: string;
    color: GameColor;
  };
  sideB: {
    letters: [ColoredLetter, ColoredLetter, ColoredLetter];
  };
}

export type PlayMode = 'oral' | 'typing';

export interface GameSettings {
  categories: string[];
  excludedLetters: string[];
  studentCanFlip: boolean;
  timerSeconds: number | null;
  playMode: PlayMode;
  playerNames: string[];
}

export interface GameRoom {
  id: string;
  pin: string;
  therapist_name: string;
  student_name: string | null;
  settings: GameSettings;
  deck_state: GameCard[];
  current_card_index: number;
  current_flipped_card: GameCard | null;
  therapist_score: number;
  student_score: number;
  status: 'waiting' | 'playing' | 'finished';
  mode?: 'duo' | 'multi';
  round_started_at?: string | null;
}

export interface CategoryGroup {
  label: string;
  categories: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: 'קלאסיות',
    categories: ['ארץ', 'עיר', 'חי', 'צומח', 'דומם', 'שם', 'מפורסם', 'סרט/סדרה', 'מאכל', 'מקצוע', 'איבר בגוף', 'בגד/לבוש', 'צבע', 'כלי תחבורה'],
  },
  {
    label: 'עולם הילד',
    categories: ['דמות מצוירת/דיסני', 'גיבור על', 'חטיף/ממתק', 'משחק קופסא/מחשב', 'משהו מביה״ס/תיק'],
  },
  {
    label: 'שפתיות',
    categories: ['פועל/פעולה', 'מילת תיאור', 'דבר חם/קר'],
  },
];

export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.categories);

export const HEBREW_LETTERS = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
] as const;

export const HARD_LETTERS = ['ץ', 'ף', 'ז', 'ט'] as const;

export const GAME_COLORS: GameColor[] = ['red', 'blue', 'green'];

export const COLOR_LABELS: Record<GameColor, string> = {
  red: 'אדום',
  blue: 'כחול',
  green: 'ירוק',
};
