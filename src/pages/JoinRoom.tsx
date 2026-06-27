import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CopyrightFooter from '@/components/CopyrightFooter';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2 } from 'lucide-react';

const JoinRoom = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const joinRoom = async () => {
    if (!name.trim() || pin.length !== 4) return;
    setLoading(true);
    setError('');

    const { data: room, error: fetchError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('pin', pin)
      .eq('status', 'waiting')
      .maybeSingle();

    if (fetchError || !room) {
      setError('לא נמצא חדר עם הקוד הזה');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        student_name: name.trim(),
        status: 'playing',
      })
      .eq('id', room.id);

    if (updateError) {
      setError('שגיאה בהצטרפות לחדר');
      setLoading(false);
      return;
    }

    navigate(`/game/${room.id}?role=student`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center game-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>

        <Card className="border-2 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl">הצטרף לחדר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">השם שלך</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="הכנס את שמך..."
                className="h-12 text-lg rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">קוד חדר</Label>
              <Input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="הכנס קוד 4 ספרות"
                className="h-14 text-3xl text-center font-black tracking-[0.3em] rounded-xl"
                style={{ direction: 'ltr' }}
                maxLength={4}
                inputMode="numeric"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm font-medium text-center">{error}</p>
            )}

            <Button
              onClick={joinRoom}
              disabled={!name.trim() || pin.length !== 4 || loading}
              className="w-full h-14 text-lg font-bold rounded-2xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'הצטרף'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      <CopyrightFooter />
    </div>
  );
};

export default JoinRoom;
