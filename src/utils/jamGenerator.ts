import type { JamRound, LessonNote } from '../types';

export const JAM_MATERIALS = ['Major scale', 'Natural minor', 'Minor pentatonic', 'Blues scale', 'Dorian mode', 'Major triad', 'Minor triad', 'Seventh chords'] as const;
export type JamMaterial = typeof JAM_MATERIALS[number];

export const RHYTHMIC_FIGURES = [
  { id: 'whole', beats: 4, weight: 1, name: 'Whole note', restName: 'Whole rest', beatLabel: '4 beats', flags: 0, dotted: false, head: 'open', restBase: 'whole', tupletCount: 1 },
  { id: 'half', beats: 2, weight: 2, name: 'Half note', restName: 'Half rest', beatLabel: '2 beats', flags: 0, dotted: false, head: 'open', restBase: 'half', tupletCount: 1 },
  { id: 'quarter', beats: 1, weight: 4, name: 'Quarter note', restName: 'Quarter rest', beatLabel: '1 beat', flags: 0, dotted: false, head: 'filled', restBase: 'quarter', tupletCount: 1 },
  { id: 'eighth', beats: 0.5, weight: 4, name: 'Eighth note', restName: 'Eighth rest', beatLabel: '½ beat', flags: 1, dotted: false, head: 'filled', restBase: 'eighth', tupletCount: 1 },
  { id: 'eighth-triplet', beats: 1 / 3, weight: 2, name: 'Eighth-note triplet', restName: 'Eighth-triplet rest', beatLabel: '3 in 1 beat', flags: 1, dotted: false, head: 'filled', restBase: 'eighth', tupletCount: 3, tupletGroupBeats: 1 },
  { id: 'sixteenth', beats: 0.25, weight: 3, name: 'Sixteenth note', restName: 'Sixteenth rest', beatLabel: '¼ beat', flags: 2, dotted: false, head: 'filled', restBase: 'sixteenth', tupletCount: 1 },
  { id: 'sixteenth-triplet', beats: 1 / 6, weight: 1.5, name: 'Sixteenth-note triplet', restName: 'Sixteenth-triplet rest', beatLabel: '3 in ½ beat', flags: 2, dotted: false, head: 'filled', restBase: 'sixteenth', tupletCount: 3, tupletGroupBeats: 0.5 },
  { id: 'thirty-second', beats: 0.125, weight: 1, name: 'Thirty-second note', restName: 'Thirty-second rest', beatLabel: '⅛ beat', flags: 3, dotted: false, head: 'filled', restBase: 'thirty-second', tupletCount: 1 },
  { id: 'dotted-half', beats: 3, weight: 1, name: 'Dotted half note', restName: 'Dotted half rest', beatLabel: '3 beats', flags: 0, dotted: true, head: 'open', restBase: 'half', tupletCount: 1 },
  { id: 'dotted-quarter', beats: 1.5, weight: 2, name: 'Dotted quarter note', restName: 'Dotted quarter rest', beatLabel: '1½ beats', flags: 0, dotted: true, head: 'filled', restBase: 'quarter', tupletCount: 1 },
  { id: 'dotted-eighth', beats: 0.75, weight: 2, name: 'Dotted eighth note', restName: 'Dotted eighth rest', beatLabel: '¾ beat', flags: 1, dotted: true, head: 'filled', restBase: 'eighth', tupletCount: 1 },
];
export type RhythmicFigure = typeof RHYTHMIC_FIGURES[number];

const DEGREES: Record<JamMaterial, number[]> = {
  'Major scale': [0,2,4,5,7,9,11,12],
  'Natural minor': [0,2,3,5,7,8,10,12],
  'Minor pentatonic': [0,3,5,7,10,12],
  'Blues scale': [0,3,5,6,7,10,12],
  'Dorian mode': [0,2,3,5,7,9,10,12],
  'Major triad': [0,4,7,12,7,4,0],
  'Minor triad': [0,3,7,12,7,3,0],
  'Seventh chords': [0,4,7,10,12,10,7,4],
};
const OPEN_MIDI = [40,45,50,55,59,64];
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export function generateJamSequence(root: number, materials: JamMaterial[], tempo: number, notesPerMaterial = 8, leadInSeconds = 0.6): LessonNote[] {
  const selected: JamMaterial[] = materials.length ? materials : ['Major scale'];
  const safeTempo = Math.max(40, Math.min(220, tempo));
  const output: LessonNote[] = [];
  selected.forEach((material, blockIndex) => {
    const degrees = DEGREES[material];
    for (let index = 0; index < notesPerMaterial; index++) {
      const semitones = degrees[index % degrees.length];
      const pitchClass = ((root + semitones) % 12 + 12) % 12;
      const preferredString = (index + blockIndex * 2) % OPEN_MIDI.length;
      const candidates = OPEN_MIDI.map((openMidi, stringIndex) => ({ stringIndex, fret: (pitchClass - openMidi % 12 + 12) % 12 }))
        .sort((a,b) => Number(a.fret > 7) - Number(b.fret > 7) || Math.abs(a.stringIndex-preferredString)-Math.abs(b.stringIndex-preferredString));
      const position = candidates[0];
      const midi = OPEN_MIDI[position.stringIndex] + position.fret;
      output.push({
        time: leadInSeconds + output.length * (30 / safeTempo),
        stringIndex: position.stringIndex,
        fret: position.fret,
        duration: 30 / safeTempo,
        noteName: `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`,
        materialIndex: blockIndex,
        technique: 'normal',
      });
    }
  });
  return output;
}

