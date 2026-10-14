export type LearningChannel = 'think' | 'read' | 'hear' | 'speak' | 'play';
export type LessonTool = 'fretboard' | 'practice-lab';

export interface GuitarNoteCue {
  stringIndex: number;
  fret: number;
  noteName: string;
  octave: number;
  label: string;
}

export interface LessonActivity {
  id: string;
  conceptId: string;
  channel: LearningChannel;
  tool?: LessonTool;
  kind: 'choice' | 'perform';
  prompt: string;
  context: string;
  options?: { id: string; label: string }[];
  correctOptionId?: string;
  hint?: string;
  explanation: string;
  audioExample?: { notes?: GuitarNoteCue[]; chord?: string; chords?: { name: string; label: string }[]; demo?: 'timbre' | 'dynamics'; label: string };
  performance?: {
    instructions: string[];
    targetNote?: GuitarNoteCue;
    selfCheckLabel: string;
  };
}

export interface StarterLessonBlueprint {
  id: string;
  level: number;
  title: string;
  objective: string;
  concepts: string[];
  activityIds: string[];
  priority: 'foundation' | 'high';
}

export interface StarterWorkoutBlueprint {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  description: string;
  targetSkill: string;
  activityIds: string[];
  priorityOrder: number;
}

export interface LearningEvidenceEntry {
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  successfulReviews: number;
  lastResult: boolean | null;
  lastAttemptAt: number;
  nextReviewAt: number;
  source: 'mic' | 'self-report' | 'answer';
}

export type LearningEvidence = Record<string, LearningEvidenceEntry>;

const note = (stringIndex: number, fret: number, noteName: string, octave: number, label: string): GuitarNoteCue => ({
  stringIndex,
  fret,
  noteName,
  octave,
  label,
});

const C4 = note(4, 1, 'C', 4, 'B string · fret 1');
const G4 = note(5, 3, 'G', 4, 'high e string · fret 3');
const C5 = note(5, 8, 'C', 5, 'high e string · fret 8');
const G2 = note(0, 3, 'G', 2, 'low E string · fret 3');
const G3 = note(2, 5, 'G', 3, 'D string · fret 5');
const A2 = note(1, 0, 'A', 2, 'open A string');

