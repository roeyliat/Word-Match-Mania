import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CopyrightFooter from '@/components/CopyrightFooter';
import { CategoryCard, LettersGrid } from '@/components/game/GameCard';
import { supabase } from '@/integrations/supabase/client';
import { useGameRoom } from '@/hooks/useGameRoom';
import { usePlayers } from '@/hooks/usePlayers';
import { computePoints, sortPlayers } from '@/lib/multiplayer';
import { playAwardSound } from '@/lib/sounds';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, Hand, Check } from 'lucide-react';

const STORAGE_KEY = 'wmm_player';

const PlayGame = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [now, setNow] = useState(Date.now());

  const room = useGameRoom(roomId ?? undefined);
  const players = usePlayers(roomId ?? undefined);
  const me = players.find(p => p.id === playerId) ?? null;
  const playMode = room?.settings?.playMode ?? 'oral';

  // Resume an in-progress session after a reload.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { roomId: rid, playerId: pid } = JSON.parse(saved);
        if (rid && pid) { setRoomId(rid); setPlayerId(pid); }
      } catch { /* ignore */ }
    }
  }, []);

  // Live clock for the reaction timer while a round is open.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const join = async () => {
    if (!name.trim() || pin.trim().length !== 4) return;
    setLoading(true);
    const { data: rooms } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('pin', pin.trim())
      .eq('mode', 'multi')
      .in('status', ['waiting', 'playing'])
      .limit(1);
    const found = rooms?.[0];
    if (!found) {
      setLoading(false);
      toast({ title: 'לא נמצא משחק עם הקוד הזה', variant: 'destructive' });
      return;
    }
    const { data: player, error } = await supabase
      .from('players')
      .insert({ room_id: found.id, name: name.trim() })
      .select()
      .single();
    setLoading(false);
    if (error || !player) {
      toast({ title: 'שגיאה בהצטרפות', variant: 'destructive' });
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId: found.id, playerId: player.id }));
    setRoomId(found.id);
    setPlayerId(player.id);
  };

  const leave = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRoomId(null);
    setPlayerId(null);
    navigate('/');
  };

  const answer = async () => {
    if (!room || !me || !room.round_started_at) return;
    if (me.last_answered_index === room.current_card_index) return;
    if (playMode === 'typing' && !typed.trim()) return;
    setTyped('');
    const reaction = Math.max(0, Date.now() - new Date(room.round_started_at).getTime());
    const points = computePoints(reaction);
    setLastPoints(points);
    playAwardSound();
    await supabase
      .from('players')
      .update({
        score: me.score + points,
        total_time_ms: me.total_time_ms + reaction,
        answers_count: me.answers_count + 1,
        last_answered_index: room.current_card_index,
      })
      .eq('id', me.id);
  };

  // Go to results when the game ends.
  useEffect(() => {
    if (room?.status === 'finished' && roomId && playerId) {
      localStorage.removeItem(STORAGE_KEY);
      navigate(`/leaderboard/${roomId}?me=${playerId}`);
    }
  }, [room?.status, roomId, playerId, navigate]);

  // ─── Join form ───
  if (!roomId || !playerId) {
    return (
      <div className="flex min-h-screen items-center justify-center game-bg p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowRight className="w-4 h-4" /> חזרה
          </Button>
          <Card className="border-2 rounded-3xl">
            <CardHeader><CardTitle className="text-2xl">הצטרף למשחק</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">השם שלך</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="הכנס את שמך..." className="h-12 text-lg rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">קוד משחק</Label>
                <Input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric" placeholder="הכנס קוד 4 ספרות"
                  className="h-12 text-lg rounded-xl tracking-[0.3em] text-center" style={{ direction: 'ltr' }} />
              </div>
              <Button onClick={join} disabled={!name.trim() || pin.trim().length !== 4 || loading}
                className="w-full h-14 text-lg font-bold rounded-2xl">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'הצטרף'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        <CopyrightFooter />
      </div>
    );
  }

  const rank = me ? sortPlayers(players, 'score').findIndex(p => p.id === me.id) + 1 : 0;
  const card = room?.current_flipped_card ?? null;
  const answeredThisRound = !!me && !!room && me.last_answered_index === room.current_card_index;
  const canAnswer = room?.status === 'playing' && !!card && !answeredThisRound;
  const elapsed = room?.round_started_at ? Math.max(0, now - new Date(room.round_started_at).getTime()) : 0;

  // ─── Waiting for host to start ───
  if (room?.status === 'waiting' || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center game-bg p-4 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="text-2xl font-black text-foreground">שלום {me?.name ?? name}! 👋</div>
          <p className="text-muted-foreground">ממתין שהמנחה יתחיל את המשחק...</p>
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <Button variant="ghost" onClick={leave} className="text-muted-foreground">יציאה</Button>
        </motion.div>
      </div>
    );
  }

  // ─── Active round ───
  return (
    <div className="flex flex-col min-h-screen game-bg p-4">
      <div className="flex justify-between items-center">
        <div className="bg-white/70 rounded-2xl px-4 py-2 card-shadow">
          <span className="text-xs text-muted-foreground">ניקוד</span>
          <div className="text-xl font-black text-primary tabular-nums">{me?.score ?? 0}</div>
        </div>
        <div className="bg-white/70 rounded-2xl px-4 py-2 card-shadow text-center">
          <span className="text-xs text-muted-foreground">דירוג</span>
          <div className="text-xl font-black text-foreground tabular-nums">#{rank || '-'}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {card && (
          <div className="flex items-center justify-center gap-3 sm:gap-5 scale-90 sm:scale-100">
            <LettersGrid card={card} />
            <CategoryCard card={card} />
          </div>
        )}

        {canAnswer ? (
          playMode === 'typing' ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <div className="text-lg font-bold text-muted-foreground tabular-nums">⏱ {(elapsed / 1000).toFixed(1)}s</div>
              <Input
                value={typed}
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && answer()}
                placeholder={`הקלד מילה מקטגוריית ${card?.sideA.category ?? ''}...`}
                autoFocus
                className="h-14 text-lg font-bold rounded-2xl text-center card-shadow border-2"
              />
              <Button onClick={answer} disabled={!typed.trim()}
                className="w-full h-14 text-lg font-bold rounded-2xl gap-2 btn-press">
                <Check className="w-5 h-5" /> שלח
              </Button>
            </div>
          ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-lg font-bold text-muted-foreground tabular-nums">⏱ {(elapsed / 1000).toFixed(1)}s</div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={answer}
              className="w-48 h-48 rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center gap-2 card-shadow text-2xl font-black btn-press"
            >
              <Hand className="w-12 h-12" />
              יש לי!
            </motion.button>
            <p className="text-sm text-muted-foreground">תגיד מילה — ולחץ מהר ככל האפשר</p>
          </div>
          )
        ) : (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <Check className="w-12 h-12 text-accent" />
            </div>
            <div className="text-xl font-black text-foreground">ענית! {lastPoints !== null && <span className="text-primary">+{lastPoints}</span>}</div>
            <p className="text-muted-foreground">ממתין לסבב הבא...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlayGame;
