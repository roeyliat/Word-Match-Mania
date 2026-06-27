import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CopyrightFooter from '@/components/CopyrightFooter';
import { usePlayers } from '@/hooks/usePlayers';
import { avgReactionMs, formatMs, sortPlayers, LeaderboardSort } from '@/lib/multiplayer';
import { Home, Trophy, Zap, Star } from 'lucide-react';

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const meId = searchParams.get('me');
  const isHost = searchParams.get('host') === '1';

  const players = usePlayers(roomId);
  const [sort, setSort] = useState<LeaderboardSort>('score');

  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }, []);

  const ranked = sortPlayers(players, sort);

  return (
    <div className="flex flex-col min-h-screen game-bg p-4">
      <div className="w-full max-w-lg mx-auto space-y-5 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <Trophy className="w-12 h-12 text-game-yellow mx-auto" />
          <h1 className="text-3xl font-black text-foreground">טבלת התוצאות</h1>
          <p className="text-muted-foreground">{players.length} שחקנים</p>
        </motion.div>

        {/* Sort toggle */}
        <div className="flex justify-center gap-2">
          <Button
            variant={sort === 'score' ? 'default' : 'outline'}
            onClick={() => setSort('score')}
            className="gap-2 rounded-xl font-bold"
          >
            <Star className="w-4 h-4" /> לפי ניקוד
          </Button>
          <Button
            variant={sort === 'speed' ? 'default' : 'outline'}
            onClick={() => setSort('speed')}
            className="gap-2 rounded-xl font-bold"
          >
            <Zap className="w-4 h-4" /> לפי מהירות
          </Button>
        </div>

        <div className="space-y-2">
          {ranked.length === 0 && (
            <p className="text-center text-muted-foreground py-8">אין עדיין תוצאות</p>
          )}
          {ranked.map((p, i) => {
            const isMe = p.id === meId;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.6) }}
              >
                <Card className={`border-2 rounded-2xl ${isMe ? 'border-primary bg-primary/5' : ''}`}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="w-9 text-center text-xl font-black">
                      {i < 3 ? MEDALS[i] : <span className="text-muted-foreground">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">
                        {p.name} {isMe && <span className="text-primary text-sm">(אתה)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.answers_count > 0 ? `${formatMs(avgReactionMs(p))} בממוצע · ${p.answers_count} סבבים` : 'לא ענה'}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-black text-primary tabular-nums">{p.score}</div>
                      <div className="text-xs text-muted-foreground">נק'</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2 rounded-2xl font-bold">
            <Home className="w-4 h-4" /> דף הבית
          </Button>
          <Button onClick={() => navigate(isHost ? '/host' : '/play')} className="rounded-2xl font-bold">
            {isHost ? 'משחק חדש' : 'שחק שוב'}
          </Button>
        </div>
      </div>
      <CopyrightFooter />
    </div>
  );
};

export default Leaderboard;