export const STARTER_ACTIVITIES: LessonActivity[] = [
  {
    id: 'l1-pitch', conceptId: 'music.pitch', channel: 'think', kind: 'choice',
    prompt: 'Which question checks pitch?', context: 'Pitch is about the notes and note patterns you intended to play.',
    options: [{ id: 'right-notes', label: 'Did I play the right notes?' }, { id: 'steady-beat', label: 'Did I keep with the beat?' }, { id: 'loudness', label: 'Did I play at the right volume?' }],
    correctOptionId: 'right-notes', hint: 'Think about high/low notes and whether the notes matched the music.',
    explanation: 'Pitch asks whether the notes were correct. Beat and volume belong to other musical areas.',
  },
  {
    id: 'l1-rhythm', conceptId: 'music.rhythm', channel: 'think', kind: 'choice',
    prompt: 'Which question checks rhythm?', context: 'Rhythm organizes sound and silence through time.',
    options: [{ id: 'tone', label: 'How did my guitar sound?' }, { id: 'beat', label: 'Did I keep with the beat?' }, { id: 'read', label: 'Could I read the written music?' }],
    correctOptionId: 'beat', hint: 'Rhythm is about pulse, timing, and note duration.',
    explanation: 'Keeping with the beat is a rhythm check.',
  },
  {
    id: 'l1-timbre', conceptId: 'music.timbre', channel: 'hear', kind: 'choice',
    prompt: 'The same pitch is played with two different tone colors. Which area describes that difference?',
    context: 'Listen to a guitar-like tone and a pure tone. The note stays the same while its sound character changes.',
    options: [{ id: 'dynamics', label: 'Dynamics' }, { id: 'timbre', label: 'Timbre' }, { id: 'pitch', label: 'Pitch' }],
    correctOptionId: 'timbre', hint: 'The note and loudness stayed the same; only the sound color changed.',
    explanation: 'Timbre is sound character or tone quality. Dynamics describes loudness.',
    audioExample: { notes: [G4], demo: 'timbre', label: 'Compare two tone colors' },
  },
  {
    id: 'l1-dynamics', conceptId: 'music.dynamics', channel: 'hear', kind: 'choice',
    prompt: 'The same note is played softly and then loudly. What changed?',
    context: 'Listen to the same guitar-like pitch played softly and then loudly.',
    options: [{ id: 'dynamics', label: 'Dynamics' }, { id: 'notation', label: 'Notation' }, { id: 'technique', label: 'Technique' }],
    correctOptionId: 'dynamics', hint: 'Listen for a change in volume, not a different note.',
    explanation: 'Dynamics means volume or loudness.',
    audioExample: { notes: [G4], demo: 'dynamics', label: 'Hear soft and loud' },
  },
  {
    id: 'l1-technique', conceptId: 'music.technique', channel: 'think', kind: 'choice',
    prompt: 'Which area focuses on the physical control used to play?',
    context: 'Think about fretting, picking, hand coordination, and how the instrument is held.',
    options: [{ id: 'technique', label: 'Technique' }, { id: 'timbre', label: 'Timbre' }, { id: 'pitch', label: 'Pitch' }],
    correctOptionId: 'technique', hint: 'This area is about how your hands and body produce the notes.',
    explanation: 'Technique covers the physical actions and control used to play.',
  },
  {
    id: 'l1-notation', conceptId: 'music.notation', channel: 'read', kind: 'choice',
    tool: 'practice-lab',
    prompt: 'Which area asks whether you can understand the written music?',
    context: 'Written music can show pitch, rhythm, and performance instructions.',
    options: [{ id: 'notation', label: 'Notation' }, { id: 'rhythm', label: 'Rhythm' }, { id: 'dynamics', label: 'Dynamics' }],
    correctOptionId: 'notation', hint: 'This is the musical “reading” area.',
    explanation: 'Notation is the system for reading written musical information.',
  },
  {
    id: 'l1-full-phrase', conceptId: 'music.self-review', channel: 'play', kind: 'perform',
    tool: 'practice-lab',
    prompt: 'Play a short phrase you know, then review it as a musician.',
    context: 'This is a baseline reflection. The app does not claim to measure every quality of your playing.',
    explanation: 'Finishing a whole phrase and noticing one thing to improve turns practice into feedback.',
    performance: {
      instructions: ['Play a complete phrase without stopping.', 'Choose one area that felt strongest and one area to improve next.'],
      selfCheckLabel: 'I played a complete phrase and reviewed it',
    },
  },
  {
    id: 'l2-think', conceptId: 'pattern.root-fifth-octave', channel: 'think', kind: 'choice',
    tool: 'practice-lab',
    prompt: 'In the pattern 1–5–8, what does 5 name?', context: 'The numbers describe a pattern relative to its root.',
    options: [{ id: 'third', label: 'The third scale degree' }, { id: 'fifth', label: 'The fifth scale degree' }, { id: 'octave', label: 'The octave' }],
    correctOptionId: 'fifth', hint: 'Read the number as a scale degree above 1.',
    explanation: '5 is the fifth degree; 8 returns to the root one octave higher.',
  },
  {
    id: 'l2-read', conceptId: 'pattern.root-fifth-octave', channel: 'read', kind: 'choice',
    tool: 'fretboard',
    prompt: 'If C is degree 1, which notes spell 1–5–8?', context: 'Use the C major scale: C, D, E, F, G, A, B, C.',
    options: [{ id: 'c-e-c', label: 'C–E–C' }, { id: 'c-g-c', label: 'C–G–C' }, { id: 'c-f-c', label: 'C–F–C' }],
    correctOptionId: 'c-g-c', hint: 'Count C as 1 and continue alphabetically through the C major scale.',
    explanation: 'C–G–C is root, fifth, and octave.',
  },
  {
    id: 'l2-hear', conceptId: 'pattern.root-fifth-octave', channel: 'hear', kind: 'choice',
    tool: 'practice-lab',
    prompt: 'Listen to the played pattern. What happens at the final note?', context: 'Listen for how the last note relates to the first.',
    options: [{ id: 'same-register', label: 'It repeats the root in the same register' }, { id: 'fifth', label: 'It lands on the fifth' }, { id: 'octave', label: 'It returns to the root one octave higher' }],
    correctOptionId: 'octave', hint: 'Compare the last pitch with the first; they share a note name but differ in register.',
    explanation: 'The final C is the same pitch class as the first C, one octave above it.',
    audioExample: { notes: [C4, G4, C5], label: 'Play C–G–C' },
  },
  {
    id: 'l2-speak', conceptId: 'pattern.root-fifth-octave', channel: 'speak', kind: 'perform', tool: 'practice-lab',
    prompt: 'Name or sing the degrees in the pattern from memory.',
    context: 'Say or sing root, fifth, octave (1–5–8) before you play it.',
    explanation: 'Speaking or singing the relationship builds a separate recall path from reading or playing it.',
    audioExample: { notes: [C4, G4, C5], label: 'Hear C–G–C as a reference' },
    performance: { instructions: ['Name or sing 1, 5, 8 in order.', 'Say which note is the root and which is the fifth.'], selfCheckLabel: 'I named or sang the degrees' },
  },
  {
    id: 'l2-play', conceptId: 'pattern.root-fifth-octave', channel: 'play', kind: 'perform', tool: 'fretboard',
    prompt: 'Play the G that completes a C–G–C root–fifth–octave pattern.',
    context: 'Use the high e string, third fret. The reference tone is G4.',
    explanation: 'You played or self-checked the fifth in the pattern. Try moving the same relationship to another root later.',
    audioExample: { notes: [G4], label: 'Hear target G4' },
    performance: { instructions: ['Place a finger at fret 3 on the high e string.', 'Pluck once and let the note ring.'], targetNote: G4, selfCheckLabel: 'I played and checked the target note' },
  },
  {
    id: 'l2-transfer', conceptId: 'pattern.root-fifth-octave', channel: 'play', kind: 'perform', tool: 'fretboard',
    prompt: 'Play the 1–5–8 pattern from a root you choose, and say or sing the numbers as you play.',
    context: 'The important part is the relationship, not the starting fret.',
    explanation: 'Naming or singing the degrees helps connect the sound and movement to the pattern’s meaning.',
    performance: { instructions: ['Choose a comfortable root.', 'Play root, fifth, octave in order.', 'Say or sing 1, 5, 8.'], selfCheckLabel: 'I played and named the three degrees' },
  },
  {
    id: 'l3-open-strings', conceptId: 'guitar.standard-tuning', channel: 'think', kind: 'choice',
    tool: 'fretboard',
    prompt: 'Name the open strings from the thickest string to the thinnest.', context: 'Standard tuning uses six open notes.',
    options: [{ id: 'eadgbe', label: 'E–A–D–G–B–E' }, { id: 'eagdeb', label: 'E–A–G–D–E–B' }, { id: 'eadgce', label: 'E–A–D–G–C–E' }],
    correctOptionId: 'eadgbe', hint: 'Remember the unusual tuning step between G and B.',
    explanation: 'Standard guitar tuning, low to high, is E–A–D–G–B–E.',
  },
  {
    id: 'l3-fret-steps', conceptId: 'guitar.chromatic-map', channel: 'read', kind: 'choice',
    tool: 'fretboard',
    prompt: 'What note is at fret 3 on the low E string?', context: 'Each fret raises the pitch by one semitone.',
    options: [{ id: 'g2', label: 'G2' }, { id: 'f2', label: 'F2' }, { id: 'a2', label: 'A2' }],
    correctOptionId: 'g2', hint: 'Count E, F, F-sharp, G.',
    explanation: 'The low E string rises to F at fret 1, F-sharp at fret 2, and G at fret 3.',
  },
  {
    id: 'l3-cycle', conceptId: 'guitar.chromatic-map', channel: 'think', kind: 'choice', tool: 'fretboard',
    prompt: 'After the note B, what is the next note in the chromatic cycle?',
    context: 'The twelve-note sequence repeats after B, continuing with C in the next octave.',
    options: [{ id: 'c', label: 'C' }, { id: 'a', label: 'A' }, { id: 'd', label: 'D' }],
    correctOptionId: 'c', hint: 'Count the twelve note names, then return to the beginning of the cycle.',
    explanation: 'The chromatic note names wrap from B back to C; the pitch rises by one semitone.',
  },
  {
    id: 'l3-enharmonic', conceptId: 'guitar.chromatic-map', channel: 'read', kind: 'choice', tool: 'fretboard',
    prompt: 'F-sharp and G-flat name which relationship on an equally tempered guitar?',
    context: 'Enharmonic spellings can describe the same fret and sounding pitch.',
    options: [{ id: 'same-pitch', label: 'The same sounding pitch with two names' }, { id: 'whole-step', label: 'Two pitches a whole step apart' }, { id: 'octave', label: 'The same note in different octaves' }],
    correctOptionId: 'same-pitch', hint: 'Both names can point to the same fret on the guitar.',
    explanation: 'F-sharp and G-flat are enharmonic spellings: on a standard guitar they share the same pitch and fret.',
  },
  {
    id: 'l3-semitone', conceptId: 'guitar.chromatic-map', channel: 'hear', kind: 'choice',
    tool: 'practice-lab',
    prompt: 'Listen to these two notes. How far apart are they?', context: 'The second note is one fret higher on the same string.',
    options: [{ id: 'semitone', label: 'One semitone (half step)' }, { id: 'whole', label: 'One whole step' }, { id: 'octave', label: 'One octave' }],
    correctOptionId: 'semitone', hint: 'One adjacent fret is the smallest standard step on the guitar.',
    explanation: 'Moving up one fret raises the note by one semitone.',
    audioExample: { notes: [note(3, 0, 'G', 3, 'open G'), note(3, 1, 'G#', 3, 'G string · fret 1')], label: 'Hear one fret apart' },
  },
  {
    id: 'l3-speak', conceptId: 'guitar.chromatic-map', channel: 'speak', kind: 'perform', tool: 'fretboard',
    prompt: 'Say the note names as you move from fret 0 to fret 3 on the low E string.',
    context: 'Use the fretboard as a map: each fret moves up by one semitone.',
    explanation: 'The note sequence is E, F, F-sharp, G. Saying the names connects the chromatic cycle to fret movement.',
    performance: { instructions: ['Point to or name the open low E.', 'Name the note at each of frets 1, 2, and 3.'], selfCheckLabel: 'I named the notes E–F–F-sharp–G' },
  },
  {
    id: 'l3-play-g-low-e', conceptId: 'guitar.chromatic-map', channel: 'play', kind: 'perform', tool: 'fretboard',
    prompt: 'Find and play G2 on the low E string.', context: 'The target is three frets above the open low E.',
    explanation: 'G2 is on the low E string at fret 3.',
    audioExample: { notes: [G2], label: 'Hear G2 target' },
    performance: { instructions: ['Choose the thickest string.', 'Press fret 3 just behind the fret wire.', 'Pluck once and listen for a clear G.'], targetNote: G2, selfCheckLabel: 'I found and played G2' },
  },
  {
    id: 'l3-same-note', conceptId: 'guitar.chromatic-map', channel: 'play', kind: 'perform', tool: 'fretboard',
    prompt: 'Find the same G pitch on a different string from the open G string.', context: 'Use the D string at fret 5, then compare it with the open G string.',
    explanation: 'The D string at fret 5 and the open G string both produce G3, the same pitch in two locations.',
    audioExample: { notes: [G3], label: 'Hear G3 target' },
    performance: { instructions: ['Find the D string.', 'Play fret 5 and let it ring.', 'Compare it with the open G string.'], targetNote: G3, selfCheckLabel: 'I found the matching G on another string' },
  },
  {
    id: 'l4-chord-meaning', conceptId: 'chord.triad-basics', channel: 'think', kind: 'choice',
    prompt: 'What makes a chord different from a single-note melody?', context: 'Consider what happens when multiple pitches sound together.',
    options: [{ id: 'simultaneous', label: 'Multiple notes are sounded together' }, { id: 'faster', label: 'The notes are played faster' }, { id: 'louder', label: 'The notes are played louder' }],
    correctOptionId: 'simultaneous', hint: 'A chord is a vertical combination of pitches.',
    explanation: 'A chord combines multiple pitches at the same time.',
  },
  {
    id: 'l4-major-spelling', conceptId: 'chord.major-minor', channel: 'think', kind: 'choice',
    prompt: 'Which notes spell a C major triad?', context: 'A basic major triad uses degrees 1, 3, and 5.',
    options: [{ id: 'c-e-g', label: 'C–E–G' }, { id: 'c-eb-g', label: 'C–E-flat–G' }, { id: 'c-e-gb', label: 'C–E–G-flat' }],
    correctOptionId: 'c-e-g', hint: 'Use the major third and perfect fifth above C.',
    explanation: 'C–E–G is root, major third, and perfect fifth.',
  },
  {
    id: 'l4-diagram', conceptId: 'chord.open-shapes', channel: 'read', kind: 'choice',
    prompt: 'In the open C chord shape x-3-2-0-1-0, which string/fret contains the root C?', context: 'The strings are listed from low E to high e; x means do not play that string.',
    options: [{ id: 'a3', label: 'A string · fret 3' }, { id: 'd2', label: 'D string · fret 2' }, { id: 'b1', label: 'B string · fret 1' }],
    correctOptionId: 'a3', hint: 'The lowest sounding C in this shape is on the A string.',
    explanation: 'The A string at fret 3 is C3, the root of the C chord.',
  },
  {
    id: 'l4-hear-quality', conceptId: 'chord.major-minor', channel: 'hear', kind: 'choice',
    prompt: 'Listen to C major and A minor. Which chord sounds minor?', context: 'Listen for the quality of the chord, not its loudness.',
    options: [{ id: 'c-major', label: 'C major' }, { id: 'a-minor', label: 'A minor' }],
    correctOptionId: 'a-minor', hint: 'The chord with a minor third is A minor.',
    explanation: 'A minor is spelled A–C–E; its minor third gives it minor quality.',
    audioExample: { chords: [{ name: 'C', label: 'C major' }, { name: 'Am', label: 'A minor' }], label: 'Compare major and minor' },
  },
  {
    id: 'l4-play-em', conceptId: 'chord.open-shapes', channel: 'play', kind: 'perform',
    prompt: 'Play an open E minor chord and let all six strings ring clearly.', context: 'Use the sound example as a reference. The app cannot verify the full chord with its single-note pitch detector.',
    explanation: 'A clean chord has clear notes without muted strings or unwanted buzz.',
    audioExample: { chord: 'Em', label: 'Hear E minor' },
    performance: { instructions: ['Place your middle and ring fingers on the A and D strings at fret 2.', 'Strum from the low E string through the high e string.', 'Listen for six clear strings.'], selfCheckLabel: 'I played and listened to the E minor chord' },
  },
  {
    id: 'l5-chord-parts', conceptId: 'chord.naming', channel: 'think', kind: 'choice',
    prompt: 'What information does a basic chord name give you?', context: 'A chord can be identified by its root and quality; a form can describe how to finger it.',
    options: [{ id: 'root-quality', label: 'Root note and chord quality' }, { id: 'tempo', label: 'Tempo and strumming speed' }, { id: 'string-count', label: 'Only how many strings to play' }],
    correctOptionId: 'root-quality', hint: 'Start with the note that names the chord, then its major/minor or other quality.',
    explanation: 'A chord symbol names a root and quality, such as A minor. A form describes a playable shape.',
  },
  {
    id: 'l5-name-from-spelling', conceptId: 'chord.naming', channel: 'read', kind: 'choice',
    prompt: 'The notes A–C–E are played together. What is the chord name?', context: 'Identify the root, then the interval quality above it.',
    options: [{ id: 'am', label: 'A minor' }, { id: 'a-major', label: 'A major' }, { id: 'c-major', label: 'C major' }],
    correctOptionId: 'am', hint: 'C is a minor third above A; E is the fifth.',
    explanation: 'A–C–E spells A minor: root, minor third, and perfect fifth.',
  },
  {
    id: 'l5-root-form', conceptId: 'chord.naming', channel: 'read', kind: 'choice',
    prompt: 'In the open A major shape x-0-2-2-2-0, which note names the chord?', context: 'The open A string is part of the chord.',
    options: [{ id: 'a-root', label: 'A, on the open A string' }, { id: 'e-root', label: 'E, on the high e string' }, { id: 'c-root', label: 'C, on fret 1 of the B string' }],
    correctOptionId: 'a-root', hint: 'The chord is named for its root, which appears as the open A string here.',
    explanation: 'The open A string supplies the root A; the other notes form the A major chord.',
  },
  {
    id: 'l5-hear-quality', conceptId: 'chord.naming', channel: 'hear', kind: 'choice',
    prompt: 'Listen to E major and E minor. Which chord contains G-sharp?', context: 'The root stays E; the third changes the chord quality.',
    options: [{ id: 'e-major', label: 'E major' }, { id: 'e-minor', label: 'E minor' }],
    correctOptionId: 'e-major', hint: 'The major third above E is G-sharp; the minor third is G natural.',
    explanation: 'E major is spelled E–G-sharp–B. E minor uses G natural instead.',
    audioExample: { chords: [{ name: 'E', label: 'E major' }, { name: 'Em', label: 'E minor' }], label: 'Compare E major and E minor' },
  },
  {
    id: 'l5-play-root', conceptId: 'chord.naming', channel: 'play', kind: 'perform',
    prompt: 'Play the open A string as the root of an A minor chord, then strum the full A minor shape.',
    context: 'The microphone can verify the single A root note only. Use the self-check for chord clarity.',
    explanation: 'The chord name identifies its root and quality; the fingering is one way to produce that chord.',
    audioExample: { chord: 'Am', label: 'Hear A minor' },
    performance: { instructions: ['Pluck the open A string.', 'Form x-0-2-2-1-0 and strum from the A string.', 'Listen for a clear A minor chord.'], targetNote: A2, selfCheckLabel: 'I checked the A root and strummed A minor' },
  },
];

