# Practice tool component contracts

For the planned learner journey that composes lesson questions as overlays above Fretboard or Practice Lab, see [the future UX flow reference](lesson-modal-over-tools.md).

Fretboard and Practice Lab are presentational, data-driven components intended to sit between lesson data and future API adapters. Their reusable contracts live in `src/components/tools/toolContracts.ts`.

The components do not fetch or persist data. A page, lesson adapter, or API hook supplies configuration and state, handles user events, and decides how to store or generate a session. This keeps service concerns outside the UI and lets each lesson provide different tuning, note targets, materials, and practice limits.

## Fretboard

`Fretboard` accepts `FretboardData` plus an optional `onSelectPosition` callback.

| Field | Type | Purpose |
| --- | --- | --- |
| `tuning` | `FretboardString[]` | Ordered strings, top to bottom. Each string has a stable `id`, display `label`, and open-string MIDI pitch (`openMidi`). |
| `maxFret` | `number` | Highest visible fret. |
| `notes` | `FretboardNote[]` | Optional explicit fretboard note map. Each note includes a string id, fret, MIDI pitch, and optional `role` and display `label`. If omitted, notes are derived from tuning and fret number. |
| `noteDisplay` | `'none' \| 'all' \| 'selected'` | Controls which note labels are shown. Defaults to `all`. |
| `visiblePositions` | `FretboardPosition[]` | Positions whose labels are shown when `noteDisplay` is `selected`. |
| `highlightedPositions` | `FretboardPosition[]` | Live or lesson-driven highlights, such as detected notes or scale tones. |
| `detectedPosition` | `FretboardPosition \| null` | Optional single position to highlight for a tuner result. |
| `targetPositions` | `FretboardPosition[]` | One or more expected answers or lesson targets. |
| `interactive` | `boolean` | Enables selecting a cell. Defaults to false. |
| `onSelectPosition` | `(position) => void` | Receives `{ stringId, fret }` when an enabled cell is selected. |

The component derives note names from MIDI pitch classes. A supplied `FretboardNote.label` overrides the displayed name; `role` can mark root, scale, chord, target, or custom notes for styling and future adapters.

### Example: hide note labels until lesson state reveals a subset

```tsx
const tuning = [
  { id: 'high-e', label: 'e', openMidi: 64 },
  { id: 'b', label: 'B', openMidi: 59 },
  { id: 'g', label: 'G', openMidi: 55 },
  { id: 'd', label: 'D', openMidi: 50 },
  { id: 'a', label: 'A', openMidi: 45 },
  { id: 'low-e', label: 'E', openMidi: 40 },
];

<Fretboard
  tuning={tuning}
  maxFret={12}
  noteDisplay={showAll ? 'all' : showTargets ? 'selected' : 'none'}
  visiblePositions={[
    { stringId: 'a', fret: 3 },
    { stringId: 'd', fret: 5 },
  ]}
  highlightedPositions={liveDetectedPositions}
/>
```

Lesson/backend note payloads can be mapped into `FretboardNote[]`:

```json
[
  { "stringId": "a", "fret": 3, "midi": 48, "role": "root", "label": "C" },
  { "stringId": "d", "fret": 5, "midi": 55, "role": "target", "label": "G" }
]
```

String ids must match the ids in `tuning`; positions use zero-based fret numbers, including open fret `0`. MIDI pitches are absolute MIDI note numbers.

## Practice Lab

`PracticeLab` receives a `PracticeLabConfig` and calls `onGenerate(PracticeSessionRequest)` when the learner starts. The config is the lesson-specific menu and constraint set. The request is a normalized snapshot of the learner's selections that can be sent to a session-generation endpoint or handled locally.

| Config field | Purpose |
| --- | --- |
| `id` | Stable configuration/lesson identifier. |
| `title`, `description` | Optional per-lesson copy. |
| `rootOptions` | Allowed roots, each with stable id, label, and chromatic pitch-class index (`C = 0` through `B = 11`; octave-independent). |
| `materialOptions` | Allowed concepts/materials with id and label; optional `family` and `description` support richer grouping and help text. |
| `tempo` | Minimum, maximum, optional step, and default BPM. |
| `modes` | Available modes with stable id, label, and UI `strategy` (`single` or `rotation`). The host defines what each mode means to the generator. |
| `defaultMode`, `defaultRootId`, `defaultMaterialIds` | Initial selections. |
| `sequence` | Optional min/max/default item count and step size. |
| `rotation` | Optional minimum, maximum, and initial round count; `roundsPerExpansion` describes an infinite rotation policy for the host/API. |
| `rhythm` | Optional enablement, allowed rhythm styles, and default style id. |

`PracticeSessionRequest` currently contains `configId`, `mode`, `rootId`, `materialIds`, `tempoBpm`, `itemCount`, `rounds`, and optional `rhythmStyleId`. Treat ids as opaque stable strings; the API adapter maps them to its own identifiers. The request is configuration, not generated notes. Generated note events, backing tracks, progression, and playback details belong in the API response/session model and can be added without coupling them to the form component.

### Example lesson configuration

```ts
const lessonConfig: PracticeLabConfig = {
  id: 'lesson-12-position-work',
  title: 'Position Practice',
  description: 'Practice the lesson targets in a selected key.',
  rootOptions: [{ id: 'c', label: 'C', pitchClass: 0 }, { id: 'g', label: 'G', pitchClass: 7 }],
  materialOptions: [
    { id: 'major-scale', label: 'Major scale', family: 'scale' },
    { id: 'triad', label: 'Major triad', family: 'chord' },
  ],
  tempo: { min: 50, max: 160, step: 5, default: 80 },
  modes: [{ id: 'single', label: 'Set practice', strategy: 'single' }, { id: 'rotation', label: 'Rotate', strategy: 'rotation' }],
  defaultMode: 'single',
  defaultRootId: 'c',
  defaultMaterialIds: ['major-scale'],
  sequence: { minItems: 4, maxItems: 48, defaultItems: 16 },
  rotation: { minRounds: 1, maxRounds: 10, initialRounds: 3, roundsPerExpansion: 2 },
  rhythm: {
    enabled: true,
    styles: [{ id: 'straight', label: 'Straight' }, { id: 'swing', label: 'Swing' }],
    defaultStyleId: 'straight',
  },
};

<PracticeLab config={lessonConfig} onGenerate={sendPracticeRequest} />
```

The current Tools page uses the same contract with its existing scale/chord catalog. Its adapter maps the request to the app's `Lesson` and generated `LessonNote[]`. A future endpoint can instead return a session resource and pass that resource to the lesson player.

## API adapter boundary

Keep the integration in a host adapter or hook:

1. Load the lesson's tool configuration from lesson data or an API.
2. Pass configuration and current live/lesson state into the component.
3. On Fretboard selection or Practice Lab submission, translate stable ids into API parameters.
4. Validate server responses before mapping them into app lesson/session types.
5. Keep generated content and playback state outside these components; pass only the presentation state they need.

Recommended future response shape for Practice Lab is a session id, resolved configuration, generated note/event list, playback metadata (tempo, meter, backing track), and optional round/section boundaries. This leaves the existing form request stable while allowing the generated experience to grow.
