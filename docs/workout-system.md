# Workout system for the guitar-learning app

Workouts are deliberate practice sessions built from concepts the learner has already met in the course. A lesson introduces and explains an idea; a workout retrieves it, corrects weak spots, varies its context, and turns it into fluent playing. A workout can include a short reminder, but should not quietly introduce a prerequisite concept and then score the learner as if they had been taught it.

This system consumes the concept IDs, channel evidence, mastery rules, and error routing defined in [guitar-mastery-algorithm.md](./guitar-mastery-algorithm.md) and [lesson-structures.md](./lesson-structures.md).

## Workout outcomes

Every workout has one primary objective and a small number of related secondary objectives. It must state:

- the concept or technique being practiced and why it was selected;
- the learning channel being trained: THINK, READ, HEAR, or SPEAK; record guitar performance as separate PLAY evidence;
- the musical context and success condition;
- what to do when the learner misses;
- the evidence the app can really measure, and whether any part is self-reported.

Do not use a generic “speed / stamina / finger independence” label unless the exercises measure that skill and it supports a lesson objective. Do not set arbitrary BPM, chord-change-time, or endurance targets with no learner baseline.

## Workout types

1. **Daily adaptive workout:** combines due review, the learner’s weakest channel, a short interleaved review, and musical application. This is the default “Build my workout” action.
2. **Fretboard and pitch workout:** note naming, string/fret recall, chromatic movement, intervals, roots, and shift practice. It starts with notes and positions already introduced.
3. **Rhythm and coordination workout:** pulse, subdivision, rests, accents, strumming, picking, and chord changes. Use clap/count before instrument speed drills.
4. **Scale and melody workout:** formula/degree retrieval, scale positions, phrase construction, target tones, and transposition.
5. **Chord and harmony workout:** chord spelling, quality, inversion, voicing, progression function, and smooth changes.
6. **Technique workout:** a focused physical skill such as alternate picking, slides, bends, muting, or finger shifts. Always attach a musical note/rhythm pattern and a clean-tone criterion; technique is not isolated from music.
7. **Song / jam workout:** analyze and perform a complete phrase or form, apply current patterns to real changes, then reflect across the six performance areas.

The learner can start a fixed workout by type, but the exercises should still adapt to key, tuning, current tempo, known positions, and recent errors. Infinite Jam belongs under musical application: it can mix scales, triads, chords, and other material only when the harmonic sequence makes those choices coherent.

## Standard workout structure

Each generated workout is a sequence of blocks. The app shows the objective, estimated time, and reason for every block.

| Block | Purpose | Example |
|---|---|---|
| **Prepare** | Tune, check posture, establish a comfortable pulse. | Tune to the selected tuning; clap four steady beats; play a relaxed chromatic warm-up if already learned. |
| **Recall** | Retrieve due concepts before hints, using the deterministic due-item order below. | Name three notes, spell an interval, or identify a chord quality from last week. |
| **Focus drill** | Train the weakest relevant channel with immediate feedback. | Hear a minor third, then sing it and find it in two fretboard locations. |
| **Interleave** | Mix the target with one or two previously stable patterns. | Alternate major/minor triad identification, or switch two known chord forms on the beat. |
| **Musical use** | Apply the idea in a phrase, song section, chord progression, or jam. | Land on chord tones as a two-chord backing track changes. |
| **Review** | Summarize evidence, identify one next step, and schedule recall. | “You found the notes correctly; the late eighth notes need a slower pulse drill tomorrow.” |

Scale each block to the selected session length. Never remove the musical-use and review blocks from a full workout. Short workouts can omit interleaving, but should still include recall, one focused drill, and one tiny musical application.

## New-material budget

Workouts are review and fluency sessions, so they should normally contain no new core concept. If a workout must introduce one, cap orientation and explanation at **10% of total workout time** (at most 30 seconds in a 5-minute workout, 1 minute in a 10-minute workout, 2 minutes in a 20-minute workout, and 3 minutes in a 30-minute workout). Count all explanation and orientation toward this cap, including explanations embedded in prompts. The 60% review / 30% weak-skill repair / up-to-10% stretch balance below applies to focus-block selection; it does not authorize extra new-concept teaching. Do not grade a stretch preview as mastered until the concept has been taught and its prerequisites pass.

### Session length presets

| Length | Prepare | Recall | Focus | Interleave | Musical use | Review |
|---|---:|---:|---:|---:|---:|---:|
| **5 minutes** | 30 sec | 1 min | 2 min | — | 1 min | 30 sec |
| **10 minutes** | 1 min | 2 min | 3 min | 1 min | 2 min | 1 min |
| **20 minutes** | 2 min | 3 min | 6 min | 3 min | 4 min | 2 min |
| **30 minutes** | 2 min | 4 min | 8 min | 5 min | 8 min | 3 min |

These are starting allocations; the app may rebalance slightly based on selected target, but should not turn every session into a speed test.

## Adaptive workout builder

### Inputs

- learner-selected time, instrument tuning, and available equipment;
- current lesson and prerequisite readiness;
- due review items and per-concept THINK / READ / HEAR / SPEAK scores, plus separate PLAY performance evidence;
- recent error types, retries, accuracy, and stable tempo;
- preferred goal (e.g. understand notes, improve rhythm, play songs, improvise);
- available song/jam material and whether mic evidence is enabled.

### Selection algorithm

