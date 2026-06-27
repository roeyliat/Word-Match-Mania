import { motion } from 'framer-motion';

interface ScorePileProps {
  name: string;
  score: number;
  position: 'right' | 'left';
  isWinner?: boolean;
}

export const ScorePile = ({ name, score, position, isWinner }: ScorePileProps) => {
  return (
    <motion.div
      className={`flex flex-col items-center gap-1 sm:gap-2 ${
        position === 'right' ? 'self-start' : 'self-end'
      }`}
      initial={{ opacity: 0, x: position === 'right' ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="relative">
        {/* Stacked cards effect */}
        {Array.from({ length: Math.min(score, 5) }).map((_, i) => (
          <div
            key={i}
            className="absolute w-11 h-14 sm:w-14 sm:h-18 rounded-2xl bg-primary/20 border-2 border-primary/30"
            style={{
              transform: `rotate(${(i - 2) * 6}deg) translateY(${-i * 2}px)`,
              zIndex: i,
            }}
          />
        ))}
        <div className="relative z-10 w-11 h-14 sm:w-14 sm:h-18 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center card-shadow btn-press">
          <span className="text-xl sm:text-2xl font-black text-primary-foreground">{score}</span>
        </div>
      </div>
      <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[60px] sm:max-w-[80px]">
        {name}
      </span>
      {isWinner && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs font-bold text-secondary bg-secondary/20 px-2 py-1 rounded-full animate-bounce-subtle"
        >
          🏆 מנצח!
        </motion.span>
      )}
    </motion.div>
  );
};