import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Headphones, Lightbulb, Play, X } from 'lucide-react';
import type { Lesson } from '../types';
import { useMic } from '../context/MicContext';
import { MicToggleButton } from './MicToggleButton';
import { sound } from '../utils/audio';
import type { LearningEvidence, LessonActivity, StarterLessonBlueprint, StarterWorkoutBlueprint } from '../data/starterLearning';
import { STARTER_ACTIVITY_BY_ID } from '../data/starterLearning';
import type { FretboardData, FretboardPosition, PracticeLabConfig } from './tools/toolContracts';
import { Fretboard } from './tools/Fretboard';
import { PracticeLab } from './tools/PracticeLab';

type Session =
  | { kind: 'lesson'; blueprint: StarterLessonBlueprint; lesson: Lesson }
  | { kind: 'workout'; blueprint: StarterWorkoutBlueprint };

type AnswerState = 'idle' | 'incorrect' | 'correct' | 'revealed' | 'self-reported';
type EvidenceSource = 'mic' | 'self-report' | 'answer';

interface CoursePracticeModalProps {
  session: Session;
  evidence: LearningEvidence;
  onClose: () => void;
  onRecordEvidence: (activityId: string, correct: boolean, source: EvidenceSource, firstTry: boolean) => void;
  onCompleteLesson: (lessonId: string, earnedStars: number) => void;
}

const channelNames = { think: 'Think', read: 'Read', hear: 'Hear', speak: 'Speak', play: 'Play' } as const;
const STANDARD_TUNING = [
  { id: 'high-e', label: 'e', openMidi: 64 }, { id: 'b', label: 'B', openMidi: 59 },
  { id: 'g', label: 'G', openMidi: 55 }, { id: 'd', label: 'D', openMidi: 50 },
  { id: 'a', label: 'A', openMidi: 45 }, { id: 'low-e', label: 'E', openMidi: 40 },
];
const POSITION_BY_ACTIVITY: Record<string, FretboardPosition[]> = {
  'l2-read': [{ stringId: 'b', fret: 1 }, { stringId: 'high-e', fret: 3 }, { stringId: 'high-e', fret: 8 }],
  'l2-play': [{ stringId: 'high-e', fret: 3 }],
  'l3-open-strings': STANDARD_TUNING.map((string) => ({ stringId: string.id, fret: 0 })),
  'l3-fret-steps': [{ stringId: 'low-e', fret: 3 }],
  'l3-cycle': [{ stringId: 'b', fret: 0 }, { stringId: 'b', fret: 1 }],
  'l3-enharmonic': [{ stringId: 'high-e', fret: 2 }, { stringId: 'g', fret: 11 }],
  'l3-semitone': [{ stringId: 'g', fret: 0 }, { stringId: 'g', fret: 1 }],
  'l3-speak': [{ stringId: 'low-e', fret: 0 }, { stringId: 'low-e', fret: 1 }, { stringId: 'low-e', fret: 2 }, { stringId: 'low-e', fret: 3 }],
  'l3-play-g-low-e': [{ stringId: 'low-e', fret: 3 }],
  'l3-same-note': [{ stringId: 'g', fret: 0 }, { stringId: 'd', fret: 5 }],
};

function getActivityTool(activity: LessonActivity): 'fretboard' | 'practice-lab' {
  if (activity.tool) return activity.tool;
  return activity.channel === 'read' ? 'fretboard' : 'practice-lab';
}

function lessonFretboardData(level: number, activity: LessonActivity): FretboardData {
  const positions = POSITION_BY_ACTIVITY[activity.id] ?? [];
  const target = activity.performance?.targetNote;
  const targetPosition = target
    ? { stringId: ['low-e', 'a', 'd', 'g', 'b', 'high-e'][target.stringIndex], fret: target.fret }
    : undefined;
  return {
    tuning: STANDARD_TUNING,
    maxFret: 12,
    noteDisplay: level === 1 ? 'none' : 'selected',
    visiblePositions: positions,
    highlightedPositions: targetPosition ? [targetPosition] : [],
    targetPositions: targetPosition ? [targetPosition] : [],
  };
}

