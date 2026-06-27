import {
  GameCard,
  GameColor,
  GameSettings,
  GAME_COLORS,
  QUADRANT_COLORS,
  HEBREW_LETTERS,
  ColoredLetter,
  QuadrantColor,
} from './gameTypes';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TOTAL_CARDS = 60;

export function generateCard(id: number, category: string, excludedLetters: string[]): GameCard {
  let availableLetters = [...HEBREW_LETTERS];
  if (excludedLetters.length > 0) {
    availableLetters = availableLetters.filter(l => !excludedLetters.includes(l));
  }
  const dominantColor = pickRandom(GAME_COLORS);
  const shuffledColors = shuffle([...QUADRANT_COLORS]) as [QuadrantColor, QuadrantColor, QuadrantColor, QuadrantColor];
  const letters: [ColoredLetter, ColoredLetter, ColoredLetter] = [
    { letter: pickRandom(availableLetters), color: shuffledColors[0] },
    { letter: pickRandom(availableLetters), color: shuffledColors[1] },
    { letter: pickRandom(availableLetters), color: shuffledColors[2] },
  ];
  return {
    id,
    sideA: { category, color: dominantColor },
    sideB: { letters },
  };
}

export function generateDeck(settings: GameSettings): GameCard[] {
  const { categories, excludedLetters } = settings;

  const cards: GameCard[] = [];
  for (let i = 0; i < TOTAL_CARDS; i++) {
    const category = categories[i % categories.length];
    cards.push(generateCard(i, category, excludedLetters));
  }

  return shuffle(cards);
}

export function reshuffleCard(card: GameCard, settings: GameSettings): GameCard {
  const category = pickRandom(settings.categories);
  return generateCard(card.id, category, settings.excludedLetters);
}
