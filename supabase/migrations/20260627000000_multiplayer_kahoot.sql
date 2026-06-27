-- Kahoot-style multiplayer support: many players per room, per-player score + reaction time.

-- Extend game_rooms: distinguish modes and track when the current round (card) was revealed.
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'duo';
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS round_started_at TIMESTAMP WITH TIME ZONE;

-- Per-player state for a multiplayer room.
CREATE TABLE IF NOT EXISTS public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_time_ms INTEGER NOT NULL DEFAULT 0,
  answers_count INTEGER NOT NULL DEFAULT 0,
  last_answered_index INTEGER NOT NULL DEFAULT -1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS players_room_id_idx ON public.players(room_id);

-- Anonymous game: anyone may read/write (mirrors game_rooms policies).
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read players" ON public.players;
CREATE POLICY "Anyone can read players" ON public.players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create players" ON public.players;
CREATE POLICY "Anyone can create players" ON public.players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete players" ON public.players;
CREATE POLICY "Anyone can delete players" ON public.players FOR DELETE USING (true);

-- Enable realtime for the players table (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
  END IF;
END $$;
