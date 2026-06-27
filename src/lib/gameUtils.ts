export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  red: {
    bg: 'bg-game-red',
    text: 'text-game-red',
    border: 'border-game-red',
  },
  blue: {
    bg: 'bg-game-blue',
    text: 'text-game-blue',
    border: 'border-game-blue',
  },
  green: {
    bg: 'bg-game-green',
    text: 'text-game-green',
    border: 'border-game-green',
  },
};
