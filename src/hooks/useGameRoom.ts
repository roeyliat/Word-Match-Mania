import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRoom, GameCard, GameSettings } from '@/lib/gameTypes';

function normalizeRoom(d: Record<string, unknown>, prev?: GameRoom | null): GameRoom {
  return {
    ...(prev ?? {}),
    ...d,
    // Large unchanged JSONB columns are omitted from realtime payloads (Postgres
    // TOAST), so keep the previous values when they are absent.
    settings: (d.settings ?? prev?.settings) as unknown as GameSettings,
    deck_state: (d.deck_state ?? prev?.deck_state) as unknown as GameCard[],
    current_flipped_card: (d.current_flipped_card ?? null) as unknown as GameCard | null,
    status: d.status as GameRoom['status'],
  } as GameRoom;
}

/** Subscribes to a single game room and keeps it in sync via realtime. */
export function useGameRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<GameRoom | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let active = true;

    const fetchRoom = async () => {
      const { data } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
      if (data && active) setRoom(prev => normalizeRoom(data, prev));
    };
    fetchRoom();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => setRoom(prev => normalizeRoom(payload.new, prev))
      )
      .subscribe();

    return () => { active = false; channel.unsubscribe(); };
  }, [roomId]);

  return room;
}
