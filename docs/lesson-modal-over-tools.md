# Future UX reference: lesson questions over practice tools

**Status:** Design reference for lesson implementation and learner-flow improvements. Lessons 1–3 now use this modal-over-tool layout; later lessons remain future work.

Use this document when implementing or revising lesson activities, Fretboard/Practice Lab integration, retries, feedback, and mastery progression. Keep the tool view visible beneath the question modal and preserve its state while the learner answers.

For the end-to-end learner journey and concrete question sequence for Lessons 1–10, see [lesson-walkthroughs-1-to-10.md](./lesson-walkthroughs-1-to-10.md). The walkthrough expands these interaction rules without changing the modal-over-tool requirement.

## Layout rule

Lesson questions are presented in a modal overlay above a practice tool. The tool remains the underlying view and supplies the current context; the modal owns the question prompt, answer controls, hint, feedback, and progression.

```text
┌──────────────────────────────────────────────────────────┐
│ Underlying tool view                                     │
│                                                          │
│  Fretboard view                 OR   Practice Lab view    │
│  • tuning and positions              • lesson settings   │
│  • target and detected notes         • generated session │
│                                                          │
│     ┌────────────────────────────────────────────┐       │
│     │ Question modal                             │       │
│     │ prompt · choices/instructions · hint       │       │
│     │ answer feedback · Continue / Try again     │       │
│     └────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

The modal dims the underlying view, keeps it visible for context, and captures interaction until the learner answers, continues, or closes it. A question does not navigate away from the tool.

## Interaction lifecycle

1. The lesson selects a tool and its initial state, such as a target note on Fretboard or a configured exercise in Practice Lab.
2. The tool view renders underneath the question modal.
3. The modal asks one question or gives one action. It may receive live tool state, such as the detected note, and may send state changes to the tool, such as highlighting a target.
4. An incorrect answer leaves the same modal and tool open, shows targeted feedback, and allows another attempt.
5. A correct answer shows the explanation in the modal. Continue advances to the next question while keeping the tool view and its state in place. If the next activity uses a different tool, the host changes the underlying tool and opens the next modal over it.
6. Closing the modal exits the current question flow and returns to the underlying tool view. Lesson completion is recorded only when its configured success criteria are met.

## Example: Lesson 1

```text
Lesson 1 selected
  └─ Fretboard view opens (standard tuning, target G4)
      └─ Question modal: “Which question checks pitch?”
          ├─ Incorrect → hint and retry; same modal stays above Fretboard
          └─ Correct → explain pitch; Continue
              └─ Question modal: “Play G4”
                  ├─ Wrong pitch → show detected note; retry over Fretboard
                  └─ G4 detected → highlight position; explain success
                      └─ Continue through rhythm, timbre, dynamics,
                         technique, notation, and phrase review
```

For listening questions, the modal can sit above Practice Lab configured with the relevant example. The learner hears or configures the example in the tool view, then answers in the overlay. The tool is selected per activity; questions are always modal overlays, not separate destination pages.

## Example: Lesson 2

```text
Lesson 2 selected
  └─ Practice Lab view opens (root C, pattern 1–5–8)
      └─ Question modal: “What does 5 name?”
          ├─ Incorrect → hint and retry over Practice Lab
          └─ Correct → explain fifth degree; Continue
              └─ Question modal: “Which notes spell 1–5–8 in C?”
                  ├─ Incorrect → retry in the same overlay
                  └─ Correct (C–G–C) → Continue
                      └─ Switch underlying tool to Fretboard
                          └─ Question modal overlays Fretboard
                              ├─ Prompt learner to play C4–G4–C5
                              ├─ Wrong/missed note → show feedback and retry
                              └─ Correct sequence → explanation and transfer prompt
                                  └─ Configure a new root in Practice Lab;
                                     ask the transfer question in a modal
```

## Component boundary

- **Tool view:** Fretboard or Practice Lab. It renders its own configurable state and reports events to the lesson host.
- **Question modal:** generic overlay driven by question data (prompt, response type, choices or instructions, hints, explanation, and success rule).
- **Lesson host:** chooses the tool for each activity, passes question context and tool state, checks the response, and advances or retries.

The modal should not embed a separate copy of either tool. It overlays the active tool view and coordinates with it through props and callbacks. Tool data contracts are specified in [practice-tools-api.md](practice-tools-api.md).
