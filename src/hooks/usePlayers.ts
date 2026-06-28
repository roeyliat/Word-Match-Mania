import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/lib/multiplayer';

/** Subscribes to the players of a room, applying realtime changes incrementally. */
export function usePlayers(roomId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!roomId) return;
    let active = true;

    const fetchPlayers = async () => {
      const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
      if (data && active) setPlayers(data as Player[]);
    };
    fetchPlayers();

    const channel = supabase
      .channel(`players-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setPlayers(prev => {
            if (payload.eventType === 'DELETE') {
              return prev.filter(p => p.id !== (payload.old as Player).id);
            }
            const row = payload.new as Player;
            const exists = prev.some(p => p.id === row.id);
            return exists ? prev.map(p => (p.id === row.id ? row : p)) : [...prev, row];
          });
        }
      )
      .subscribe();

    return () => { active = false; channel.unsubscribe(); };
  }, [roomId]);

  return players;
}