function lessonPracticeConfig(level: number): PracticeLabConfig {
  const lessonOne = level === 1;
  return {
    id: `starter-lesson-${level}-practice`,
    title: lessonOne ? 'Listening examples' : 'Pattern practice',
    description: lessonOne ? 'Compare musical details in a short example.' : 'Keep the musical relationship in view while answering.',
    rootOptions: [{ id: 'c', label: 'C', pitchClass: 0 }, { id: 'd', label: 'D', pitchClass: 2 }, { id: 'g', label: 'G', pitchClass: 7 }],
    materialOptions: lessonOne
      ? [{ id: 'music-areas', label: 'Six music areas' }, { id: 'pitch', label: 'Pitch' }, { id: 'rhythm', label: 'Rhythm' }]
      : [{ id: 'root-fifth-octave', label: 'Root–fifth–octave', family: 'pattern' }],
    tempo: { min: 50, max: 120, step: 5, default: 80 },
    modes: [{ id: 'single', label: 'Focused', strategy: 'single' }],
    defaultMode: 'single', defaultRootId: 'c',
    defaultMaterialIds: [lessonOne ? 'music-areas' : 'root-fifth-octave'],
    sequence: { minItems: 1, maxItems: 8, defaultItems: lessonOne ? 2 : 3 },
  };
}

function LessonToolStage({ level, activity }: { level: number; activity: LessonActivity }) {
  const tool = getActivityTool(activity);
  return <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-3 pt-3 sm:pt-6">
    <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#11151b]/95 p-3 shadow-2xl sm:p-4">
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
        <span>{tool === 'fretboard' ? 'Fretboard' : 'Practice Lab'}</span><span>Lesson {level} · tool view</span>
      </div>
      {tool === 'fretboard'
        ? <Fretboard {...lessonFretboardData(level, activity)} />
        : <div className="flex justify-center"><PracticeLab config={lessonPracticeConfig(level)} onGenerate={() => undefined} /></div>}
    </div>
  </div>;
}

function playActivityAudio(activity: LessonActivity, chordName?: string) {
  const example = activity.audioExample;
  if (!example) return;
  const chordToPlay = chordName ?? example.chord;
  if (chordToPlay) {
    sound.playChord(chordToPlay);
    return;
  }
  if (example.demo && example.notes?.[0]) {
    const { stringIndex, fret } = example.notes[0];
    if (example.demo === 'timbre') sound.playTimbreDemo(stringIndex, fret);
    else sound.playDynamicsDemo(stringIndex, fret);
    return;
  }
  if (example.notes?.length) {
    sound.playSequence(example.notes.map(({ stringIndex, fret }) => ({ stringIndex, fret })), example.notes.length > 1 ? 470 : 0);
  }
}

