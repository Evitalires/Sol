# Learner flow walkthrough: Lessons 1–10

**Status:** Implementation reference. The question loop and tool-underlay are implemented for Lessons 1–3. Lessons 4–10 remain planned. This document defines the learner journey, screen/tool transitions, question behavior, and success routing for the first ten lessons and expands [lesson-modal-over-tools.md](./lesson-modal-over-tools.md).

## Shared interaction rules

- A lesson opens the relevant **Fretboard** or **Practice Lab** view, then presents one question at a time in a modal over that view. The tool remains visible and retains its configuration during retries and successive questions.
- The question modal owns the prompt, response controls, hint, feedback, explanation, and Continue/Try again action. The lesson host owns activity selection, tool configuration, evaluation, progress, and lesson completion.
- Each response receives a clear result: what the learner did, what was expected, why it matters, and what happens next. A wrong answer gets a focused hint and an equivalent retry. Repeated difficulty routes to a simpler repair question and schedules later recall; it does not trap the learner in an endless identical loop.
- Close exits the current lesson flow to the underlying tool. It saves completed evidence and current progress, but does not mark the lesson passed.
- Use **THINK, READ, HEAR, SPEAK** as the four learning channels. **PLAY** is a separate performance check. Mark microphone, player, and self-report evidence distinctly; do not present self-report as measured input.
- A question can accept a selection, typed answer, spoken/sung response, or instrument action. Tool selection and response type are chosen per activity, not fixed for a whole lesson.
- A correct answer is followed by a short explanation. Where appropriate, the next prompt changes the note, key, string set, or context to check transfer rather than repeating the same item.
- The 90/10 session budget applies to instruction: in a 30-minute session, keep new-concept explanation to about 3 minutes. Practice and application of an already introduced concept are not new-material instruction. Lessons can span sessions.
- Mastery requires evidence across distinct days and transfer/delayed recall as defined in [guitar-mastery-algorithm.md](./guitar-mastery-algorithm.md); finishing the on-screen sequence is not by itself mastery.

## Reusable question loop

```text
Open lesson
  -> lesson host selects tool + supplies its initial state
  -> tool view appears
  -> question modal opens over tool
  -> learner answers / sings / plays
      -> incorrect: modal explains the specific miss, gives hint, retries
         -> repeated miss: simpler repair prompt; save error for later review
      -> correct: modal explains why; save channel + evidence source
         -> Continue: next modal question; retain tool state
         -> tool change needed: update underlying tool, then open next modal
  -> lesson checkpoint summarizes evidence and next due action
```

The following lesson flows give representative prompts and transitions. Content labels follow the updated [lesson-structures.md](./lesson-structures.md), including the revised placement for Lessons 8–10.

## Lesson 1 — The 6 Main Areas of Music

**Goal:** identify pitch, rhythm, timbre, dynamics, technique, and notation as distinct ways to observe a performance. This establishes a baseline; it is not a tone-quality exam.

```text
Lesson 1
  -> Practice Lab opens with two short versions of the same phrase
  -> modal Q1: “Which question checks pitch?”
       Expected: “Did I play the right notes?”
       Explain: pitch concerns which notes sounded; rhythm concerns when they sounded.
  -> modal Q2: hear two takes; “What changed: pitch or rhythm?”
       Wrong -> replay comparison + hint; retry over the same Practice Lab examples
       Right -> explain the audible evidence; Continue
  -> modal Q3: match examples to timbre, dynamics, or technique
       Explain each term using the example just heard
  -> switch underlying tool to Fretboard
  -> modal READ prompt: mark which displayed information identifies pitch
       Feedback separates note location/name from duration information
  -> modal PLAY prompt: play a short, supported single-note phrase
       Feedback reports only signals the app actually measures; otherwise self-check
  -> return to Practice Lab for a short phrase/listening reflection
  -> modal asks for one observation in each applicable area
  -> save baseline profile; no later concept is blocked by subjective tone/dynamics
```

The six areas are pitch, rhythm, timbre, dynamics, technique, and notation. The four learning channels are recorded separately where applicable; PLAY evidence is additional. Avoid converting subjective observations into microphone scores.

## Lesson 2 — 4 Ways To Know Your Pitch Patterns

**Goal:** learn one pattern through THINK, READ, HEAR, and SPEAK, then perform it as a separate PLAY check.