```text
function buildWorkout(learner, timeBudget, goal):
    candidates = concepts already introduced and safe to practice
    due = candidates with reviews due, sorted by:
          1) repeated errors in the last 7 days, descending
          2) overdue days, descending
          3) concept ID, alphabetical ascending
    weak = candidates whose weakest channel is below mastery, sorted by impact
    current = the current lesson concept, if it has been introduced

    choose one primary target:
        due item with repeated error, otherwise
        weakest relevant concept, otherwise
        current lesson concept, otherwise
        a stable concept due for varied transfer

    prepare a short recall block for the primary target
    prepare one focused drill for its weakest channel
    add at most two interleaved concepts that are already stable
    choose a song/jam context that makes the target musically relevant
    scale blocks to timeBudget
    reject any generated item whose pitches, tuning, rhythm, or harmonic context are inconsistent
    return blocks with success criteria, feedback, remediation, and evidence source

    after completion:
        update channel-level evidence
        schedule or reschedule reviews
        explain what improved and what to practice next
```

Suggested starting content balance for the focus block: **about 60% due or recently learned review, 30% weak-skill repair, and up to 10% stretch/transfer**. This is a selection mix among already taught concepts; a stretch task is not new instruction. Stretch tasks are previews, not graded tests, unless all prerequisites are satisfied. Adjust the balance after product data shows that learners are being overloaded or under-challenged.

## Feedback and question/answer behavior

Workouts use the same one-question-at-a-time coach loop as lessons: ask, wait for the answer, evaluate, explain briefly, and follow up in a changed context. THINK / READ / HEAR / SPEAK are learning channels; playing an instrument is recorded separately as PLAY evidence. Examples:

- “Find G on the D string. Which other location gives you the same pitch?”
- “Which of these is the minor third? Sing it, then play it from A.”
- “The chord changed from D minor to G7. Which notes are strong landing points now?”
- “Your pitches were right but arrived late. Would a slower quarter-note count or clearer subdivision help?”

If the answer is correct, vary key, position, rhythm, or context before treating it as fluent. If it is wrong, identify the kind of error and route a repair drill. After repeated misses, lower complexity, provide a concise explanation, then revisit the concept later instead of repeating the identical prompt.

## Tempo, repetition, and physical practice rules

- Start at a tempo where the learner can produce relaxed, clean notes and count the subdivision.
- Increase by 4–5 BPM only after three clean repetitions; decrease or simplify after two broken attempts.
- A “clean” repetition means correct target notes, steady rhythm, no avoidable buzz/muting errors, and comfortable movement—not merely reaching the metronome number.
- Keep drill fragments short, then reassemble them into a phrase or progression.
- Use bounded sets (e.g. 3–5 attentive repetitions) and brief breaks. Do not reward pain, tension, or fatigue as “stamina.”
- Record the stable tempo and exact exercise version so the next session starts from evidence rather than a fixed level label.

## Weekly practice plan

For a learner practicing five days per week:

- **Three lesson days:** one new lesson, its four-channel checks, and a short linked workout on prior material.
- **One adaptive workout day:** mostly due reviews and the weakest channel; avoid introducing a new core concept.
- **One music day:** complete song or jam form, recording/self-review, and one chosen improvement for next week.
- **Rest or light-play days:** optional; do not reset streaks or imply that fatigue is lack of discipline.

The learner may select a different time budget, but the app should preserve the idea of spaced practice and weekly full-music transfer.

## Example workouts

### Fretboard: find and hear a note (10 min)

Prepare: tune and establish pulse. Recall: answer three due note-name questions. Focus: find the target pitch on one string, then the same pitch elsewhere; say its name before playing. Interleave: identify one nearby semitone. Musical use: play a short melody containing the target. Review: report note accuracy and whether the alternate position was easy.

### Chord changes with time (20 min)

Prepare: clap/count the meter. Recall: name the two chord spellings and identify each root. Focus: switch between the chords at a slow quarter-note pulse. Interleave: hear and name the chord quality without looking. Musical use: play a full progression with a backing groove and keep time through the change. Review: separate chord-note errors from late transitions.

### Scale tones over changing chords (30 min)

Prepare: tune, set a comfortable tempo. Recall: spell the scale and identify the chord roots. Focus: sing and play the chord tones in one position. Interleave: add a stable scale pattern in another position. Musical use: improvise over a coherent progression, target a chord tone at each change, then repeat with a varied rhythm. Review: identify where the harmony changed and choose one phrase to keep.

## Relationship to the current app

**Implementation check (source inspection):** `WorkoutsTab` currently ranks five static `STARTER_WORKOUTS` from saved activity evidence, and `CoursePracticeModal` plays the referenced `STARTER_ACTIVITIES`. The recent lesson-content reset cleared the activity links from `STARTER_LESSONS`, but did not remove those activities from the workout catalog. As a result, the current workout view can still present foundational instructional activities without a linked lesson showing that the concepts were introduced. Before treating these as review-only workouts, either restore and link the lesson content or classify these activities as standalone lessons with their own introduction and mastery rules.

Future implementation should replace static presets with authored `WorkoutBlueprint` data and the adaptive builder above. The `Workout` type should reference concept IDs and activity blocks; `targetSkill` text alone is not enough to generate or score a workout.

**Implementation check (source inspection):** `PitchDetector` provides stable monophonic pitch estimates, and `LessonPlayerModal` compares detected pitch with the current target note inside a timed playback window. This supports target-note checks with coarse timing-window feedback; it is not a standalone rhythm-performance score. Chord recognition, tone quality, dynamics, and physical technique are not measured by that path and need separate validated analysis or guided self-review. Keep measured evidence and self-report visibly distinct.
