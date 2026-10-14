# Guitar mastery algorithm

The 32 lesson-by-lesson content specifications and learner lesson routine are in [lesson-structures.md](./lesson-structures.md). Review-only and targeted workout generation is specified in [workout-system.md](./workout-system.md).

## Source model

The supplied *Absolutely Understand Guitar* support package presents music as a language: guitar positions encode note patterns, and a learner should understand those patterns rather than only memorize hand shapes. Its four learning channels are THINK, READ, HEAR, and SPEAK (naming, singing, or explaining the pattern). Instrument performance is tracked separately as PLAY evidence. The course orders pitch concepts from silence and a single note through intervals, scales, chords, and progressions. It also asks the player to complete whole songs and reflect on six areas: pitch, rhythm, timbre, dynamics, technique, and notation.

This document turns those ideas into an adaptive learning algorithm. “Mastery” here means demonstrated, transferable skill; it is not a promise that any finite course can make someone know everything about guitar.

## What the learner is mastering

Represent each musical idea as a `Pattern` with:

- its root and spelling (note names and scale degrees / intervals);
- the notes and interval formula that define it;
- written forms: fretboard diagram, tablature, and standard notation when available;
- audio examples and ear-training prompts;
- playable guitar positions, fingerings, and rhythmic forms;
- harmonic context: related chords, scales, and progressions;
- prerequisite patterns and suitable songs or jam contexts.

Track two separate kinds of progress:

1. **Pattern fluency:** THINK, READ, HEAR, and SPEAK scores for each pattern.
2. **Performance quality:** PLAY evidence plus PITCH, RHYTHM, TIMBRE, DYNAMICS, TECHNIQUE, and NOTATION checks on exercises and complete songs.

Do not treat opening a lesson, finishing a video, or memorizing one fretboard shape as pattern mastery.

## Concept order

Keep the book’s six-level pitch progression as the dependency spine:

1. **Silence and note:** rests, pulse, a single pitch, note names, tuning, and the guitar’s chromatic fretboard.
2. **Intervals:** hear, spell, read, and play distances between notes, including inversions.
3. **Scales:** derive them from interval formulas; learn roots, degrees, and movable positions.
4. **Chord-scale relationships:** connect a scale to its embedded chord and hear how the same notes change function over different roots.
5. **Chords:** build triads first, then seventh and extended chords; learn inversions, voicings, roots, and movable forms.
6. **Progressions and musical form:** analyze how chords move in a key, then learn minor/modal/blues contexts, substitutions, and modulation.

The book’s 32 lessons supply the course order and examples. Early foundations can introduce practical open chords and rhythm for immediate playing, but later concepts must still depend on the relevant interval, scale, and chord knowledge. Optional exotic scales and advanced voicings stay behind their prerequisites.

## Learning loop

For each new pattern, run this loop in order, then revisit it in mixed practice:

1. **Think:** recall its spelling, interval formula, root, and musical function without looking.
2. **Read:** identify it in a fretboard diagram, tab, or score; decode pitch and rhythm separately.
3. **Hear:** discriminate the pattern from plausible alternatives, first alone and then over the chord or progression that gives it context.
4. **Speak:** name, sing, or explain the pattern without relying on the written answer. Vary the prompt and context.
5. **Play:** find and perform it on the guitar. Vary the key, string set, fretboard position, direction, and rhythm so the learner cannot rely on one memorized box.
6. **Apply and reflect:** use it in a short phrase, chord change, song, or jam; then review the six performance areas and choose the weakest one for the next exercise.

Introduce only one major new idea at a time. Previously mastered material should recur inside later exercises so intervals become scale degrees, scale degrees become chord tones, and chord tones become progressions and melodies.

## Mastery and review rules

Store evidence per learner, pattern, and THINK/READ/HEAR/SPEAK channel. Store PLAY performance evidence separately. Keep attempt counts, accuracy, response time, last practice time, error type, evidence source, and the context/position used.

A pattern becomes **ready for transfer** when the learner reaches these initial thresholds:

- THINK: at least 4 of 5 correct recall/spelling prompts.
- READ: at least 4 of 5 correct, including both pitch and rhythm when notation includes both.
- HEAR: at least 8 of 10 correct discrimination prompts, using more than one musical context.
- SPEAK: at least 4 of 5 correct naming, singing, or explanation prompts.
- PLAY: at least 90% of target pitches and 85% of target rhythm events across two attempts, in two keys or fretboard positions.
- TRANSFER: one successful use in a new phrase, song, or chord context.
- EVIDENCE SPACING: passing evidence must be collected on at least two distinct calendar days; multiple attempts in one sitting do not satisfy this condition.

