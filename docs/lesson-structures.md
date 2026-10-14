# Lesson structures for the 32-level guitar course

This is the content blueprint for implementing the course in the app. It follows the sequence in the user-provided *Absolutely Understand Guitar* support package and applies the four-channel pattern-learning loop in [guitar-mastery-algorithm.md](./guitar-mastery-algorithm.md). Lesson text and activities below are paraphrased and designed as implementation specifications; they are not transcripts of the source.

Dedicated review and exercise-only sessions are defined separately in [workout-system.md](./workout-system.md). Lessons teach; workouts adaptively practice concepts that have already been introduced.

## How every lesson should work in the app

Each lesson is a small learning unit, not one long video or one undifferentiated tab. The four learning channels are **THINK, READ, HEAR, and SPEAK** (name, sing, or explain the pattern). Instrument performance is a separate **PLAY** check. The app should create the following blocks from authored content:

1. **Orient (1–2 min):** state a concrete goal and show one short example in sound and on the fretboard.
2. **Understand (2–4 min):** explain the musical relationship in plain language, then prompt retrieval without the explanation visible.
3. **Read (2–4 min):** decode a diagram, tab, score, chord symbol, or rhythm. Show only the notation needed for that lesson.
4. **Hear (2–4 min):** compare sounds, sing or hum the target, then answer randomized listening questions.
5. **Play (5–10 min):** perform a short focused exercise, starting slowly. Progress from one string / one position to a second position or key.
6. **Use it (3–8 min):** apply the idea in a phrase, chord change, song excerpt, or jam with real musical context.
7. **Check and reflect (1–2 min):** report results in THINK, READ, HEAR, and SPEAK; record PLAY evidence separately; review pitch, rhythm, timbre, dynamics, technique, and notation as applicable.

Lessons may shorten blocks that do not fit a given concept, but must keep the four learning channels visible. Do not mark an idea mastered because a learner watched the orientation or finished a single play-through.

## Question-and-answer interaction

The session should feel like an active coach asking, listening, and following up—not a page that reveals an answer and then asks the learner to copy it. Use one prompt at a time and wait for the learner’s answer before revealing the explanation. Present each question in a modal over the active Fretboard or Practice Lab view; keep the tool visible beneath the overlay and preserve its state during retries and between questions. See [the future lesson-modal flow](./lesson-modal-over-tools.md).

```text
ask(prompt, channel, context)
answer = collect(choice | typed answer | sung/playable response | self-report)
evidence = evaluate(answer, channel)
show(correct answer + brief reason + evidence source)
if correct:
    ask a changed-context follow-up or move to the next channel
else:
    name the specific misconception
    offer one hint or simpler example
    ask a new equivalent question
    if still incorrect after the retry:
        show a short explanation, route a repair drill, and revisit later
```

Do not just say “wrong.” Explain the musical reason, such as “F is the 3rd of D minor; the fretboard location you played was F-sharp.” Correct answers should also get a brief reason, then a transfer question so success is not just lucky guessing. Keep retries low-pressure; track them for mastery evidence but do not punish experimentation.

Examples of the same concept across the four learning channels (PLAY is an additional performance check):

- **THINK:** “Starting on D, what is the fifth scale degree?” Then ask how the learner derived it.
- **READ:** show a short tab/score fragment and ask for the note, degree, or duration.
- **HEAR:** play two interval/chord examples and ask which matches the target; follow with a sing-back prompt.
- **SPEAK:** ask the learner to name, sing, or explain the target without the answer visible.
- **PLAY check:** ask the learner to find and play a target note, then ask for the same pitch in another location. Use the mic only when available; otherwise offer a clearly labeled self-check.

For higher-level work, ask about musical choices too: “Which chord feels like home here? What evidence supports your answer?” Accept more than one analysis when the audio or progression is genuinely ambiguous, and explain the evidence behind each valid answer.

## Content object for future implementation

Every lesson should be authored as data with stable concept IDs, so activity selection and learner progress do not depend on matching title text.

