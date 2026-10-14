# Notation import

## Chosen format

Use **MusicXML 4.0 partwise** as Sol's canonical notation interchange format (`.musicxml`, or uncompressed `.xml`). It is a structured score format with explicit parts, measures, voices, pitches, durations, instrument tuning, guitar string/fret positions, tempo, meter, key, and expressive markings. It is a better source of truth than parsing a visual tab image or inventing a Sol-specific text syntax, and it is widely exported by notation editors.

The app stores the imported score as a `ScoreDocument` and creates a `Lesson` playback projection from a guitar/bass/ukulele part. The score remains available alongside the lesson so notation detail is not lost when converting it to the current practice-player format.

## Current import and playback support

- Imports `.musicxml` and `.xml` files up to 5 MB from Learn.
- Parses partwise scores, metadata, instruments, tuning, clefs, transposition, key and time signatures, notes, rests, voices, staves, durations, accidentals, lyrics, ties, beams, tuplets, articulations, ornaments, guitar techniques, chord symbols, dynamics, directions, tempo changes, barlines, repeats, and endings into the score model.
- Expands basic forward/backward repeats for practice and uses the imported starting tempo and meter in the player.
- Converts playable guitar notes using explicit string/fret marks where present, otherwise chooses a position within the imported tuning. The current projection does not record whether a position was explicit or auto-selected.
- Retains simultaneous chord members in the score. Since microphone grading currently tracks one pitch at a time, the practice projection schedules the lead note for a chord instead of treating all chord tones as successive notes. A hit on that projected note is **lead-note evidence only**; it is not evidence that the learner played or mastered the full chord.

Compressed `.mxl` archives, timewise MusicXML, nested repeats, and alternate-ending navigation are not yet supported by the practice projection. The structured score preserves many of those markings, but the current player does not render engraved notation or grade polyphonic chords. For best results, export partwise MusicXML with guitar string/fret marks from the notation editor.

## Evidence and lesson-gate constraints

- Record imported note hits as `leadNoteOnly` when a score event belongs to a chord. That evidence can satisfy a single-note pitch target only. It must not pass a full-chord PLAY gate; require polyphonic analysis or a separately labeled `selfReport` / `teacherCheck` for the chord itself.
- Add `fingeringSource: 'explicit' | 'auto'` to the projected note/event model. When `auto`, show the selected string and fret to the learner and do not grade fingering choice, position transfer, or voicing selection. Those gates require a learner-chosen position or explicit source fingering.
- The current import projection does not assign course concept IDs. Imported scores therefore must not be selected by the adaptive workout builder as if they were tagged course material. A future sidecar/tag file should map score sections or measure ranges to stable IDs such as `scale.major` or `chord.triad.minor`; validate those IDs against the lesson catalog before use.
- Forms that depend on alternate endings or nested repeats cannot be used as scored full-form transfer material with the current playback projection. Lessons 19 and 25 must use authored forms or a verified score without unsupported repeat structures until that support exists.

These are requirements for the future import/mastery adapter; the present player does not yet enforce the evidence labels or concept-tag mapping above.

## Validation fixtures

- `public/examples/evening-lantern.musicxml`: two-measure guitar song with a repeat, chord, rest, tie, technique marks, and tempo change. Confirm and document that this fixture was created for Sol or that its source and redistribution rights permit bundling it before release.
- `public/examples/c-major-scale.musicxml`: one-octave scale with eight notes and explicit guitar positions.

Run `npm run test:notation` to check both fixtures and their practice projections.
