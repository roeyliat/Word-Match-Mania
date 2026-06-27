import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CategoryCard, LettersGrid } from '@/components/game/GameCard';
import { ScorePile } from '@/components/game/ScorePile';
import { GameCard, GameSettings } from '@/lib/gameTypes';
import { generateDeck, reshuffleCard } from '@/lib/deckGenerator';
import { RotateCw, SkipForward, Home, Lightbulb, Check } from 'lucide-react';
import { playFlipSound, playAwardSound, playDiscardSound, playGameOverSound } from '@/lib/sounds';
import CopyrightFooter from '@/components/CopyrightFooter';
import confetti from 'canvas-confetti';
import GameSettingsScreen from '@/components/game/GameSettings';
import { Input } from '@/components/ui/input';

const PLAYER_COLORS = [
  'bg-primary', 'bg-accent', 'bg-secondary', 'bg-game-yellow',
  'bg-game-red', 'bg-game-blue', 'bg-game-green', 'bg-primary/70',
  'bg-accent/70', 'bg-secondary/70', 'bg-game-yellow/70', 'bg-game-red/70',
];

const LocalGame = () => {
  const navigate = useNavigate();

  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [deck, setDeck] = useState<GameCard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flippedCard, setFlippedCard] = useState<GameCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [animatingTo, setAnimatingTo] = useState<number | 'discard' | null>(null);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [dealingDone, setDealingDone] = useState(false);
  const [typingAnswer, setTypingAnswer] = useState('');
  const [typingFeedback, setTypingFeedback] = useState<'correct' | 'wrong' | null>(null);

  const playerNames = gameSettings?.playerNames ?? [];

  const handleStartGame = useCallback((settings: GameSettings) => {
    const newDeck = generateDeck(settings);
    setGameSettings(settings);
    setDeck(newDeck);
    setScores(new Array(settings.playerNames.length).fill(0));
    setDealingDone(false);
    setTimeout(() => setDealingDone(true), 1200);
  }, []);

  const cardsLeft = deck.length - cardIndex;
  const currentDeckCard = cardIndex < deck.length ? deck[cardIndex] : null;

  useEffect(() => {
    if (finished) {
      playGameOverSound();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [finished]);

  const checkFinished = useCallback((nextIndex: number) => {
    if (nextIndex >= deck.length) setFinished(true);
  }, [deck.length]);

  const flipCard = useCallback(() => {
    if (isFlipped || cardIndex >= deck.length) return;
    const card = deck[cardIndex];
    setFlippedCard(card);
    setIsFlipped(true);
    setCardIndex(prev => prev + 1);
    setShowHint(false);
    setTypingAnswer('');
    setTypingFeedback(null);
    playFlipSound();
  }, [isFlipped, cardIndex, deck]);

  const awardCard = useCallback((playerIndex: number) => {
    if (!flippedCard) return;
    setAnimatingTo(playerIndex);
    playAwardSound();
    setTimeout(() => {
      setScores(prev => prev.map((s, i) => i === playerIndex ? s + 1 : s));
      setFlippedCard(null);
      setIsFlipped(false);
      setAnimatingTo(null);
      setShowHint(false);
      checkFinished(cardIndex);
    }, 600);
  }, [flippedCard, cardIndex, checkFinished]);

  const discardCard = useCallback(() => {
    if (!flippedCard || !gameSettings) return;
    setAnimatingTo('discard');
    playDiscardSound();
    setTimeout(() => {
      // Reshuffle the card with new letters/colors and insert it back into the deck
      const newCard = reshuffleCard(flippedCard, gameSettings);
      setDeck(prev => {
        const remaining = prev.slice(cardIndex);
        const shuffled = [...remaining, newCard].sort(() => Math.random() - 0.5);
        return [...prev.slice(0, cardIndex), ...shuffled];
      });
      setFlippedCard(null);
      setIsFlipped(false);
      setAnimatingTo(null);
      setShowHint(false);
    }, 500);
  }, [flippedCard, cardIndex, gameSettings]);

  const handleTypingSubmit = useCallback(() => {
    if (!typingAnswer.trim() || !flippedCard) return;
    setTypingFeedback('correct');
    playAwardSound();
    setTimeout(() => {
      setScores(prev => prev.map((s, i) => i === 0 ? s + 1 : s));
      setFlippedCard(null);
      setIsFlipped(false);
      setTypingAnswer('');
      setTypingFeedback(null);
      checkFinished(cardIndex);
    }, 800);
  }, [typingAnswer, flippedCard, cardIndex, checkFinished]);

  if (!gameSettings) {
    return <GameSettingsScreen onStart={handleStartGame} />;
  }

  if (finished) {
    const maxScore = Math.max(...scores);
    const winners = playerNames.filter((_, i) => scores[i] === maxScore);
    const isTie = winners.length > 1;

    return (
      <div className="flex min-h-screen items-center justify-center game-bg p-4">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full max-w-lg">
          <h1 className="text-3xl sm:text-5xl font-black text-foreground">
            {isTie ? '🤝 תיקו!' : `🎉 ${winners[0]} ניצח/ה!`}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {playerNames.map((name, i) => (
              <ScorePile
                key={i}
                name={name}
                score={scores[i]}
                position={i % 2 === 0 ? 'right' : 'left'}
                isWinner={scores[i] === maxScore}
              />
            ))}
          </div>
          <Button onClick={() => navigate('/')} className="h-14 px-8 text-lg font-bold rounded-2xl gap-2 btn-press bg-primary text-primary-foreground">
            <Home className="w-5 h-5" />
            חזרה לדף הבית
          </Button>
          <CopyrightFooter />
        </motion.div>
      </div>
    );
  }

  if (!dealingDone) {
    return (
      <div className="flex flex-col min-h-screen game-bg items-center justify-center gap-6">
        <motion.div className="relative w-44 h-64 sm:w-52 sm:h-72">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-[2rem] bg-primary card-shadow"
              initial={{ y: -400, x: 0, rotate: -15, opacity: 0 }}
              animate={{ y: i * 4, x: i * 3, rotate: i * 2 - 4, opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.5, type: 'spring', bounce: 0.3 }}
            >
              <div className="absolute inset-[3px] rounded-[1.8rem] border-2 border-white/20" />
            </motion.div>
          ))}
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-xl font-black text-foreground">
          מחלק קלפים...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen game-bg p-3 sm:p-4">
      {/* Header - Score piles */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-start px-1 sm:px-2 flex-wrap gap-2"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3 flex-1 justify-start">
          {playerNames.slice(0, Math.ceil(playerNames.length / 2)).map((name, i) => (
            <ScorePile key={i} name={name} score={scores[i]} position="right" />
          ))}
        </div>
        <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 card-shadow shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground">נותרו</span>
          <div className="text-xl sm:text-2xl font-black text-foreground">{cardsLeft}</div>
          <span className="text-xs sm:text-sm text-muted-foreground">קלפים</span>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 flex-1 justify-end">
          {playerNames.slice(Math.ceil(playerNames.length / 2)).map((name, i) => {
            const actualIndex = Math.ceil(playerNames.length / 2) + i;
            return <ScorePile key={actualIndex} name={name} score={scores[actualIndex]} position="left" />;
          })}
        </div>
      </motion.div>

      {/* Cards Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative flex items-center justify-center gap-4 sm:gap-6"
        >
          <AnimatePresence>
            {flippedCard && (
              <motion.div
                key="letters"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{
                  rotateY: 0, opacity: 1,
                  y: animatingTo === 'discard' ? -200 : 0,
                  scale: typeof animatingTo === 'number' || animatingTo === 'discard' ? 0.4 : 1,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <LettersGrid card={flippedCard} />
              </motion.div>
            )}
          </AnimatePresence>

          {currentDeckCard && !isFlipped ? (
            <motion.div whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }}>
              <CategoryCard card={currentDeckCard} onClick={flipCard} />
            </motion.div>
          ) : currentDeckCard && isFlipped && flippedCard ? (
            <CategoryCard card={flippedCard} />
          ) : !currentDeckCard && !flippedCard ? (
            <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-[2rem] bg-muted/50 flex items-center justify-center border-4 border-dashed border-border">
              <span className="text-muted-foreground font-bold">אין קלפים</span>
            </div>
          ) : null}

          {isFlipped && flippedCard && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-game-yellow flex items-center justify-center card-shadow text-white"
              onClick={() => setShowHint(!showHint)}
            >
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          )}
        </motion.div>

        <AnimatePresence>
          {showHint && flippedCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white/90 backdrop-blur rounded-2xl px-5 py-3 card-shadow text-center text-sm sm:text-base font-bold text-foreground"
            >
              מצא את האות בצבע <span className="text-primary">{flippedCard.sideA.color === 'red' ? 'האדום' : flippedCard.sideA.color === 'blue' ? 'הכחול' : 'הירוק'}</span> ואמור מילה מקטגוריית <span className="text-primary">{flippedCard.sideA.category}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isFlipped && currentDeckCard && (
          <Button onClick={flipCard} className="gap-2 rounded-2xl font-bold text-base sm:text-lg btn-press bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-4 h-auto">
            <RotateCw className="w-5 h-5" />
            הפוך קלף
          </Button>
        )}

        {/* Award buttons - ORAL mode */}
        {isFlipped && flippedCard && !animatingTo && gameSettings.playMode === 'oral' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 sm:gap-3 flex-wrap justify-center max-w-md"
          >
            {playerNames.map((name, i) => (
              <Button
                key={i}
                onClick={() => awardCard(i)}
                className="gap-1.5 rounded-2xl font-bold text-xs sm:text-sm px-3 sm:px-5 py-2.5 h-auto btn-press bg-primary text-white hover:bg-primary/90"
              >
                {name}
              </Button>
            ))}
            <Button
              onClick={discardCard}
              className="gap-1.5 rounded-2xl font-bold text-xs sm:text-sm px-3 sm:px-5 py-2.5 h-auto btn-press bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <SkipForward className="w-4 h-4" />
              דלג
            </Button>
          </motion.div>
        )}

        {/* Typing input - TYPING mode */}
        {isFlipped && flippedCard && !animatingTo && gameSettings.playMode === 'typing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 w-full max-w-xs"
            dir="rtl"
          >
            <div className="relative w-full">
              <Input
                value={typingAnswer}
                onChange={e => setTypingAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTypingSubmit()}
                placeholder={`הקלד מילה מקטגוריית ${flippedCard.sideA.category}...`}
                className={`h-14 text-lg font-bold rounded-2xl text-center card-shadow border-2 ${
                  typingFeedback === 'correct' ? 'border-green-500 bg-green-50' :
                  typingFeedback === 'wrong' ? 'border-red-500 bg-red-50' :
                  'border-border bg-white'
                }`}
                disabled={!!typingFeedback}
                autoFocus
              />
              {typingFeedback === 'correct' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Check className="w-6 h-6 text-green-500" />
                </motion.div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleTypingSubmit}
                disabled={!typingAnswer.trim() || !!typingFeedback}
                className="gap-2 rounded-2xl font-bold px-6 py-3 h-auto btn-press bg-primary text-white hover:bg-primary/90"
              >
                <Check className="w-4 h-4" />
                שלח
              </Button>
              <Button
                onClick={discardCard}
                className="gap-2 rounded-2xl font-bold px-5 py-3 h-auto btn-press bg-muted text-muted-foreground hover:bg-muted/80"
              >
                <SkipForward className="w-4 h-4" />
                דלג
              </Button>
            </div>
          </motion.div>
        )}
      <CopyrightFooter />
    </div>
    </div>
  );
};

export default LocalGame;