```ts
interface LessonBlueprint {
  id: string;
  sequence: number;
  title: string;
  stage: 'foundation' | 'intervals' | 'scales' | 'harmony' | 'chords' | 'songcraft';
  objectives: string[];
  prerequisiteConceptIds: string[];
  conceptIds: string[];
  estimatedMinutes: number;
    activities: {
    think: ActivitySpec[];
    read: ActivitySpec[];
    hear: ActivitySpec[];
      speak: ActivitySpec[];
    transfer: ActivitySpec[];
  };
  performanceChecks: Array<'pitch' | 'rhythm' | 'timbre' | 'dynamics' | 'technique' | 'notation'>;
  mastery: MasteryRule;
  remediationByError: Record<string, string[]>;
}
```

An `ActivitySpec` should identify the prompt, expected answer or target notes, notation/audio/fretboard assets, key and tuning constraints, tempo range, attempts, error labels, and evidence source (`mic`, `player`, or `selfReport`). Store the four channel scores separately. Store the six performance checks separately; they answer different questions.

Use stable concept IDs with this format: `<domain>.<concept>[.<variant>]`. Use lowercase ASCII kebab-case within each segment; IDs are permanent references, not display labels. Examples: `interval.perfect-fifth`, `scale.major`, `scale.major.position-1`, `chord.triad.minor`, and `progression.ii-v-i.major`. Every lesson's `conceptIds` and `prerequisiteConceptIds`, activity records, review records, and imported-score tags must use the same IDs.

For learning-channel evidence, use `THINK | READ | HEAR | SPEAK`. Keep motor performance as separate `PLAY` evidence. The mastery record should include the channel, threshold, two distinct passing days, permitted evidence sources, transfer requirement, and delayed recall:

```ts
interface MasteryRule {
  channel: 'THINK' | 'READ' | 'HEAR' | 'SPEAK';
  threshold: { passes: number; of: number };
  distinctDaysRequired: 2;
  evidenceSourcesAllowed: Array<'mic' | 'player' | 'selfReport' | 'teacherCheck'>;
  requiresNonSelfReportFor?: Array<'PLAY' | 'HEAR'>;
  transferRequired: boolean;
  recallCheckAfterDays: 3;
}
```

## The 32 lesson blueprints

In the table, **T/R** means THINK and READ activities; **H/S** means HEAR and SPEAK activities. PLAY performance is described separately in activity/gate text. **Transfer gate** is the lesson-specific evidence to collect in addition to the shared mastery thresholds in the algorithm document. The named lessons mirror the app’s existing 32 titles.