export const STARTER_LESSONS: StarterLessonBlueprint[] = [
  { id: 'starter-lesson-1', level: 1, title: 'The 6 Main Areas of Music', objective: 'Learn to listen for pitch, rhythm, timbre, dynamics, technique, and notation.', concepts: ['music.pitch', 'music.rhythm', 'music.timbre', 'music.dynamics', 'music.technique', 'music.notation', 'music.self-review'], activityIds: ['l1-pitch', 'l1-rhythm', 'l1-timbre', 'l1-dynamics', 'l1-technique', 'l1-notation', 'l1-full-phrase'], priority: 'foundation' },
  { id: 'starter-lesson-2', level: 2, title: '4 Ways To Know Your Pitch Patterns', objective: 'Learn a root–fifth–octave pattern through thinking, reading, hearing, speaking, and playing.', concepts: ['pattern.root-fifth-octave'], activityIds: ['l2-think', 'l2-read', 'l2-hear', 'l2-speak', 'l2-play', 'l2-transfer'], priority: 'foundation' },
  { id: 'starter-lesson-3', level: 3, title: 'The Dumb Machine', objective: 'Connect standard tuning, fret positions, semitones, and note names across the fretboard.', concepts: ['guitar.standard-tuning', 'guitar.chromatic-map'], activityIds: ['l3-open-strings', 'l3-fret-steps', 'l3-cycle', 'l3-enharmonic', 'l3-semitone', 'l3-speak', 'l3-play-g-low-e', 'l3-same-note'], priority: 'high' },
  { id: 'starter-lesson-4', level: 4, title: 'Basic Chords', objective: '', concepts: [], activityIds: [], priority: 'high' },
  { id: 'starter-lesson-5', level: 5, title: 'More About Chords', objective: '', concepts: [], activityIds: [], priority: 'high' },
];

