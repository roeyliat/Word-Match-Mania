import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CopyrightFooter from '@/components/CopyrightFooter';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { generatePin } from '@/lib/gameUtils';
import { generateDeck } from '@/lib/deckGenerator';
import { ALL_CATEGORIES, GameSettings } from '@/lib/gameTypes';
import { ArrowRight, Copy, Check, Loader2 } from 'lucide-react';

const CreateRoom = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...ALL_CATEGORIES]);
  const [excludeHardLetters, setExcludeHardLetters] = useState(false);
  const [studentCanFlip, setStudentCanFlip] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const createRoom = async () => {
    if (!name.trim() || selectedCategories.length === 0) return;
    setLoading(true);

    const newPin = generatePin();
    const settings: GameSettings = {
      categories: selectedCategories,
      excludedLetters: [],
      studentCanFlip,
      timerSeconds,
      playMode: 'oral',
      playerNames: [name.trim(), ''],
    };
    const deck = generateDeck(settings);

    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        pin: newPin,
        therapist_name: name.trim(),
        settings: settings as any,
        deck_state: deck as any,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      setLoading(false);
      return;
    }

    setPin(newPin);
    setRoomId(data.id);
    setLoading(false);

    // Subscribe to wait for student
    const channel = supabase
      .channel(`room-${data.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${data.id}` },
        (payload) => {
          if (payload.new.student_name) {
            channel.unsubscribe();
            navigate(`/game/${data.id}?role=therapist`);
          }
        }
      )
      .subscribe();
  };

  const copyPin = () => {
    if (pin) {
      navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (pin && roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center game-bg p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <Card className="border-2 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl">ממתין לשחקן...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">שתף את הקוד עם התלמיד</p>
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                  className="text-6xl font-black tracking-[0.3em] text-primary dir-ltr"
                  style={{ direction: 'ltr' }}
                >
                  {pin}
                </motion.div>
                <Button variant="ghost" size="icon" onClick={copyPin}>
                  {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center game-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>

        <Card className="border-2 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl">צור חדר חדש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">השם שלך</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="הכנס את שמך..."
                className="h-12 text-lg rounded-xl"
              />
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">קטגוריות</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(cat => (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedCategories.includes(cat)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">הסר אותיות קשות (ז, ט)</Label>
                <Switch checked={excludeHardLetters} onCheckedChange={setExcludeHardLetters} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">התלמיד יכול להפוך קלפים</Label>
                <Switch checked={studentCanFlip} onCheckedChange={setStudentCanFlip} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">טיימר לכל קלף</Label>
                <Select
                  value={timerSeconds === null ? 'off' : String(timerSeconds)}
                  onValueChange={(v) => setTimerSeconds(v === 'off' ? null : Number(v))}
                >
                  <SelectTrigger className="w-28 h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">ללא</SelectItem>
                    <SelectItem value="10">10 שניות</SelectItem>
                    <SelectItem value="15">15 שניות</SelectItem>
                    <SelectItem value="20">20 שניות</SelectItem>
                    <SelectItem value="30">30 שניות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Create */}
            <Button
              onClick={createRoom}
              disabled={!name.trim() || selectedCategories.length === 0 || loading}
              className="w-full h-14 text-lg font-bold rounded-2xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'צור חדר'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      <CopyrightFooter />
    </div>
  );
};

export default CreateRoom;