| # / lesson | Goal and prerequisite | T/R activities | H/S activities | Transfer and lesson gate |
|---|---|---|---|---|
| **1. The 6 Main Areas of Music** | Learn the six review lenses: pitch, rhythm, timbre, dynamics, technique, notation. No prerequisite. | Sort examples by the musical question they answer; annotate a very short score with pitch and rhythm cues. | Compare two takes with different pitch, pulse, tone, volume, or technique; play a simple familiar phrase while naming what to notice. | Play a complete, easy phrase/song and give one evidence-based observation for each relevant area. Establish a baseline; do not gate later pitch concepts on subjective tone scores. |
| **2. 4 Ways To Know Your Pitch Patterns** | Learn THINK, READ, HEAR, and SPEAK as separate ways to know one pattern. No prerequisite. PLAY is a separate performance check. | Use one simple root–fifth–octave pattern to spell its degrees and match it to a fretboard diagram. | Identify the pattern from two audio examples; say or sing the degrees, then play them as a performance check. | Pass one task in each learning channel for the same pattern and pass the separate PLAY check. Save this as the learner’s first four-channel progress record. |
| **3. The Dumb Machine** | Understand tuning, chromatic notes, open strings, semitones, frets, and movable note locations. Prerequisite: Lesson 2. | Recall the 12-note cycle and standard tuning; read string/fret coordinates and enharmonic spellings. | Hear same-note/octave and half-step contrasts; play a chromatic sequence on every string with sensible four-finger placement and shifts. | First pass a motor-readiness check: relaxed fretting, clean single notes, and a controlled one-fret shift at a slow tempo. Then find named notes on two string sets and across the open-to-12th-fret range. Record tuning/note-name errors separately from finger coordination; do not schedule speed drills until this gate passes. |
| **4. Basic Chords** | Treat a chord as simultaneous notes and connect root, quality, and a playable open-chord shape. Prerequisite: basic note locations from Lesson 3. | Label roots and chord qualities on simple diagrams; read chord symbols and identify which strings sound. | Compare major and minor sounds; form clean open-chord shapes and strum each string or chord at a steady pulse. | Build and play a small authored set of open chords; identify root and quality without relying on shape name alone. Full-chord success requires full-chord evidence or a clearly labeled self-check. |
| **5. More About Chords** | Name a chord from root + quality + form, and reverse-engineer a shape. Prerequisite: Lesson 4. | Construct chord names from roots/qualities; inspect diagrams to mark root, quality tones, and movable form. | Hear major/minor contrast and root motion; move a simple form to a new key and play it cleanly. | Name unseen diagrams and build a requested chord in a second position. Require note-spelling knowledge, not only shape recognition. |
| **6. Still More About Chords** | Coordinate chord changes with picking/strumming and beat subdivisions. Prerequisite: Lessons 4–5 and basic pulse. | Read a two-chord chart with beat counts; plan the change before it occurs. | Hear whether changes land with the beat; strum/pick a chord pair at quarter, eighth, and sixteenth-note subdivisions, increasing tempo only after clean repetitions. | Play a full short progression without stopping. Score timing and chord-transition accuracy independently. |
| **7. Music By The Numbers** | Use root and scale degrees to describe patterns independent of key. Prerequisite: Lessons 3–5. | Convert a short note pattern to scale degrees and transpose its numbers to a new root. Read Roman/Arabic degree labels. | Hear tonic/root stability and recognize a repeated interval pattern in different keys; play it in two keys. | Transpose a simple melody or chord pattern without changing its interval structure. Check both note spelling and actual guitar location. |
| **8. Caveman Music Theory** | Derive a major-scale formula from whole and half steps, then construct the guide's three fingerings from that formula. Introduce the harmonic series as supporting context. Prerequisite: note names, semitones, and intervals. | Derive the W–W–H–W–W–W–H pattern; build a one-string scale before looking at a diagram, then label the three fingerings. | Hear the scale and its root; say/sing the formula and play the constructed fingerings. | Construct the scale from the formula and play it in the authored positions. Do not require the 1–5–8 power-chord structure here; place that material in Lesson 9. This placement follows the teacher-guide review and should be checked against the guide before final content production. |
| **9. Notation And Rhythm** | Read the guitar staff and tab as different information systems; understand pitch vertically and time horizontally. Introduce the 1–5–8 power-chord structure as a short application. Prerequisite: Lessons 3 and 8. | Map staff positions to guitar pitches; decode strings/frets in tab and note what tab does not specify. Spell root–fifth–octave and map it to a power-chord shape. | Listen to the same pitches in different registers; say/sing 1–5–8, then play the authored power-chord example. | Read a short staff/tab line and build the 1–5–8 shape from its formula. Rhythm symbols move to Lesson 10. Chord success must not be inferred from lead-note-only microphone evidence. |
| **10. More About Notation** | Read rhythm symbols and notation details: quarter/eighth/sixteenth notes and rests, key signatures, accidentals, measures, time signatures, dotted values, and ties. Prerequisite: Lesson 9. | Decode rhythm symbols; count note/rest values per measure; read a small set of key and time signatures. | Hear meter and subdivision; clap/count, then play short examples with rests, dots, and ties. Listen back to the attempt and compare it with the reference. | Perform a short score in time and explain one notation decision. Gate on correct duration as well as pitch. |
| **11. Silence and The Note** | Consolidate foundational vocabulary: rests, note, pitch, tuning, fretboard, notation, and six performance areas. Prerequisite: Lessons 1–10. | Use a mixed retrieval quiz across note names, rhythm symbols, tuning, and the four channels. Read a simple tab-plus-rhythm passage. | Distinguish sound from silence and identify/play isolated target pitches and rhythmic events. | Foundation checkpoint: pass core pitch and rhythm checks and finish a short piece. Failures route back to the corresponding earlier lesson; no new theory is introduced here. |
| **12. Intervals** | Learn intervals as distances between two notes and as melodic/harmonic patterns. Prerequisite: Lessons 3, 7, and 11. | Spell interval sizes from a root; sort interval names by number and quality. Read two-note examples in staff, tab, and degree form. | Compare intervals in sequence and simultaneously; sing then play simple intervals from several roots. | Identify and perform a randomized subset of simple intervals in more than one location. Track confused pairs for targeted ear drills. |
| **13. More About Intervals** | Expand interval spelling, quality, inversions, and alternate fretboard fingerings. Prerequisite: Lesson 12. | Derive interval quality and inversion; verify the number-complement and quality change rules. Read interval shapes in score/diagram. | Hear an interval and its inversion; play equivalent interval targets on different string sets, including the G–B tuning adjustment. | Name, invert, and play intervals in two locations. Require transfer beyond one memorized shape. |
| **14. The Must Know Scales** | Define scales as ordered interval patterns; learn the core scale families used later. Prerequisite: Lessons 12–13. | Derive major-scale and selected minor/pentatonic formulas; spell scale degrees from different roots. Read a scale in degree notation and fretboard form. | Hear major/minor/pentatonic contrasts; sing degree patterns, then play slowly from a fixed root. | Construct and play an authored core scale in two keys; distinguish formula errors from fingering errors. Introduce the book’s must-know families in staged sets, not all at once. |
| **15. More About Scales** | Connect scale formulas to movable fretboard positions, roots, shifts, and ergonomic fingering. Prerequisite: Lesson 14 and Lesson 3 shifts. | Mark roots/degrees on a position chart and explain how a pattern moves when transposed. Read ascending/descending fingerings. | Hear root resolution; play up/down across strings, then connect adjacent positions without losing the root. | Play the same scale in two neck positions and two keys. Score note correctness, fingering/shift cleanliness, and pulse separately. |
| **16. Still More About Scales** | Strengthen scale interval recognition and melodic sound; connect a formula to its musical character. Prerequisite: Lessons 14–15. | Retrieve formulas and compare which degrees differ between closely related scales. Read short scale fragments and identify altered degrees. | A/B listen to scale families over a stable root/chord; sing a target degree and play a short melodic phrase. | Identify the scale family from sound and formula, then improvise a short phrase that emphasizes the target altered degree. |
| **17. Diatonic Harmony a la Music Theory** | Harmonize the major scale into diatonic triads and connect degrees, chord qualities, and key. Prerequisite: Lessons 7, 14, and 16. | Build the I–ii–iii–IV–V–vi–vii° chord set from scale thirds; read Roman numerals and chord symbols. | Hear chord-quality/order patterns; play a one-key diatonic chord set and arpeggiate each chord. | Build the diatonic set in two keys and identify a likely home chord in a short progression using multiple clues. |
| **18. More About Modes** | Understand modes as distinct interval organizations/tonal centers, not just a scale shape starting on a different note. Prerequisite: Lessons 14 and 17. | Compare each major mode’s degrees with its root; identify the characteristic tones and embedded chord. | Hear mode examples over their supporting chord; sing characteristic tones and play matched mode/chord pairs. | Given a chord and tonal center, select and play a fitting mode in two positions. The audio must make the modal center clear. |
| **19. The Mode Jam Tracks** | Apply mode/chord relationships in a backing track and build melodic vocabulary. Prerequisite: Lessons 17–18. | Map each chord change to its root, chord tones, and scale degrees; plan target notes for a phrase. | Listen for chord changes; sing a phrase before playing it, then improvise with chord-tone landings. | Complete a multi-chord jam without losing the form; record one phrase and explain where it follows the harmony. Increase tempo or complexity only after steady form and target notes. |
| **20. Other Scales and Modes** | Explore additional scale families and decide when their sound/function is relevant. Prerequisite: Lessons 14–19. | Compare formulas against major/minor and identify distinctive intervals. Read one authored chart per selected scale. | A/B listen to each scale against a deliberately chosen chord/drone; play only a small subset at first. | Choose a scale that fits a supplied musical context and demonstrate its characteristic tone. Keep rare/exotic scales as optional enrichment, not a gate for core fluency. |
| **21. Pentatonic Modes** | Derive pentatonic modes and understand which scale degrees are omitted relative to diatonic modes. Prerequisite: Lessons 14, 18, and 20. | Build major/minor pentatonic formulas and compare them with the related diatonic mode. Read roots, omitted degrees, and positions. | Hear pentatonic phrases over different chords; sing/play a phrase that includes an omitted degree as a deliberate color tone. | Improvise over two chord contexts, naming a useful omitted tone and landing on a chord tone. |
| **22. Music In Minor Keys** | Identify minor tonal centers and relate natural, harmonic, and melodic minor forms to harmony. Prerequisite: Lessons 17–18. | Compare relative major/minor, scale degrees, key signatures, and common minor-key chord sets. Read i, iv, V/v, and related numerals. | Hear the minor tonic as “home”; compare natural-minor and raised-leading-tone sounds over a minor progression. | Analyze a short progression to identify likely minor center and scale choice; perform the progression and a matching melody. Avoid deciding key from the first chord alone. |
| **23. Modal Music** | Distinguish modal tonal organization from major/minor key behavior; understand how harmonic-minor modes can support chord changes. Prerequisite: Lessons 18 and 22. | Compare tonal center and characteristic degrees; relate a mode’s formula to its chord quality. Read a modal progression map. | Hear a sustained modal center and chord changes; improvise using characteristic tones without defaulting to relative-major patterns. | Explain which note feels like home, identify the characteristic tone, and play a phrase that establishes it. |
| **24. Playin’ The Blues** | Connect minor pentatonic/blues vocabulary, blue notes, dominant harmony, and expressive articulation. Prerequisite: Lessons 21 and 23. | Spell the blues-scale ingredients and recognize dominant-7 chord tones; read bend/slide/vibrato symbols used in the exercise. | Hear blue-note tension/resolution; sing short blues phrases and play bends/slides in tune and in time. | Play a short blues phrase over a blues backing, resolve a target note, and self-check pitch, rhythm, timbre, and technique. |
| **25. Blues Jam With Dan Lawson** | Working title pending rights review: confirm permission to use Dan Lawson's name in the product title; if unconfirmed, use a neutral title such as **Blues Jam**. Turn blues riffs into rhythmic/melodic vocabulary and apply them over a full blues form. Prerequisite: Lesson 24 and basic form counting. | Read and segment original app-authored blues licks; label their scale degrees, rhythm, and form location. | Listen for riff placement and call/response; learn a lick by ear, then play it with a backing track. | Complete the full blues form, vary one lick, and transpose a fragment. Use source riffs only where rights are confirmed; otherwise author original examples with the same learning objective. Verify that imported scores do not use unsupported alternate endings for this form gate. |
| **26. Triads** | Derive major, minor, augmented, and diminished triads from interval formulas and play inversions across string sets. Prerequisite: Lessons 12–13 and 17. | Spell each triad, identify quality from intervals, and read root position / inversions. | Hear quality and bass-note changes; play triad inversions on multiple string groups. | Build a requested triad from any supplied root and identify its inversion from sound/diagram. Track chord-tone accuracy independent of chord grip speed. |
| **27. Chords** | Extend triad knowledge to seventh and extended chord spellings, symbols, and practical voicings. Prerequisite: Lesson 26. | Construct common seventh/extended chords by adding scale degrees; decode symbols and enharmonic spellings. | A/B listen to chord qualities; play compact voicings and arpeggios, naming the tones. | Spell and play a requested chord in a usable position; distinguish the intended chord quality from a familiar shape. |
| **28. Chord Voicing** | Arrange chord tones in different orders/registers; understand inversions and voice movement. Prerequisite: Lessons 26–27. | Analyze root position/inversions and compare two voicings; read stacked notes and chord diagrams. | Hear bass-note and register changes; play smooth voice-leading between a pair of chords. | Connect a two- or three-chord progression using the smallest sensible note movements, while preserving chord identity. |
| **29. More About Chord Voicing** | Expand voicing choices across the neck and compare sound, register, and playability. Prerequisite: Lesson 28. | Identify duplicated/missing chord tones and root location; read alternate voicings on different string sets. | Compare voicings in context; play the same progression in two registers with clean transitions. | Select a voicing for a supplied arrangement goal (clear bass, compact range, or smooth transition) and justify the choice. |
| **30. Chord Progressions** | Analyze progression function in a key and recognize common movement patterns. Prerequisite: Lessons 17, 22, and 26–29. | Convert chords to Roman numerals; identify tonic, predominant, and dominant roles in simple progressions. Read a chart and map its form. | Hear tension, arrival, and repetition; play progressions with a steady groove and sing/identify roots. | Analyze and perform a complete progression in two keys, then compose a short variation that preserves or intentionally changes its function. |
| **31. Modulation and Substitution** | Hear and explain key changes and chord substitutions; use shared tones and harmonic function as evidence. Prerequisite: Lessons 30 and 13. | Compare original/substitute chords, inspect common tones, and map related keys. Read a progression before/after a modulation. | Hear stable versus shifted tonal centers; play a short pivot or substitution and sing the new root. | Analyze a progression containing a change, identify evidence for the new center, then create a simple alternate progression. Accept multiple musically defensible analyses when the evidence is ambiguous. |
| **32. And In The End** | Integrate fretboard, patterns, notation, harmony, technique, and musical judgment in complete-song analysis. Prerequisite: all core concepts. | Complete a cumulative retrieval exam; analyze an unfamiliar song for form, key center, rhythm, intervals, scale/chord relations, and notation. | Identify selected patterns by ear; perform a prepared song and a short improvised/arranged response. | Finish a whole song, reflect across all six performance areas, explain the musical choices, and choose a personal next-study goal. The result is a mastery profile, not a binary “guitar complete” badge. |

