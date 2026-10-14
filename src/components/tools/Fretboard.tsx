import React from 'react';
import type { FretboardData, FretboardNote, FretboardPosition } from './toolContracts';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_COLORS: Record<string, string> = {
  C: '#9ac34a', 'C#': '#7b61a8', D: '#7654a4', 'D#': '#597fc3', E: '#547bc2',
  F: '#e45459', 'F#': '#ea727d', G: '#304b80', 'G#': '#4b6795', A: '#f08b3e',
  'A#': '#f1a15a', B: '#999999',
};

const includesPosition = (positions: FretboardPosition[] | undefined, stringId: string, fret: number) =>
  positions?.some((position) => position.stringId === stringId && position.fret === fret) ?? false;

export interface FretboardProps extends FretboardData {
  onSelectPosition?: (position: FretboardPosition) => void;
}

/** Data-driven fretboard. It owns no lesson or microphone state. */
export const Fretboard: React.FC<FretboardProps> = ({
  tuning, maxFret, notes, noteDisplay = 'all', visiblePositions = [], highlightedPositions = [],
  detectedPosition, targetPositions = [], interactive = false, onSelectPosition,
}) => {
  const positions: FretboardNote[] = notes ?? tuning.flatMap((string) => Array.from({ length: maxFret + 1 }, (_, fret) => ({
    stringId: string.id, fret, midi: string.openMidi + fret,
  })));
  const noteAt = (stringId: string, fret: number) => positions.find((note) => note.stringId === stringId && note.fret === fret);

  return <div className="overflow-x-auto rounded-2xl bg-[#171a1e] p-3"><div className="min-w-[560px]">
    <div className="grid gap-1 mb-2 text-center text-[9px] font-bold text-gray-400" style={{ gridTemplateColumns: `40px repeat(${maxFret + 1}, minmax(0,1fr))` }}>
      <span>STRING</span>{Array.from({ length: maxFret + 1 }, (_, fret) => <span key={fret}>{fret === 0 ? 'OPEN' : fret}</span>)}
    </div>
    {tuning.map((string) => <div key={string.id} className="grid gap-1 items-center h-10 relative" style={{ gridTemplateColumns: `40px repeat(${maxFret + 1}, minmax(0,1fr))` }}>
      <span className="text-[10px] font-black text-gray-300">{string.label}</span>
      {Array.from({ length: maxFret + 1 }, (_, fret) => {
        const note = noteAt(string.id, fret);
        const midi = note?.midi ?? string.openMidi + fret;
        const name = NOTE_NAMES[((midi % 12) + 12) % 12];
        const hasNoteData = notes === undefined || note !== undefined;
        const showLabel = hasNoteData && (noteDisplay === 'all' || (noteDisplay === 'selected' && includesPosition(visiblePositions, string.id, fret)));
        const selected = includesPosition(highlightedPositions, string.id, fret) ||
          (detectedPosition?.stringId === string.id && detectedPosition.fret === fret) ||
          includesPosition(targetPositions, string.id, fret);
        const roleClass = note?.role === 'root' ? 'ring-2 ring-amber-300' : note?.role === 'target' ? 'ring-2 ring-white' : '';
        return <button key={fret} type="button" disabled={!interactive} onClick={() => onSelectPosition?.({ stringId: string.id, fret })}
          aria-label={`${string.label} string fret ${fret}: ${note?.label ?? name}`} aria-pressed={selected}
          className={`relative h-full flex items-center justify-center ${fret === 0 ? 'border-l-2 border-gray-400' : 'border-l border-gray-600'} ${interactive ? 'cursor-pointer' : 'cursor-default'}`}>
          {showLabel && <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white transition-all ${selected ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-[#171a1e] shadow-lg' : 'opacity-80'} ${roleClass}`} style={{ backgroundColor: NOTE_COLORS[name] }}>
            {note?.label ?? name}
          </div>}
        </button>;
      })}
      <div className="absolute left-[38px] right-0 top-1/2 h-[2px] bg-gray-400/70 -translate-y-1/2 -z-0 pointer-events-none" />
    </div>)}
  </div></div>;
};

