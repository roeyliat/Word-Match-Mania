import { GameCard as GameCardType, GameColor, QuadrantColor, QUADRANT_COLORS as ALL_QUADRANT_COLORS, COLOR_LABELS } from '@/lib/gameTypes';
import {
  MapPin, Building2, PawPrint, Leaf, Gem, User, Star, Film, UtensilsCrossed, Briefcase, Sparkles,
  Heart, Shirt, Palette, Car, Smile, Shield, Cookie, Gamepad2, Backpack,
  Zap, Search, Thermometer
} from 'lucide-react';

// ─── Category icon mapping ───
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'ארץ': <MapPin className="w-12 h-12 sm:w-16 sm:h-16" />,
  'עיר': <Building2 className="w-12 h-12 sm:w-16 sm:h-16" />,
  'חי': <PawPrint className="w-12 h-12 sm:w-16 sm:h-16" />,
  'צומח': <Leaf className="w-12 h-12 sm:w-16 sm:h-16" />,
  'דומם': <Gem className="w-12 h-12 sm:w-16 sm:h-16" />,
  'שם': <User className="w-12 h-12 sm:w-16 sm:h-16" />,
  'מפורסם': <Star className="w-12 h-12 sm:w-16 sm:h-16" />,
  'סרט/סדרה': <Film className="w-12 h-12 sm:w-16 sm:h-16" />,
  'מאכל': <UtensilsCrossed className="w-12 h-12 sm:w-16 sm:h-16" />,
  'מקצוע': <Briefcase className="w-12 h-12 sm:w-16 sm:h-16" />,
  'איבר בגוף': <Heart className="w-12 h-12 sm:w-16 sm:h-16" />,
  'בגד/לבוש': <Shirt className="w-12 h-12 sm:w-16 sm:h-16" />,
  'צבע': <Palette className="w-12 h-12 sm:w-16 sm:h-16" />,
  'כלי תחבורה': <Car className="w-12 h-12 sm:w-16 sm:h-16" />,
  'דמות מצוירת/דיסני': <Smile className="w-12 h-12 sm:w-16 sm:h-16" />,
  'גיבור על': <Shield className="w-12 h-12 sm:w-16 sm:h-16" />,
  'חטיף/ממתק': <Cookie className="w-12 h-12 sm:w-16 sm:h-16" />,
  'משחק קופסא/מחשב': <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16" />,
  'משהו מביה״ס/תיק': <Backpack className="w-12 h-12 sm:w-16 sm:h-16" />,
  'פועל/פעולה': <Zap className="w-12 h-12 sm:w-16 sm:h-16" />,
  'מילת תיאור': <Search className="w-12 h-12 sm:w-16 sm:h-16" />,
  'דבר חם/קר': <Thermometer className="w-12 h-12 sm:w-16 sm:h-16" />,
};

// Watermark icons for quadrants
const WATERMARK_ICONS = [
  <Film className="w-16 h-16 sm:w-20 sm:h-20" />,
  <Building2 className="w-16 h-16 sm:w-20 sm:h-20" />,
  <PawPrint className="w-16 h-16 sm:w-20 sm:h-20" />,
  <Sparkles className="w-16 h-16 sm:w-20 sm:h-20" />,
];

// Quadrant colors
const QUADRANT_COLORS_MAP: Record<GameColor, string> = {
  red: 'bg-quadrant-red',
  blue: 'bg-quadrant-blue',
  green: 'bg-quadrant-green',
};

const QUADRANT_BG_MAP: Record<string, string> = {
  red: 'bg-quadrant-red',
  blue: 'bg-quadrant-blue',
  green: 'bg-quadrant-green',
  yellow: 'bg-quadrant-yellow',
};

// Category card color
const CATEGORY_CARD_COLORS: Record<GameColor, string> = {
  red: 'bg-quadrant-red',
  blue: 'bg-quadrant-blue',
  green: 'bg-quadrant-green',
};

interface LettersGridProps {
  card: GameCardType;
}

/** The left card: 2x2 grid with 3 colored letters + 1 wild quadrant */
export const LettersGrid = ({ card }: LettersGridProps) => {
  const letters = card.sideB.letters;
  // Find the missing color from the 4 quadrant colors for the wild/star quadrant
  const usedColors = new Set(letters.map(l => l.color));
  const wildColor = ALL_QUADRANT_COLORS.find(c => !usedColors.has(c)) || 'yellow';

  const quadrants = [
    { letter: letters[0].letter, bg: QUADRANT_BG_MAP[letters[0].color], icon: WATERMARK_ICONS[0] },
    { letter: letters[1].letter, bg: QUADRANT_BG_MAP[letters[1].color], icon: WATERMARK_ICONS[1] },
    { letter: letters[2].letter, bg: QUADRANT_BG_MAP[letters[2].color], icon: WATERMARK_ICONS[2] },
    { letter: '★', bg: QUADRANT_BG_MAP[wildColor], icon: WATERMARK_ICONS[3] },
  ];

  return (
    <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-[2rem] overflow-hidden card-shadow">
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
        {quadrants.map((q, i) => (
          <div key={i} className={`relative flex items-center justify-center ${q.bg}`}>
            {/* Watermark icon */}
            <div className="absolute inset-0 flex items-center justify-center text-white opacity-[0.15]">
              {q.icon}
            </div>
            {/* Letter */}
            <span className="relative z-10 text-white text-4xl sm:text-5xl font-black drop-shadow-md">
              {q.letter}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CategoryCardProps {
  card: GameCardType;
  onClick?: () => void;
}

/** The right card: tall rectangle with category icon, name, and color badge */
export const CategoryCard = ({ card, onClick }: CategoryCardProps) => {
  const icon = CATEGORY_ICONS[card.sideA.category] || <Star className="w-12 h-12 sm:w-16 sm:h-16" />;
  const bgColor = CATEGORY_CARD_COLORS[card.sideA.color];

  return (
    <div
      className={`w-36 h-52 sm:w-44 sm:h-64 rounded-[2rem] ${bgColor} card-shadow flex flex-col items-center justify-center gap-3 sm:gap-4 cursor-pointer relative overflow-hidden`}
      onClick={onClick}
    >
      {/* Inner lighter border effect */}
      <div className="absolute inset-[3px] rounded-[1.8rem] border-2 border-white/20 pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 text-white/80">
        {icon}
      </div>
      <span className="relative z-10 text-2xl sm:text-3xl font-black text-white drop-shadow-md">
        {card.sideA.category}
      </span>
      <span className="relative z-10 bg-white/20 text-white text-sm sm:text-base font-bold rounded-full px-4 py-1">
        {COLOR_LABELS[card.sideA.color]}
      </span>
    </div>
  );
};

// Keep legacy export for backwards compat in CreateRoom preview if needed
interface GameCardProps {
  card: GameCardType;
  isFlipped: boolean;
  onClick?: () => void;
  className?: string;
}

export const GameCardComponent = ({ card, isFlipped, onClick }: GameCardProps) => {
  if (isFlipped) {
    return <LettersGrid card={card} />;
  }
  return <CategoryCard card={card} onClick={onClick} />;
};