## Mastery gates and error routing

Use the shared thresholds in the algorithm document as initial defaults: THINK and READ at 4/5, HEAR at 8/10 across contexts, SPEAK at 4/5, and PLAY at 90% pitch plus 85% rhythm across two attempts, keys, or positions where applicable. Passing evidence must span at least two distinct calendar days; multiple attempts in one sitting do not satisfy this rule. Require a transfer task and a recall check after three days before marking a concept stable. A prerequisite must also have no overdue failed recall when a dependent lesson unlocks. Store the channel and evidence source for each result. A self-report must never be presented as microphone-verified accuracy.

For chord PLAY gates, store evidence as `leadNoteOnly`, `selfReport`, `teacherCheck`, or `polyphonicAnalysis`. `leadNoteOnly` from the current notation-player projection can count toward its single-note pitch target, but cannot pass a full-chord gate. A full-chord gate requires polyphonic analysis or a clearly labeled self-report/teacher check.

For every PLAY activity, include a listen-back or comparison step: play a reference before the attempt, then let the learner hear their recorded attempt when recording is available and compare it with the reference. If recording is unavailable, give an immediate note/timing result and a second attempt. The app must not imply it measured tone quality, dynamics, or technique unless those signals are actually analyzed.

Map errors to repair drills: wrong spelling or degree → THINK; misread symbol or location → READ; confused sound or function → HEAR; unable to name, sing, or explain → SPEAK; missed fret/shift/chord tone → PLAY; timing miss → rhythm subdivision; clean notes with weak musical fit → transfer/application. Revisit the error in a later mixed session rather than simply replaying the same exercise immediately.

