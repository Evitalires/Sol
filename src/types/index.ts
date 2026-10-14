export interface Lesson {
  id: string;
  tag: string; // e.g. "Lead • 6", "Chords • 6", "Riffs • 6"
  category: 'Lead' | 'Chords' | 'Riffs' | 'Basics' | 'Rhythm';
  level: number;
  title: string;
  image: string;
  stars: number; // 0 to 3
  maxStars: number;
  completedExercises: number;
  totalExercises: number;
  progressPercent: number; // 0 to 100
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  notes: LessonNote[];
  playbackTempo?: number;
  jamSettings?: {
    infinite: boolean;
    root: number;
    tempo: number;
    materials: string[];
    rounds?: JamRound[];
  };
  /** Original notation data, retained when the lesson was imported from MusicXML. */
  score?: ScoreDocument;
}

export interface LessonNote {
  time: number; // in seconds
  stringIndex: number; // 0 = low E, 1 = A, 2 = D, 3 = G, 4 = B, 5 = high E
  fret: number;
  duration: number;
  noteName: string;
  /** Rhythmic metadata used by generated jam phrases. */
  rhythmFigureId?: string;
  isRest?: boolean;
  tupletGroupId?: string;
  tupletCount?: number;
  materialIndex?: number;
  technique?: 'slide' | 'hammer' | 'pull' | 'normal';
}

export interface JamRound {
  number: number;
  materials: string[];
  startTime: number;
  endTime: number;
  notes: LessonNote[];
}

export interface ScorePitch {
  step: string;
  alter: number;
  octave: number;
  midi: number;
}

export interface ScoreTie {
  type: 'start' | 'stop' | 'continue';
  number?: string;
}

export interface ScoreTechnical {
  string?: number;
  fret?: number;
  finger?: number;
  bendAlter?: number;
  slideType?: string;
  harmonic?: string;
  palmMute?: boolean;
  letRing?: boolean;
  other: string[];
}

export interface ScoreNotations {
  articulations: string[];
  ornaments: string[];
  slurs: { type: string; number?: string }[];
  tuplets: { type: string; number?: string }[];
  technical: ScoreTechnical;
  fermata?: string;
  arpeggiate?: boolean;
  glissando?: string;
}

export interface ScoreEventBase {
  id: string;
  kind: 'note' | 'rest';
  onsetTicks: number;
  durationTicks: number;
  onsetQuarter: number;
  durationQuarter: number;
  onsetSeconds: number;
  durationSeconds: number;
  voice: string;
  staff: number;
  noteType?: string;
  dots: number;
  timeModification?: { actualNotes: number; normalNotes: number; normalType?: string };
  stem?: string;
  notehead?: string;
  beams: { number: number; value: string }[];
  ties: ScoreTie[];
  notations: ScoreNotations;
  chord: boolean;
  grace: boolean;
  cue: boolean;
  lyrics: { text: string; syllabic?: string }[];
  accidental?: string;
  dynamics?: string[];
}

export interface ScoreNoteEvent extends ScoreEventBase {
  kind: 'note';
  pitch: ScorePitch;
  instrumentId?: string;
  unpitched?: { displayStep?: string; displayOctave?: number };
}

export interface ScoreRestEvent extends ScoreEventBase {
  kind: 'rest';
  measure: boolean;
  displayStep?: string;
  displayOctave?: number;
}

export type ScoreEvent = ScoreNoteEvent | ScoreRestEvent;

export interface ScoreTimeSignature {
  beats: number;
  beatType: number;
  symbol?: string;
}

export interface ScoreKeySignature {
  fifths: number;
  mode?: string;
}

export interface ScoreTuningString {
  line: number;
  step: string;
  alter: number;
  octave: number;
  midi: number;
}

export interface ScoreDirection {
  kind: 'tempo' | 'dynamic' | 'words' | 'rehearsal' | 'segno' | 'coda' | 'other';
  offsetQuarter: number;
  value?: string;
  tempoBpm?: number;
  placement?: string;
  staff?: number;
  voice?: string;
  attributes?: Record<string, string>;
}

export interface ScoreClef {
  sign: string;
  line?: number;
  octaveChange?: number;
  staff: number;
}

export interface ScoreTransposition {
  diatonic?: number;
  chromatic?: number;
  octaveChange?: number;
}

export interface ScoreHarmony {
  onsetQuarter: number;
  root: ScorePitch;
  kind: string;
  bass?: ScorePitch;
  degrees: { value: number; alter: number; type: string }[];
}

export interface ScoreMeasure {
  number: string;
  implicit: boolean;
  divisions: number;
  startQuarter: number;
  durationQuarter: number;
  startSeconds: number;
  durationSeconds: number;
  timeSignature?: ScoreTimeSignature;
  keySignature?: ScoreKeySignature;
  clefs: ScoreClef[];
  transposition?: ScoreTransposition;
  repeatStart: boolean;
  repeatEndTimes?: number;
  ending?: { number: string; type: string };
  barline?: { location?: string; style?: string };
  directions: ScoreDirection[];
  events: ScoreEvent[];
  harmonies: ScoreHarmony[];
}

export interface ScoreInstrument {
  id: string;
  name: string;
  abbreviation?: string;
  sound?: string;
}

export interface ScorePart {
  id: string;
  name: string;
  abbreviation?: string;
  instruments: ScoreInstrument[];
  staves: number;
  tuning: ScoreTuningString[];
  measures: ScoreMeasure[];
}

export interface ScoreDocument {
  format: 'MusicXML';
  version?: string;
  title: string;
  subtitle?: string;
  composer?: string;
  lyricist?: string;
  arranger?: string;
  rights?: string;
  sourceFileName?: string;
  defaultTempoBpm: number;
  defaultTimeSignature: ScoreTimeSignature;
  defaultKeySignature: ScoreKeySignature;
  parts: ScorePart[];
  divisions: number[];
}

export interface LevelInfo {
  levelNumber: number;
  name: string;
  unlocked: boolean;
  completed: boolean;
  totalLessons: number;
  completedLessons: number;
  icon?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  level: number;
  category: string;
  coverImage: string;
  chords: string[];
  duration: string;
  stars: number;
  isPopular?: boolean;
  isNew?: boolean;
}

export interface Workout {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  level: number;
  exercisesCount: number;
  description: string;
  targetSkill: string;
}

export type MainTab = 'Home' | 'Learn' | 'Songs' | 'Tuner' | 'Profile';
export type SubTab = 'Path' | 'Workouts' | 'Tools';
