import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CopyrightFooter from '@/components/CopyrightFooter';
import { CategoryCard, LettersGrid } from '@/components/game/GameCard';
import { supabase } from '@/integrations/supabase/client';
import { generatePin } from '@/lib/gameUtils';
import { generateDeck } from '@/lib/deckGenerator';
import { ALL_CATEGORIES, GameSettings } from '@/lib/gameTypes';
import { useGameRoom } from '@/hooks/useGameRoom';
import { usePlayers } from '@/hooks/usePlayers';
import { sortPlayers } from '@/lib/multiplayer';
import { playFlipSound } from '@/lib/sounds';
import { ArrowRight, Copy, Check, Loader2, Users, Play, SkipForward, Trophy } from 'lucide-react';

const HostGame = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...ALL_CATEGORIES]);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const room = useGameRoom(roomId ?? undefined);
  const players = usePlayers(roomId ?? undefined);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const createGame = async () => {
    if (!name.trim() || selectedCategories.length === 0) return;
    setLoading(true);
    const newPin = generatePin();
    const settings: GameSettings = {
      categories: selectedCategories,
      excludedLetters: [],
      studentCanFlip: false,
      timerSeconds: null,
      playMode: 'oral',
      playerNames: [name.trim()],
    };
    const deck = generateDeck(settings);
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        pin: newPin,
        therapist_name: name.trim(),
        settings: settings as never,
        deck_state: deck as never,
        status: 'waiting',
        mode: 'multi',
      })
      .select()
      .single();
    setLoading(false);
    if (error || !data) {
      console.error('Error creating game:', error);
      return;
    }
    setPin(newPin);
    setRoomId(data.id);
  };

  const copyPin = () => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (!room || players.length === 0) return;
    playFlipSound();
    await supabase
      .from('game_rooms')
      .update({
        status: 'playing',
        current_card_index: 0,
        current_flipped_card: room.deck_state[0] as never,
        round_started_at: new Date().toISOString(),
      })
      .eq('id', room.id);
  };

  const nextCard = async () => {
    if (!room) return;
    const idx = room.current_card_index;
    if (idx + 1 >= room.deck_state.length) {
      await supabase.from('game_rooms').update({ status: 'finished', current_flipped_card: null }).eq('id', room.id);
      return;
    }
    playFlipSound();
    await supabase
      .from('game_rooms')
      .update({
        current_card_index: idx + 1,
        current_flipped_card: room.deck_state[idx + 1] as never,
        round_started_at: new Date().toISOString(),
      })
      .eq('id', room.id);
  };

  const endGame = async () => {
    if (!room) return;
    await supabase.from('game_rooms').update({ status: 'finished', current_flipped_card: null }).eq('id', room.id);
  };

  // Once finished, send the host to the leaderboard.
  if (room?.status === 'finished' && roomId) {
    navigate(`/leaderboard/${roomId}?host=1`);
    return null;
  }

  // ─── Playing (host control panel) ───
  if (room?.status === 'playing') {
    const card = room.current_flipped_card;
    const answered = players.filter(p => p.last_answered_index === room.current_card_index).length;
    const isLast = room.current_card_index + 1 >= room.deck_state.length;
    const top = sortPlayers(players, 'score').slice(0, 5);
    return (
      <div className="flex flex-col min-h-screen game-bg p-3 sm:p-4">
        <div className="flex justify-between items-center px-1">
          <div className="text-sm font-bold text-muted-foreground">
            סבב {room.current_card_index + 1} / {room.deck_state.length}
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-2xl px-4 py-2 card-shadow">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-black text-foreground">{answered}/{players.length}</span>
            <span className="text-xs text-muted-foreground">ענו</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {card && (
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <LettersGrid card={card} />
              <CategoryCard card={card} />
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={nextCard} className="gap-2 rounded-2xl font-bold text-base sm:text-lg btn-press bg-primary text-primary-foreground px-8 py-4 h-auto">
              {isLast ? <Trophy className="w-5 h-5" /> : <SkipForward className="w-5 h-5" />}
              {isLast ? 'סיים והצג תוצאות' : 'הקלף הבא'}
            </Button>
            {!isLast && (
              <Button onClick={endGame} variant="outline" className="rounded-2xl font-bold px-5 py-4 h-auto">
                סיים משחק
              </Button>
            )}
          </div>

          {/* Live top scores */}
          <Card className="w-full max-w-sm border-2 rounded-3xl">
            <CardHeader className="pb-2"><CardTitle className="text-base">המובילים</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {top.length === 0 && <p className="text-sm text-muted-foreground">אין עדיין תשובות</p>}
              {top.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-sm py-1">
                  <span className="font-bold">{i + 1}. {p.name}</span>
                  <span className="font-black text-primary tabular-nums">{p.score}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Lobby ───
  if (pin && roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center game-bg p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md space-y-6">
          <Card className="border-2 rounded-3xl">
            <CardHeader><CardTitle className="text-2xl text-center">הזמן שחקנים</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">שתפו את הקוד — כל אחד נכנס מהטלפון</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-6xl font-black tracking-[0.3em] text-primary" style={{ direction: 'ltr' }}>{pin}</div>
                <Button variant="ghost" size="icon" onClick={copyPin}>
                  {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span className="font-bold">{players.length} שחקנים</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center min-h-[2rem]">
                <AnimatePresence>
                  {players.map(p => (
                    <motion.span key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                      {p.name}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              <Button onClick={startGame} disabled={players.length === 0}
                className="w-full h-14 text-lg font-bold rounded-2xl gap-2 btn-press">
                <Play className="w-5 h-5" /> התחל משחק
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Create form ───
  return (
    <div className="flex min-h-screen items-center justify-center game-bg p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
        <Card className="border-2 rounded-3xl">
          <CardHeader><CardTitle className="text-2xl">משחק רב-משתתפים</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">שם המנחה</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="הכנס את שמך..." className="h-12 text-lg rounded-xl" />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold">קטגוריות</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(cat => (
                  <motion.button key={cat} whileTap={{ scale: 0.95 }} onClick={() => toggleCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedCategories.includes(cat) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>
            <Button onClick={createGame} disabled={!name.trim() || selectedCategories.length === 0 || loading}
              className="w-full h-14 text-lg font-bold rounded-2xl">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'צור משחק'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      <CopyrightFooter />
    </div>
  );
};

export default HostGame;