For full-song work, the six areas are complementary checklists, not six equal automatic microphone scores. The app can measure note/pulse alignment in supported exercises, but tone quality, expressive dynamics, technique, and notation understanding need explicit listening/self-review activities unless the app adds validated signal analysis for those skills.

## Practice dynamic for the learner

### A 30-minute lesson-led session (90-10 new-material budget)

Use the teacher-guide target of about 10% of session time for new material. In a 30-minute session, orientation and explanation together are capped at three minutes; practice and application of that concept do not count as new-material instruction.

| Block | Minutes | Use |
|---|---:|---|
| Tune and settle | 2 | Tune, check posture, and establish a relaxed pulse. |
| Recall | 5 | Retrieve due concepts before opening hints. |
| New concept | 3 | Orient and explain one small idea only. |
| Hear and speak | 4 | Listen, compare, sing/name the target, and explain its relationship. |
| Play accurately | 9 | Practice slowly; vary position/key after clean repetitions. Raise tempo by 4–5 BPM only after three clean repetitions; simplify after two broken attempts. |
| Use it | 5 | Apply the concept in a phrase, song fragment, chord change, or jam. |
| Review | 2 | Log evidence by channel and source, weakest area, and next review date. |

Total: **30 minutes**. New-material instruction: **3/30 minutes (10%)**. Do not add orientation or explanation time elsewhere in the session without subtracting from this block.