export const STARTER_WORKOUTS: StarterWorkoutBlueprint[] = [
  { id: 'workout-music-checkup', title: 'Music Checkup', category: 'Foundation', durationMinutes: 10, description: 'Practice identifying the six areas of music, then play a complete phrase and choose one improvement.', targetSkill: 'Musical self-review', activityIds: ['l1-pitch', 'l1-rhythm', 'l1-timbre', 'l1-dynamics', 'l1-technique', 'l1-notation', 'l1-full-phrase'], priorityOrder: 1 },
  { id: 'workout-four-ways', title: 'Know One Pattern Four Ways', category: 'Pitch patterns', durationMinutes: 10, description: 'Think, read, hear, speak, and play a root–fifth–octave pattern.', targetSkill: 'Pattern fluency', activityIds: ['l2-think', 'l2-read', 'l2-hear', 'l2-speak', 'l2-play', 'l2-transfer'], priorityOrder: 2 },
  { id: 'workout-fretboard-map', title: 'Find Your Notes', category: 'Fretboard', durationMinutes: 10, description: 'Recall standard tuning, count semitones, and find the same note in two locations.', targetSkill: 'Fretboard mapping', activityIds: ['l3-open-strings', 'l3-fret-steps', 'l3-cycle', 'l3-enharmonic', 'l3-semitone', 'l3-speak', 'l3-play-g-low-e', 'l3-same-note'], priorityOrder: 3 },
  { id: 'workout-open-chords', title: 'Hear and Play Basic Chords', category: 'Chords', durationMinutes: 10, description: 'Spell a triad, read an open chord diagram, compare major/minor sound, and play E minor.', targetSkill: 'Chord basics', activityIds: ['l4-chord-meaning', 'l4-major-spelling', 'l4-diagram', 'l4-hear-quality', 'l4-play-em'], priorityOrder: 4 },
  { id: 'workout-chord-detective', title: 'Chord Name Detective', category: 'Chords', durationMinutes: 10, description: 'Work backward from chord spelling and shapes to identify root and quality.', targetSkill: 'Chord naming', activityIds: ['l5-chord-parts', 'l5-name-from-spelling', 'l5-root-form', 'l5-hear-quality', 'l5-play-root'], priorityOrder: 5 },
];

export const STARTER_ACTIVITY_BY_ID = Object.fromEntries(STARTER_ACTIVITIES.map((activity) => [activity.id, activity])) as Record<string, LessonActivity>;
export const STARTER_LESSON_BY_LEVEL = Object.fromEntries(STARTER_LESSONS.map((lesson) => [lesson.level, lesson])) as Record<number, StarterLessonBlueprint>;