```text
Lesson 2
  -> Practice Lab opens with root C and pattern 1–5–8
  -> modal THINK Q1: “In 1–5–8, what does 5 mean?”
       Expected: the fifth degree above the root
       Explain the relationship; retry with a simpler root/degree example if missed
  -> modal THINK Q2: “Which notes spell 1–5–8 from C?”
       Expected: C–G–C (octave/register specified by the exercise)
  -> modal READ prompt: identify root, fifth, and octave in the diagram
  -> modal HEAR prompt: choose the matching pattern from two short examples
       Follow with SPEAK: name or sing root–fifth–octave
  -> underlying tool switches to Fretboard, preserving lesson context
  -> modal PLAY prompt: play C–G–C at the displayed positions
       Wrong note -> show detected/expected note when available; retry same sequence
       Correct -> highlight positions and explain the interval pattern
  -> Practice Lab changes root (for example, to D)
  -> modal transfer prompt: identify and play the transposed 1–5–8
  -> checkpoint stores one result per learning channel plus PLAY evidence
```

Passing this lesson’s immediate checkpoint requires a successful example in each learning channel. Stable concept mastery still follows the distinct-day and delayed-recall rules.

## Lesson 3 — The Dumb Machine

**Goal:** connect standard tuning, open strings, semitones, frets, and the twelve-note cycle.

```text
Lesson 3
  -> Fretboard opens in standard tuning, with open strings labeled
  -> modal THINK: recall open-string names and explain a semitone
  -> modal READ: “What note is this string/fret coordinate?”
       Retry with the string and fret highlighted; reveal spelling after response
  -> Practice Lab plays same-note/octave and half-step comparisons
  -> modal HEAR: choose same pitch, octave, or semitone apart
  -> modal SPEAK: name a displayed note / explain enharmonic spelling
  -> Fretboard modal PLAY: find requested notes across two string sets
       Show one target at a time; report correct note separately from clean movement
  -> transfer prompt uses a new string set or fret location
  -> checkpoint may span sessions; require target-note evidence over open-to-12th-fret range
```

Do not require a single sitting to satisfy the gate. Avoid prescribing a weekly drill cap unless a future workout policy explicitly configures one.

## Lesson 4 — Basic Chords

**Goal:** connect chord root, quality, and playable open shape. Power-chord instruction is reserved for Lesson 9 in the updated blueprint.

```text
Lesson 4
  -> Practice Lab plays authored major/minor chord examples
  -> modal HEAR: compare the qualities and identify the difference
  -> modal THINK: identify root and quality from a chord symbol
  -> Fretboard view shows an authored open-chord diagram
  -> modal READ: mark root/quality tones and identify strings to play
  -> modal PLAY: form and play the requested open chord
       Lead-note-only detection cannot pass a full-chord gate
       If full chord analysis is unavailable, offer labeled self-check/teacher-check evidence
  -> modal transfer: identify root and quality without being shown the chord name
  -> Practice Lab plays a short two/three-chord progression
  -> checkpoint separates chord identity from fingering and timing evidence
```

Use “root” for the chord’s structural/naming note. It is not necessarily the lowest-sounding note; inversions can put another chord tone in the bass.

## Lesson 5 — More About Chords

**Goal:** move both directions between chord name, root/quality/form, and shape; spell notes rather than rely on a memorized grip.

```text
Lesson 5
  -> Fretboard shows an authored chord shape with its name hidden
  -> modal READ: infer the chord name and identify its root/quality
  -> modal THINK: spell the notes required by a requested root + quality
  -> Practice Lab compares major/minor sound on the same root
  -> modal HEAR/SPEAK: identify and name the quality
  -> Fretboard modal PLAY: build the requested chord in a second position
       Hint reveals root first, then quality tones; retry retains the diagram
  -> transfer uses a different root/form so shape memory alone is insufficient
  -> checkpoint reports name-to-shape and shape-to-name separately
```

Full-chord success requires valid full-chord evidence or clearly labeled self/teacher-check evidence, never lead-note-only evidence.

## Lesson 6 — Still More About Chords

**Goal:** coordinate chord changes with a steady pulse and practical subdivisions. Formal rhythm-symbol reading remains in Lesson 10.

```text
Lesson 6
  -> Practice Lab opens a two-chord progression with click/count-in
  -> modal THINK: predict when the chord changes
  -> modal READ: follow the chord chart and beat counts (no new notation-symbol unit)
  -> modal HEAR: identify whether a change lands on time or late
  -> Fretboard/Practice Lab PLAY prompt: change chords at a comfortable pulse
       Feedback separates chord accuracy from timing
       Slow tempo after repeated breaks; increase only after clean repetitions
  -> transfer: play the full progression without stopping
  -> checkpoint records timing and chord accuracy as separate outcomes
```