### Weekly rhythm

- **Sessions 1–3:** learn one new concept per session and complete its four-channel loop over those sessions.
- **Session 4:** mixed review of older patterns, especially due or recently missed items.
- **Session 5:** play one complete song or a complete jam form; record a short take and choose one improvement target.
- Take a rest day when hands or attention are fatigued. Short, clean, attentive sessions beat long repetitions with accumulating tension.

The most important rule is: **think it, read it, hear it, speak it, play it, then use it in music.** THINK/READ/HEAR/SPEAK are learning channels; PLAY is separate motor-performance evidence. If a channel is weak, route the next practice there instead of repeating the strongest drill.

For a review-only or targeted workout day, use the adaptive session structure and time presets in [workout-system.md](./workout-system.md); do not introduce a new core concept as if it were already taught.

## Improvements I recommend before app implementation

1. Restore authored lesson content after the reset: the current built-in lesson objects retain titles and metadata but have empty descriptions/notes, and Lessons 1–5 have no linked activity IDs. Replace title-based categorization with authored blueprints and stable concept IDs. Keep the exact 32 course titles as labels, not as the learning logic.
2. Make progression dependency-based. Let learners preview later topics, but mark them as not yet ready until prerequisites are demonstrated; a single finished player session should not unlock the whole course.
3. Separate mastery by THINK / READ / HEAR / SPEAK, and retain PLAY performance and error-level evidence separately. Require passing evidence on two distinct days; do not compress all progress into one stars/accuracy number.
4. Build real activity assets: fretboard note data, interval/scale/chord formulas, original short notation/tab examples, audio comparisons, and playable exercises. A title should never imply that an arbitrary generated note sequence teaches that topic.
5. Add a visible “why this exercise?” explanation and a short remediation action after mistakes. Let the learner hear the correct answer and try again in a different context.
6. Keep songs and jam practice as transfer tasks. Infinite Jam should draw from learned material and remain harmonically coherent; introduce one new challenge at a time.
7. Design microphone checks honestly: monophonic note detection can assess single-note pitch/timing, but chord quality and tone/dynamics require different analysis or guided self-review.
8. Use the PDF as a conceptual reference. Create original app explanations, examples, and exercises; do not copy complete lessons, recordings, or tablature into a distributable app unless the appropriate rights are confirmed.
