// Kahoot-style multiplayer: scoring + shared types.

export interface Player {
  id: string;
  room_id: string;
  name: string;
  score: number;
  total_time_ms: number;
  answers_count: number;
  last_answered_index: number;
  created_at: string;
}

export const MAX_PLAYERS = 100;

// Time window (ms) used for the speed-based score curve.
export const ROUND_MAX_MS = 12000;

/**
 * Kahoot-style points: a fast tap is worth ~1000, decaying to ~500 at the end
 * of the window, with a 100-point floor for late taps. Always rewards answering.
 */
export function computePoints(reactionMs: number, maxMs: number = ROUND_MAX_MS): number {
  const clamped = Math.max(0, Math.min(reactionMs, maxMs));
  const points = Math.round(1000 - (clamped / maxMs) * 500);
  return Math.max(100, points);
}

/** Average reaction time in ms (0 if the player never answered). */
export function avgReactionMs(player: Pick<Player, 'total_time_ms' | 'answers_count'>): number {
  return player.answers_count > 0 ? Math.round(player.total_time_ms / player.answers_count) : 0;
}

export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export type LeaderboardSort = 'score' | 'speed';

export function sortPlayers(players: Player[], sort: LeaderboardSort): Player[] {
  const arr = [...players];
  if (sort === 'speed') {
    // Quickest first: players who answered, ranked by average reaction time.
    return arr.sort((a, b) => {
      if (a.answers_count === 0 && b.answers_count === 0) return b.score - a.score;
      if (a.answers_count === 0) return 1;
      if (b.answers_count === 0) return -1;
      const diff = avgReactionMs(a) - avgReactionMs(b);
      return diff !== 0 ? diff : b.score - a.score;
    });
  }
  // By score, tie-broken by quicker total time.
  return arr.sort((a, b) => (b.score - a.score) || (a.total_time_ms - b.total_time_ms));
}