export const CoursePracticeModal: React.FC<CoursePracticeModalProps> = ({ session, evidence, onClose, onRecordEvidence, onCompleteLesson }) => {
  const { isMicActive, livePitch } = useMic();
  const activities = useMemo(
    () => session.blueprint.activityIds.map((id) => STARTER_ACTIVITY_BY_ID[id]).filter(Boolean),
    [session.blueprint.activityIds],
  );
  const [activityIndex, setActivityIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [attemptsForActivity, setAttemptsForActivity] = useState(0);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const activity = activities[activityIndex];
  if (!activity) return null;
  const lessonLevel = session.kind === 'lesson' ? session.blueprint.level : null;
  const hasLessonToolStage = lessonLevel !== null && lessonLevel <= 3;

  const progress = Math.round((activityIndex / Math.max(activities.length, 1)) * 100);
  const activityEvidence = evidence[activity.id];
  const isLastActivity = activityIndex === activities.length - 1;
  const expectedNote = activity.performance?.targetNote;
  const heardNote = livePitch.noteName ? `${livePitch.noteName}${livePitch.octave ?? ''}` : 'Listening…';

  const recordResult = (correct: boolean, source: EvidenceSource) => {
    const isFirstTry = attemptsForActivity === 0;
    onRecordEvidence(activity.id, correct, source, isFirstTry);
    setAttemptsForActivity((value) => value + 1);
    if (correct) {
      if (isFirstTry && activity.kind === 'choice') setFirstTryCorrectCount((value) => value + 1);
      setAnswerState(source === 'self-report' ? 'self-reported' : 'correct');
    } else {
      setAnswerState(hasLessonToolStage || attemptsForActivity < 1 ? 'incorrect' : 'revealed');
    }
  };

  const submitChoice = () => {
    if (!selectedOption || activity.kind !== 'choice') return;
    recordResult(selectedOption === activity.correctOptionId, 'answer');
  };

  const checkMicrophone = () => {
    if (!expectedNote || !isMicActive) return;
    const matches = livePitch.isStable
      && livePitch.noteName === expectedNote.noteName
      && livePitch.octave === expectedNote.octave
      && Math.abs(livePitch.cents ?? 100) <= 50;
    recordResult(matches, 'mic');
  };

  const continueActivity = () => {
    if (!isLastActivity) {
      setActivityIndex((value) => value + 1);
      setSelectedOption(null);
      setAnswerState('idle');
      setAttemptsForActivity(0);
      return;
    }
    if (session.kind === 'lesson') {
      const questionCount = Math.max(1, activities.filter((item) => item.kind === 'choice').length);
      const scoreRatio = firstTryCorrectCount / questionCount;
      const stars = scoreRatio >= 0.85 ? 3 : scoreRatio >= 0.6 ? 2 : 1;
      onCompleteLesson(session.lesson.id, stars);
    }
    setFinished(true);
  };

  const retry = () => {
    setSelectedOption(null);
    setAnswerState('idle');
  };

  const onCloseSession = () => {
    sound.playClick();
    onClose();
  };

  const correctOption = activity.options?.find((option) => option.id === activity.correctOptionId);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0d1015]">
      {hasLessonToolStage && <LessonToolStage level={lessonLevel} activity={activity} />}
      <div className="fixed inset-0 z-[1] bg-black/55 backdrop-blur-[1px]" />
      <section role="dialog" aria-modal="true" aria-label={session.blueprint.title} className={`relative z-[2] mx-auto my-3 sm:my-6 w-[calc(100%-1.5rem)] ${hasLessonToolStage ? 'mt-[22vh] max-h-[75dvh]' : 'max-h-[92dvh]'} max-w-2xl overflow-hidden rounded-3xl bg-[#171a1f] border border-white/10 shadow-2xl flex flex-col`}>
        <header className="shrink-0 p-4 sm:p-6 border-b border-white/[0.08]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-emerald-300">
                <span>{session.kind === 'lesson' ? `Lesson ${session.blueprint.level}` : 'Focused workout'}</span>
                <span className="text-gray-600">·</span>
                <span>{session.kind === 'lesson' ? 'Learn' : `${session.blueprint.durationMinutes} min`}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">{session.blueprint.title}</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{session.kind === 'lesson' ? session.blueprint.objective : session.blueprint.description}</p>
            </div>
            <button type="button" onClick={onCloseSession} aria-label="Close practice" className="shrink-0 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
          {!finished && <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5"><span>Question {activityIndex + 1} of {activities.length}</span><span>{Math.round((progress + 100 / Math.max(activities.length, 1)))}% journey</span></div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${Math.round(((activityIndex + 1) / activities.length) * 100)}%` }} /></div>
          </div>}
        </header>

        {finished ? (
          <div className="p-6 sm:p-8 text-center overflow-y-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-400/15 text-emerald-300 flex items-center justify-center"><Check className="w-7 h-7" /></div>
            <h3 className="text-2xl font-black mt-4">Session complete</h3>
            <p className="text-sm text-gray-400 mt-2">Your answers and practice checks were saved. Review the priority card after a few sessions to see what needs attention next.</p>
            <button onClick={onCloseSession} className="mt-6 h-11 px-6 rounded-xl bg-emerald-400 text-black font-black text-sm">Done</button>
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${activity.channel === 'play' ? 'bg-blue-500/15 text-blue-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                {channelNames[activity.channel]}
              </span>
              {activityEvidence?.attempts ? <span className="text-[10px] text-gray-500">Seen {activityEvidence.attempts} times</span> : <span className="text-[10px] text-gray-500">New practice</span>}
            </div>

            <div className="rounded-2xl bg-[#20242b] border border-white/[0.07] p-4 sm:p-5">
              <h3 className="text-lg sm:text-xl font-bold leading-snug">{activity.prompt}</h3>
              <p className="text-sm text-gray-400 mt-2">{activity.context}</p>

              {activity.audioExample && <div className="mt-4 flex flex-wrap gap-2">
                {activity.audioExample.chord && <button onClick={() => playActivityAudio(activity)} className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-2"><Headphones className="w-4 h-4" />{activity.audioExample.label}</button>}
                {activity.audioExample.chords?.map((chord) => <button key={chord.name} onClick={() => playActivityAudio(activity, chord.name)} className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-2"><Headphones className="w-4 h-4" />{chord.label}</button>)}
                {activity.audioExample.notes && <button onClick={() => playActivityAudio(activity)} className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-2"><Play className="w-3.5 h-3.5 fill-current" />{activity.audioExample.label}</button>}
              </div>}

              {activity.kind === 'choice' && <div className="mt-4 grid gap-2">
                {activity.options?.map((option) => {
                  const chosen = selectedOption === option.id;
                  const showCorrect = answerState === 'revealed' && option.id === activity.correctOptionId;
                  return <button key={option.id} type="button" disabled={answerState === 'correct' || answerState === 'revealed'} onClick={() => setSelectedOption(option.id)} className={`w-full min-h-11 text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${showCorrect ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : chosen ? 'border-blue-400 bg-blue-500/10 text-blue-100' : 'border-white/10 bg-black/10 text-gray-200 hover:bg-white/5'}`}>
                    <span className="inline-flex items-center gap-2">{showCorrect && <Check className="w-4 h-4" />}{option.label}</span>
                  </button>;
                })}
              </div>}

              {activity.kind === 'perform' && <div className="mt-4 rounded-xl bg-black/20 border border-white/5 p-3">
                <ol className="space-y-2 text-xs text-gray-300 list-decimal list-inside">
                  {activity.performance?.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
                </ol>
                {expectedNote && <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-bold">Target: {expectedNote.noteName}{expectedNote.octave} · {expectedNote.label}</span>
                  <MicToggleButton variant="pill" showLabel />
                  {isMicActive && <span className="text-xs text-gray-400">Detected: {heardNote}</span>}
                </div>}
                <button type="button" onClick={() => recordResult(true, 'self-report')} disabled={answerState === 'correct' || answerState === 'self-reported' || answerState === 'revealed'} className="mt-3 w-full min-h-10 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-100 text-xs font-bold">{activity.performance?.selfCheckLabel ?? 'I completed the playing task'}</button>
                {expectedNote && <button type="button" onClick={checkMicrophone} disabled={!isMicActive || answerState === 'correct' || answerState === 'revealed'} className="mt-2 w-full min-h-10 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 text-xs font-black">Check detected pitch</button>}
                {expectedNote && isMicActive && livePitch.noteName && <p className="mt-2 text-[10px] text-gray-500">Pitch check requires a stable note close to the target. Chord quality is self-checked; this microphone reads one note at a time.</p>}
              </div>}

              {answerState === 'incorrect' && <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100"><div className="font-bold flex items-center gap-2"><Lightbulb className="w-4 h-4" />Try once more</div><p className="mt-1 text-xs text-amber-100/80">{activity.hint ?? 'Review the clue and choose again.'}</p></div>}
              {answerState === 'correct' && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-100"><div className="font-bold flex items-center gap-2"><Check className="w-4 h-4" />Correct</div><p className="mt-1 text-xs text-emerald-100/80">{activity.explanation}</p></div>}
              {answerState === 'self-reported' && <div className="mt-4 rounded-xl border border-blue-300/20 bg-blue-300/5 p-3 text-sm text-blue-100"><div className="font-bold">Practice recorded</div><p className="mt-1 text-xs text-blue-100/80">Self-check recorded. {activity.explanation}</p></div>}
              {answerState === 'revealed' && <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100"><div className="font-bold">Review this one, then continue</div><p className="mt-1 text-xs text-amber-100/80">{correctOption ? `Answer: ${correctOption.label}. ` : ''}{activity.explanation}</p></div>}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" onClick={onCloseSession} className="h-10 px-3 rounded-xl text-xs text-gray-400 hover:bg-white/5">Save and exit</button>
              <div className="flex gap-2">
                {activity.kind === 'choice' && answerState === 'idle' && <button type="button" onClick={submitChoice} disabled={!selectedOption} className="h-10 px-4 rounded-xl bg-blue-600 disabled:opacity-40 text-white text-xs font-black">Check answer</button>}
                {answerState === 'incorrect' && <button type="button" onClick={retry} className="h-10 px-4 rounded-xl bg-amber-300 text-black text-xs font-black">Try again</button>}
                {['correct', 'revealed', 'self-reported'].includes(answerState) && <button type="button" onClick={continueActivity} className="h-10 px-4 rounded-xl bg-emerald-400 text-black text-xs font-black flex items-center gap-1.5">{isLastActivity ? 'Finish session' : 'Next'}<ChevronRight className="w-4 h-4" /></button>}
              </div>
            </div>
            {activityStateDescription(activity, answerState, attemptsForActivity) && <p className="mt-2 text-center text-[10px] text-gray-500">{activityStateDescription(activity, answerState, attemptsForActivity)}</p>}
          </div>
        )}
      </section>
    </div>
  );
};

function activityStateDescription(activity: LessonActivity, answerState: AnswerState, attempts: number) {
  if (answerState === 'idle' && activity.kind === 'choice') return 'Answer first. The explanation appears after you check.';
  if (answerState === 'incorrect') return 'No penalty for a retry. Use the clue and try a different answer.';
  if (answerState === 'revealed') return 'This attempt is saved as a review priority for a later workout.';
  if (answerState === 'self-reported') return 'This is self-reported evidence, not a microphone-verified result.';
  if (answerState === 'correct' && attempts > 1) return 'Correct after a retry. It may appear again in a workout.';
  return '';
}