export function shuffleMaterials(materials: JamMaterial[]): JamMaterial[] {
  const shuffled = [...materials];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

/** Build one varied phrase from the selected scale, triad, and chord materials. */
export function composeJamRound(root: number, available: JamMaterial[], tempo: number, number: number, startTime: number): JamRound {
  const pool = available.length ? available : [...JAM_MATERIALS];
  const triadPool = pool.filter((material) => /triad/i.test(material));
  const chordPool = pool.filter((material) => /chord/i.test(material) && !/triad/i.test(material));
  const scalePool = pool.filter((material) => !/triad|chord/i.test(material));
  const composition: JamMaterial[] = [];
  const addRandom = (candidates: JamMaterial[]) => {
    if (!candidates.length) return;
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    if (!composition.includes(choice)) composition.push(choice);
  };

  // A round draws from each enabled family so it feels like a musical workout,
  // then fills any remaining slots from the user's selected material.
  addRandom(scalePool);
  addRandom(triadPool);
  addRandom(chordPool);
  for (const material of shuffleMaterials(pool)) {
    if (composition.length >= Math.min(3, pool.length)) break;
    if (!composition.includes(material)) composition.push(material);
  }
  const materials = shuffleMaterials(composition);
  const phrase = generateJamSequence(root, materials, tempo, 8, 0);
  const safeTempo = Math.max(40, Math.min(220, tempo));
  const secondsPerQuarter = 60 / safeTempo;
  let elapsed = 0;
  let lastWasRest = false;
  let tupletSerial = 0;
  const notes: LessonNote[] = [];
  const weightedChoice = (figures: readonly RhythmicFigure[]) => {
    const roll = Math.random() * figures.reduce((sum, figure) => sum + figure.weight, 0);
    let cumulativeWeight = 0;
    return figures.find((candidate) => {
      cumulativeWeight += candidate.weight;
      return roll < cumulativeWeight;
    }) ?? figures[0];
  };

  for (let index = 0; index < phrase.length;) {
    const note = phrase[index];
    const sameMaterialCount = phrase.slice(index).findIndex((candidate) => candidate.materialIndex !== note.materialIndex);
    const availableInMaterial = sameMaterialCount < 0 ? phrase.length - index : sameMaterialCount;
    const canUseTuplet = availableInMaterial >= 3;
    const candidates = canUseTuplet ? RHYTHMIC_FIGURES : RHYTHMIC_FIGURES.filter((figure) => figure.tupletCount === 1);
    const figure = weightedChoice(candidates);
    const eventCount = figure.tupletCount;
    const tupletGroupId = eventCount === 3 ? `round-${number}-tuplet-${tupletSerial++}` : undefined;
    const groupIsRest: boolean = !lastWasRest && Math.random() < 0.12;

    for (let offset = 0; offset < eventCount; offset++) {
      const source = phrase[index + offset];
      const isRest: boolean = eventCount === 3 ? groupIsRest : !lastWasRest && Math.random() < 0.12;
      lastWasRest = isRest;
      const duration = figure.beats * secondsPerQuarter;
      notes.push({
        ...source,
        time: startTime + elapsed,
        duration,
        rhythmFigureId: figure.id,
        isRest,
        tupletGroupId,
        tupletCount: eventCount === 3 ? 3 : undefined,
      });
      elapsed += duration;
    }
    index += eventCount;
  }
  const endTime = notes.length ? notes[notes.length - 1].time + notes[notes.length - 1].duration : startTime;
  return { number, materials, startTime, endTime, notes };
}