## Lesson 7 — Music By The Numbers

**Goal:** describe interval patterns with scale degrees so the pattern transfers to another key.

```text
Lesson 7
  -> Practice Lab plays the same melody in two keys
  -> modal THINK: “What stayed the same?”; derive degrees from the root
  -> modal READ: map notes to degree labels in the supplied example
  -> modal HEAR/SPEAK: recognize and name the same interval pattern
  -> Fretboard modal PLAY: play the pattern in the first key
  -> Practice Lab/Fretboard switches root; modal transfer asks for the second key
  -> checkpoint verifies spelling and location independently
```

## Lesson 8 — Caveman Music Theory

**Updated content:** major-scale formula and three major-scale fingerings, each built fret by fret from whole and half steps. The harmonic series may support an intuitive explanation of octave/fifth relationships; it does not replace the scale-fingering objectives.

```text
Lesson 8
  -> Practice Lab gives a short sound/example of whole-step and half-step distances
  -> modal THINK: choose the next distance in the major-scale formula
  -> modal READ: mark whole/half steps and scale degrees in the sequence
  -> Fretboard shows one scale fingering, built one note at a time
  -> modal prompt: locate the next note from the formula
       Incorrect -> highlight the prior note and step size; retry
       Correct -> add/highlight the next note and explain the distance
  -> repeat for the other two authored fingerings, in staged activities
  -> Practice Lab HEAR/SPEAK: recognize or sing a short major-scale fragment
  -> Fretboard PLAY: perform each fingering slowly; keep note and coordination feedback distinct
  -> transfer: derive/play a fingering from a new root
  -> checkpoint spans sessions and tests formula + location, not memorized shape alone
```

## Lesson 9 — Notation And Rhythm (updated title/content)

**Updated content:** guitar staff and tablature as complementary representations, plus the root–fifth–octave (1–5–8) power-chord structure. Rhythm symbols move to Lesson 10.

```text
Lesson 9
  -> Practice Lab presents one short sound in staff and tab
  -> modal THINK: state what each representation communicates
  -> modal READ: map staff pitch to a guitar note and decode tab string/fret
       Explain that tab may omit duration and other notation details
  -> Fretboard highlights the mapped note; modal asks learner to locate it
  -> modal THINK/READ: spell root–fifth–octave from a supplied root
  -> Fretboard shows the authored 1–5–8 power-chord shape
  -> modal PLAY: play the pattern/chord; gate requires full-chord evidence or labeled self/teacher check
  -> Practice Lab HEAR/SPEAK: identify and name the 1–5–8 relationship
  -> transfer: read a new short staff/tab example and map its root/fifth/octave
  -> checkpoint grades pitch/position and chord evidence separately
```

## Lesson 10 — More About Notation (expanded)

**Updated content:** rhythm symbols and rests, key signatures, accidentals, measures, time signatures, dotted values, and ties.

```text
Lesson 10
  -> Practice Lab plays a short score in two meters
  -> modal THINK: count beats and predict measure boundaries
  -> modal READ: decode note/rest values, key signature, accidentals, dots, and ties
       Prompt one notation decision at a time; show explanation after response
  -> modal HEAR: identify meter/subdivision and compare note durations
  -> modal SPEAK: count/clap the example before guitar performance
  -> Fretboard/Practice Lab PLAY: perform a short score in time
       Feedback separates pitch from duration; a right pitch with wrong duration is partial
  -> transfer: read a fresh short measure and explain one key-signature/accidental choice
  -> checkpoint requires both pitch and duration evidence
```

## Across-session completion and next steps

The lesson host saves progress at every completed question. On return, it resumes at the next due prompt or offers a short retrieval check; it does not replay mastered explanation by default. A checkpoint can remain pending across sessions while the learner gathers evidence on distinct days. At lesson end, show passed channels, PLAY evidence and its source, concepts needing repair, and the next due recall. Do not collapse these into one unexplained score.

Lesson 11 is the foundation checkpoint for Lessons 1–10. A missed concept routes back to its owning lesson or a targeted workout; the checkpoint should not silently teach new concepts.

## Documentation alignment

This walkthrough follows the established modal-over-tool design and the updated lesson blueprint. It corrects the supplied draft where it conflicted with those decisions: SPEAK is the fourth learning channel and PLAY is separate; Lesson 8 focuses on major-scale formula/fingerings; Lesson 9 includes staff/tab and 1–5–8 power chords; rhythm-symbol instruction is in Lesson 10; chord root is not necessarily the bass note. The detailed lesson blueprint remains the content authority, while this document describes the learner-facing flow.