Every passing session must record its evidence source (`mic`, `player`, `selfReport`, or `teacherCheck`). A concept is stable only after the channel thresholds and transfer gate pass on two separate days, followed by the scheduled recall check. Store self-report as self-report; it cannot stand in for mic-verified evidence.

These are starting product defaults, not claims made by the source. Allow a no-microphone path using self-checks and visual note prompts; label that evidence as self-reported, not pitch-verified. Timbral, dynamic, and technique checks should likewise distinguish machine-measured evidence from learner reflection.

After a successful check, schedule reviews at 1, 3, 7, 14, then 30 days. A failed review returns the item to the next session and shortens its interval. A specific error selects a matching repair: wrong note name → THINK; misread staff/tab → READ; confused sound → HEAR; inability to name/sing/explain → SPEAK; missed fret/shift → PLAY; late or uneven event → RHYTHM practice. Do not unlock dependent material from a single successful repetition or from evidence collected on only one day.

## Select the next activity

```text
function nextActivity(learner, course):
    if learner has a due review:
        item = sort due reviews by repeated errors in the last 7 days (descending),
               overdue days (descending), then concept ID (alphabetical ascending)
        return a short mixed review for item.weakestChannel

    concept = earliest course concept whose prerequisites are ready for transfer
    if no such concept:
        return a complete-song or creative transfer task

    if concept is new:
        return a short explanation plus THINK and READ checks

    channel = weakest of THINK, READ, HEAR, SPEAK for concept
    if all channels pass:
        return a transfer task using a different key, position, rhythm, or harmony
    return an exercise targeting channel and the learner’s most common error

after each activity:
    update evidence and mastery state
    schedule or reschedule review
    unlock a dependent concept only after its prerequisites pass
    keep a successful pattern in later mixed practice
```

Use ties in scores as a rotation across channels, not as a reason to repeat the same drill. Keep a session balanced: brief retrieval warm-up, one new concept, all four learning channels over time, a separate PLAY performance check where appropriate, contextual application, and a short reflection. Follow the 90-10 time budget in `lesson-structures.md`: new-concept orientation and explanation together may use at most 10% of total session time; practice and application of an already introduced idea are not new-material instruction.

## Infinite Jam generation

Generate rounds from concepts that are ready for transfer, with one explicit musical purpose per segment. A round can combine a scale, triad, chord voicing, or progression only when their key/root relationship is valid. On each chord change, derive the chord tones and compatible scale from the chord’s root and quality; do not select scale/chord names independently. Randomize rhythm and melodic figures inside the chosen constraints, and keep enough repetition for the learner to hear the harmony. New or weak concepts appear in short, lower-complexity segments; mastered concepts can be mixed and transposed. Each segment should identify its target before play and report pitch and rhythm feedback afterward.

## Map to the current 32-level course

| Course range | Algorithm role |
| --- | --- |
| 1–11 | Music vocabulary, the six performance areas, the four learning channels, guitar/fretboard mapping, basic rhythm/chords, notation, and a foundation checkpoint. |
| 12–13 | Interval vocabulary, spelling, sound, reading, fretboard shapes, and inversion. |
| 14–16 | Scale formulas, movable positions, roots/degrees, and scale sound. |
| 17–25 | Key/harmony relationships, major modes, jam application, other scales, pentatonic modes, minor/modal keys, and blues. |
| 26–29 | Triad construction, chord spelling, extensions, voicing, and inversion. |
| 30–32 | Progression function, substitution/modulation, whole-song analysis, and a cumulative transfer exam. |

This mapping follows the supplied course sequence while adding explicit prerequisites, observable evidence, delayed review, and transfer checks. It is a proposed product algorithm, not a claim that the PDF specifies these scoring thresholds.

## Current app gap this algorithm addresses

The lesson-content reset leaves built-in lesson titles and metadata in place but clears their descriptions and note sequences; Lessons 1–5 also have no linked lesson activities. Imported MusicXML lesson payloads are stripped of score and note content on load. The first content implementation should restore authored lesson/activity data with stable concept IDs. The app's lesson completion and workout evidence are not yet the mastery model described here: persist per-concept THINK/READ/HEAR/SPEAK evidence, separate PLAY evidence, enforce the two-day rule, and resolve prerequisites before using adaptive unlocks.
