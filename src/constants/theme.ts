// Centralized Global Color Theme for Yousician & GuitarTuna Strings & Notes

export interface StringColorDefinition {
  name: string;
  octave: number;
  note: string;
  freq: number;
  color: string; // Vibrant hex color
  bgColor: string; // Background / accent tint
  borderColor: string;
  stringIndex: number;
}

export const STRING_COLORS: Record<string, StringColorDefinition> = {
  E: {
    name: 'E',
    octave: 2,
    note: 'E2',
    freq: 82.41,
    color: '#ef4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    stringIndex: 0,
  },
  A: {
    name: 'A',
    octave: 2,
    note: 'A2',
    freq: 110.00,
    color: '#facc15', // Yellow
    bgColor: 'rgba(250, 204, 21, 0.2)',
    borderColor: 'rgba(250, 204, 21, 0.5)',
    stringIndex: 1,
  },
  D: {
    name: 'D',
    octave: 3,
    note: 'D3',
    freq: 146.83,
    color: '#ffffff', // Silver / White
    bgColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    stringIndex: 2,
  },
  G: {
    name: 'G',
    octave: 3,
    note: 'G3',
    freq: 196.00,
    color: '#f97316', // Orange (Matches Screenshot G string)
    bgColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: 'rgba(249, 115, 22, 0.5)',
    stringIndex: 3,
  },
  B: {
    name: 'B',
    octave: 3,
    note: 'B3',
    freq: 246.94,
    color: '#38bdf8', // Cyan / Light Blue
    bgColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: 'rgba(56, 189, 248, 0.5)',
    stringIndex: 4,
  },
  e: {
    name: 'e',
    octave: 4,
    note: 'E4',
    freq: 329.63,
    color: '#a855f7', // Purple (High e)
    bgColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
    stringIndex: 5,
  },
};

export const ORDERED_GUITAR_STRINGS = [
  STRING_COLORS.E,
  STRING_COLORS.A,
  STRING_COLORS.D,
  STRING_COLORS.G,
  STRING_COLORS.B,
  STRING_COLORS.e,
];

// Helper to look up string color by name or index
export function getStringColor(stringNameOrIndex: string | number): StringColorDefinition {
  if (typeof stringNameOrIndex === 'number') {
    return ORDERED_GUITAR_STRINGS[stringNameOrIndex] || STRING_COLORS.E;
  }
  const match = STRING_COLORS[stringNameOrIndex] || STRING_COLORS[stringNameOrIndex.toUpperCase()];
  if (match) return match;
  if (stringNameOrIndex.toLowerCase() === 'e') {
    return stringNameOrIndex === 'e' ? STRING_COLORS.e : STRING_COLORS.E;
  }
  return STRING_COLORS.E;
}
