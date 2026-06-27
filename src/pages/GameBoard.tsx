import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CategoryCard, LettersGrid } from '@/components/game/GameCard';
import { ScorePile } from '@/components/game/ScorePile';
import { GameRoom, GameCard, GameSettings } from '@/lib/gameTypes';
import { RotateCw, User, UserCheck, SkipForward, Home, Lightbulb } from 'lucide-react';
import { playFlipSound, playAwardSound, playDiscardSound, playGameOverSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';

const GameBoard = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') as 'therapist' | 'student';

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animatingTo, setAnimatingTo] = useState<'therapist' | 'student' | 'discard' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      const { data } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
      if (data) {
        setRoom({
          ...data,
          settings: data.settings as unknown as GameSettings,
          deck_state: data.deck_state as unknown as GameCard[],
          current_flipped_card: data.current_flipped_card as unknown as GameCard | null,
          status: data.status as 'waiting' | 'playing' | 'finished',
        });
        if (data.current_flipped_card) setIsFlipped(true);
      }
    };
    fetchRoom();
    const channel = supabase
      .channel(`game-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const d = payload.new;
        setRoom({
          ...d, settings: d.settings as unknown as GameSettings, deck_state: d.deck_state as unknown as GameCard[],
          current_flipped_card: d.current_flipped_card as unknown as GameCard | null, status: d.status as 'waiting' | 'playing' | 'finished',
        } as GameRoom);
        if (d.current_flipped_card) setIsFlipped(true); else { setIsFlipped(false); setShowHint(false); }
      }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [roomId]);

  useEffect(() => {
    if (room?.status === 'finished') { playGameOverSound(); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }
  }, [room?.status]);

  const flipCard = useCallback(async () => {
    if (!room || isFlipped) return;
    const idx = room.current_card_index;
    if (idx >= room.deck_state.length) return;
    const card = room.deck_state[idx];
    setIsFlipped(true);
    setShowHint(false);
    playFlipSound();
    await supabase.from('game_rooms').update({ current_flipped_card: card as any, current_card_index: idx + 1 }).eq('id', room.id);
  }, [room, isFlipped]);

  const awardCard = useCallback(async (to: 'therapist' | 'student') => {
    if (!room || !room.current_flipped_card) return;
    setAnimatingTo(to); playAwardSound();
    setTimeout(async () => {
      const updates: any = { current_flipped_card: null, [`${to}_score`]: to === 'therapist' ? room.therapist_score + 1 : room.student_score + 1 };
      if (room.current_card_index >= room.deck_state.length) updates.status = 'finished';
      await supabase.from('game_rooms').update(updates).eq('id', room.id);
      setAnimatingTo(null); setIsFlipped(false); setShowHint(false);
    }, 600);
  }, [room]);

  const discardCard = useCallback(async () => {
    if (!room || !room.current_flipped_card) return;
    setAnimatingTo('discard'); playDiscardSound();
    setTimeout(async () => {
      const updates: any = { current_flipped_card: null };
      if (room.current_card_index >= room.deck_state.length) updates.status = 'finished';
      await supabase.from('game_rooms').update(updates).eq('id', room.id);
      setAnimatingTo(null); setIsFlipped(false); setShowHint(false);
    }, 500);
  }, [room]);

  // Timer
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const timerSecs = room?.settings?.timerSeconds;
    if (!timerSecs || !room?.current_flipped_card) { setTimeLeft(null); return; }
    setTimeLeft(timerSecs);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [room?.current_flipped_card, room?.settings?.timerSeconds]);

  useEffect(() => {
    if (timeLeft === 0 && role === 'therapist' && room?.current_flipped_card && !animatingTo) discardCard();
  }, [timeLeft, role, room?.current_flipped_card, animatingTo, discardCard]);

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center game-bg">
        <div className="text-xl text-muted-foreground animate-bounce-subtle">🃏 טוען...</div>
      </div>
    );
  }

  const canFlip = role === 'therapist' || room.settings.studentCanFlip;
  const isTherapist = role === 'therapist';
  const currentDeckCard = room.current_card_index < room.deck_state.length ? room.deck_state[room.current_card_index] : null;
  const cardsLeft = room.deck_state.length - room.current_card_index;

  if (room.status === 'finished') {
    const winner = room.therapist_score > room.student_score ? room.therapist_name : room.student_score > room.therapist_score ? room.student_name : null;
    return (
      <div className="flex min-h-screen items-center justify-center game-bg p-4">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
          <h1 className="text-3xl sm:text-5xl font-black text-foreground">{winner ? `🎉 ${winner} ניצח/ה!` : '🤝 תיקו!'}</h1>
          <div className="flex justify-center gap-8 sm:gap-12">
            <ScorePile name={room.therapist_name} score={room.therapist_score} position="right" isWinner={room.therapist_score > room.student_score} />
            <ScorePile name={room.student_name || 'תלמיד'} score={room.student_score} position="left" isWinner={room.student_score > room.therapist_score} />
          </div>
          <Button onClick={() => navigate('/')} className="h-14 px-8 text-lg font-bold rounded-2xl gap-2 btn-press bg-primary text-primary-foreground">
            <Home className="w-5 h-5" /> חזרה לדף הבית
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen game-bg p-3 sm:p-4">
      {/* Header */}
      <div className="flex justify-between items-start px-1 sm:px-2">
        <ScorePile name={room.therapist_name} score={room.therapist_score} position="right" />
        <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 card-shadow">
          <span className="text-xs sm:text-sm text-muted-foreground">נותרו</span>
          <div className="text-xl sm:text-2xl font-black text-foreground">{cardsLeft}</div>
          <span className="text-xs sm:text-sm text-muted-foreground">קלפים</span>
        </div>
        <ScorePile name={room.student_name || 'תלמיד'} score={room.student_score} position="left" />
      </div>

      {/* Cards Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center gap-4 sm:gap-6">
          {/* Letters Grid */}
          <AnimatePresence>
            {room.current_flipped_card && (
              <motion.div
                key="letters"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{
                  rotateY: 0, opacity: 1,
                  x: animatingTo === 'therapist' ? -150 : animatingTo === 'student' ? 150 : 0,
                  y: animatingTo === 'discard' ? -200 : 0,
                  scale: animatingTo ? 0.4 : 1,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <LettersGrid card={room.current_flipped_card} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Card */}
          {currentDeckCard && !isFlipped ? (
            <motion.div whileHover={canFlip ? { scale: 1.04, y: -4 } : {}} whileTap={canFlip ? { scale: 0.97 } : {}}>
              <CategoryCard card={currentDeckCard} onClick={canFlip ? flipCard : undefined} />
            </motion.div>
          ) : room.current_flipped_card ? (
            <CategoryCard card={room.current_flipped_card} />
          ) : (
            <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-[2rem] bg-muted/50 flex items-center justify-center border-4 border-dashed border-border">
              <span className="text-muted-foreground font-bold">אין קלפים</span>
            </div>
          )}

          {/* Hint button */}
          {room.current_flipped_card && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-game-yellow flex items-center justify-center card-shadow text-white"
              onClick={() => setShowHint(!showHint)}
            >
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          )}
        </div>

        {/* Hint */}
        <AnimatePresence>
          {showHint && room.current_flipped_card && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="bg-white/90 backdrop-blur rounded-2xl px-5 py-3 card-shadow text-center text-sm sm:text-base font-bold text-foreground">
              מצא את האות בצבע <span className="text-primary">{room.current_flipped_card.sideA.color === 'red' ? 'האדום' : room.current_flipped_card.sideA.color === 'blue' ? 'הכחול' : 'הירוק'}</span> ואמור מילה מקטגוריית <span className="text-primary">{room.current_flipped_card.sideA.category}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer */}
        {timeLeft !== null && (
          <div className={`text-3xl font-black tabular-nums ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
            ⏱ {timeLeft}
          </div>
        )}

        {/* Flip button */}
        {canFlip && !isFlipped && currentDeckCard && (
          <Button onClick={flipCard} className="gap-2 rounded-2xl font-bold text-base sm:text-lg btn-press bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-4 h-auto">
            <RotateCw className="w-5 h-5" /> הפוך קלף
          </Button>
        )}

        {/* Award / discard buttons */}
        {isTherapist && room.current_flipped_card && !animatingTo && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 sm:gap-4 flex-wrap justify-center">
            <Button onClick={() => awardCard('therapist')} className="gap-2 rounded-2xl font-bold text-sm sm:text-base px-5 sm:px-6 py-3 h-auto btn-press bg-primary text-white hover:bg-primary/90" disabled={!!animatingTo}>
              <User className="w-4 h-4" /> לי
            </Button>
            <Button onClick={() => awardCard('student')} className="gap-2 rounded-2xl font-bold text-sm sm:text-base px-5 sm:px-6 py-3 h-auto btn-press bg-accent text-white hover:bg-accent/90" disabled={!!animatingTo}>
              <UserCheck className="w-4 h-4" /> לתלמיד
            </Button>
            <Button onClick={discardCard} className="gap-2 rounded-2xl font-bold text-sm sm:text-base px-5 sm:px-6 py-3 h-auto btn-press bg-muted text-muted-foreground hover:bg-muted/80" disabled={!!animatingTo}>
              <SkipForward className="w-4 h-4" /> דלג
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;