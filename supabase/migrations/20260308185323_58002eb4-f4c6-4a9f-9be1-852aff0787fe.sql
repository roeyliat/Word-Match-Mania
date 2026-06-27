
-- Create game_rooms table for real-time multiplayer card game
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pin TEXT NOT NULL UNIQUE,
  therapist_name TEXT NOT NULL,
  student_name TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  deck_state JSONB NOT NULL DEFAULT '[]',
  current_card_index INTEGER NOT NULL DEFAULT 0,
  current_flipped_card JSONB,
  therapist_score INTEGER NOT NULL DEFAULT 0,
  student_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read game rooms (anonymous game, need to see state)
CREATE POLICY "Anyone can read game rooms"
  ON public.game_rooms FOR SELECT
  USING (true);

-- Allow anyone to insert game rooms (therapist creates room anonymously)
CREATE POLICY "Anyone can create game rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update game rooms (both players update state)
CREATE POLICY "Anyone can update game rooms"
  ON public.game_rooms FOR UPDATE
  USING (true);

-- Allow anyone to delete game rooms
CREATE POLICY "Anyone can delete game rooms"
  ON public.game_rooms FOR DELETE
  USING (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
