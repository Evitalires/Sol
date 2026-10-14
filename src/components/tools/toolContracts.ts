/** API-facing data contracts for the practice tools. */
export interface FretboardString {
  /** Display order, top to bottom. */
  id: string;
  label: string;
  openMidi: number;
}

export interface FretboardPosition {
  stringId: string;
  fret: number;
}

export interface FretboardNote extends FretboardPosition {
  /** MIDI pitch. The UI derives pitch names from this value. */
  midi: number;
  /** Optional semantic data supplied by a lesson or API. */
  role?: 'root' | 'scale' | 'chord' | 'target' | 'custom';
  label?: string;
}

export interface FretboardData {
  tuning: FretboardString[];
  maxFret: number;
  /** Positions to render. Empty means derive every position from tuning. */
  notes?: FretboardNote[];
  /** none hides note labels; all shows every label; selected shows only `visiblePositions`. */
  noteDisplay?: 'none' | 'all' | 'selected';
  visiblePositions?: FretboardPosition[];
  highlightedPositions?: FretboardPosition[];
  detectedPosition?: FretboardPosition | null;
  targetPositions?: FretboardPosition[];
  /** Enables cell interaction and emits the selected string/fret. */
  interactive?: boolean;
}

export interface PracticeMaterialOption {
  id: string;
  label: string;
  family?: string;
  description?: string;
}

export interface PracticeModeOption {
  id: string;
  label: string;
  /** UI behavior for this mode; the host still owns its generation semantics. */
  strategy: 'single' | 'rotation';
}

export interface PracticeLabConfig {
  id: string;
  title?: string;
  description?: string;
  /** Chromatic pitch-class index (C=0 through B=11), independent of octave. */
  rootOptions: { id: string; label: string; pitchClass: number }[];
  materialOptions: PracticeMaterialOption[];
  tempo: { min: number; max: number; step?: number; default: number };
  modes: PracticeModeOption[];
  defaultMode: string;
  defaultRootId: string;
  defaultMaterialIds: string[];
  /** Available sequence length controls. */
  sequence?: { minItems: number; maxItems: number; step?: number; defaultItems: number };
  rotation?: { minRounds: number; maxRounds: number; initialRounds: number; roundsPerExpansion?: number };
  /** Optional rhythm controls; a backend may interpret these fields. */
  rhythm?: { enabled: boolean; styles?: { id: string; label: string }[]; defaultStyleId?: string };
}

/** Normalized user selections. Persist or send this object to an API to generate a session. */
export interface PracticeSessionRequest {
  configId: string;
  mode: string;
  rootId: string;
  materialIds: string[];
  tempoBpm: number;
  itemCount: number;
  rounds: number;
  rhythmStyleId?: string;
}

