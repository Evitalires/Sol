import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, CircleHelp, Clock3, Gauge, LockKeyhole, Metronome, Pause, Play, RotateCcw, Repeat2, Settings2, SkipForward, Sparkles, Star, Volume2, VolumeX, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JamRound, Lesson, LessonNote } from '../types';
import { sound } from '../utils/audio';
import { PitchDetector } from '../utils/pitchDetector';
import { ORDERED_GUITAR_STRINGS } from '../constants/theme';
import { useMic } from '../context/MicContext';
import { MicToggleButton } from './MicToggleButton';
import { composeJamRound, JamMaterial, RHYTHMIC_FIGURES } from '../utils/jamGenerator';
import { RhythmFigureIcon } from './RhythmFigureTestSection';

interface LessonPlayerModalProps {
  lesson: Lesson;
  onClose: () => void;
  onCompleteLesson: (lessonId: string, earnedStars: number) => void;
}

type NoteResult = 'hit' | 'miss';
type Feedback = { kind: 'good' | 'close' | 'wrong' | 'miss'; text: string } | null;
const NOTE_SPEED = 112;
const TAB_STRINGS = [5, 4, 3, 2, 1, 0]; // Standard tab order: high E at the top.

function getTargetFrequency(note: LessonNote): number {
  const openString = ORDERED_GUITAR_STRINGS[note.stringIndex];
  return (openString?.freq ?? 110) * 2 ** (note.fret / 12);
}

function findFirstNoteAtOrAfter(notes: LessonNote[], time: number): number {
  let low = 0;
  let high = notes.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (notes[middle].time < time) low = middle + 1;
    else high = middle;
  }
  return low;
}

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({ lesson, onClose, onCompleteLesson }) => {
  const { isMicActive, micError, livePitch } = useMic();
  const [notes, setNotes] = useState(lesson.notes);
  const [rounds, setRounds] = useState<JamRound[]>(lesson.jamSettings?.rounds ?? []);
  const [isPlaying, setIsPlaying] = useState(Boolean(lesson.jamSettings?.infinite));
  const [currentTime, setCurrentTime] = useState(0);
  const baseTempo = lesson.score?.defaultTempoBpm ?? lesson.playbackTempo ?? 80;
  const beatQuarterLength = 4 / (lesson.score?.defaultTimeSignature.beatType ?? 4);
  const beatsPerMeasure = lesson.score?.defaultTimeSignature.beats ?? 4;
  const [tempo, setTempo] = useState(baseTempo);
  const [guided, setGuided] = useState(!lesson.jamSettings?.infinite);
  const [isWaiting, setIsWaiting] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(Boolean(lesson.jamSettings?.infinite));
  const [isCountInOn, setIsCountInOn] = useState(true);
  const [isSynthOn, setIsSynthOn] = useState(Boolean(lesson.jamSettings?.infinite));
  const [isNoteBallOn, setIsNoteBallOn] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(lesson.jamSettings?.infinite ? {kind:'close',text:`Rotation · ${lesson.jamSettings.materials.join(' → ')}`} : null);
  const [results, setResults] = useState<Record<number, NoteResult>>({});
  const [score, setScore] = useState(0);
  const [countInBeat, setCountInBeat] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(196);
  const [stringHeight, setStringHeight] = useState(32);
  const [viewportWidth, setViewportWidth] = useState(typeof window === 'undefined' ? 1280 : window.innerWidth);
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const previousFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const resultsRef = useRef<Record<number, NoteResult>>({});
  const metronomeBeatRef = useRef<number | null>(null);
  const synthNotesRef = useRef<Set<number>>(new Set());
  const nextNoteCursorRef = useRef(0);
  const pendingNoteIndicesRef = useRef<number[]>([]);
  const completedRef = useRef(false);
  const infiniteAutoStartedRef = useRef(false);
  const generatedThroughRoundRef = useRef(0);
  const lastNote = notes.at(-1);
  const totalDuration = Math.max(0.05, (lastNote?.time ?? 0) + (lesson.jamSettings?.infinite ? (lastNote?.duration ?? 0.05) : Math.max(1.8, lastNote?.duration ?? 0)));
  const measureDuration = beatsPerMeasure * beatQuarterLength * 60 / baseTempo;
  const beatDuration = beatQuarterLength * 60 / baseTempo;
  const tabWidth = Math.max(820, playheadPosition + totalDuration * NOTE_SPEED + 100);
  const activeNote = activeIndex === null ? null : notes[activeIndex] ?? null;
  const hitCount = Object.values(results).filter((result) => result === 'hit').length;
  const missCount = Object.values(results).filter((result) => result === 'miss').length;
  const accuracy = hitCount + missCount > 0 ? Math.round(hitCount / (hitCount + missCount) * 100) : 0;
  const earnedStars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
  const completedNotes = hitCount + missCount;
  const scoreableNoteCount = notes.filter((note) => !note.isRest).length;
  const detectedPitchLabel = livePitch.frequency && livePitch.noteName
    ? `${livePitch.noteName}${livePitch.octave ?? ''} · ${livePitch.frequency.toFixed(1)} Hz`
    : isMicActive ? 'Listening for a note…' : 'Microphone off';
  const tempoFeel = tempo < 70 ? 'Slow' : tempo <= 100 ? 'Moderate' : 'Fast';
  const activeRound = lesson.jamSettings?.infinite
    ? rounds.find((round) => currentTime >= round.startTime && currentTime < round.endTime) ?? rounds[0]
    : undefined;
  const activeRoundMaterialIndex = (() => {
    if (!activeRound?.materials.length || !activeRound.notes.length) return -1;
    const event = activeRound.notes.find((note) => currentTime >= note.time && currentTime < note.time + note.duration);
    return event?.materialIndex ?? -1;
  })();

  const setNoteResult = useCallback((noteIndex: number, result: NoteResult) => {
    if (resultsRef.current[noteIndex]) return;
    const nextResults = { ...resultsRef.current, [noteIndex]: result };
    resultsRef.current = nextResults;
    setResults(nextResults);
  }, []);

  const registerHit = useCallback((noteIndex: number, cents: number) => {
    const target = notes[noteIndex];
    if (!target || target.isRest || resultsRef.current[noteIndex]) return;
    setNoteResult(noteIndex, 'hit');
    setAttempted(true);
    const points = Math.max(50, 150 - Math.round(Math.abs(cents)) * 2);
    setScore((value) => value + points);
    setFeedback({ kind: 'good', text: `Correct · ${cents > 0 ? '+' : ''}${cents}¢` });
    sound.playNoteHit(Math.abs(cents) <= 20 ? 'perfect' : 'great');
    if (guided) {
      setIsWaiting(false);
      setActiveIndex(null);
      setIsPlaying(true);
    }
  }, [guided, notes, setNoteResult]);

  const markMiss = useCallback((noteIndex: number) => {
    if (resultsRef.current[noteIndex]) return;
    setNoteResult(noteIndex, 'miss');
    setAttempted(true);
    setFeedback({ kind: 'miss', text: 'Missed note · try it again' });
  }, [setNoteResult]);

  const closePlayer = useCallback(() => {
    setIsPlaying(false);
    sound.playClick();
    onClose();
  }, [onClose]);

  const finishLesson = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsPlaying(false);
    setIsFinished(true);
    const hits = Object.values(resultsRef.current).filter((result) => result === 'hit').length;
    const misses = Object.values(resultsRef.current).filter((result) => result === 'miss').length;
    const finalAccuracy = hits + misses ? Math.round(hits / (hits + misses) * 100) : 0;
    const stars = finalAccuracy >= 90 ? 3 : finalAccuracy >= 70 ? 2 : finalAccuracy >= 50 ? 1 : 0;
    onCompleteLesson(lesson.id, stars);
    if (stars === 3) {
      sound.playSuccessSound();
      try { confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } }); } catch { /* optional celebration */ }
    }
  }, [lesson.id, onCompleteLesson]);

  const resetPractice = useCallback((practiceNotes: LessonNote[]) => {
    setNotes(lesson.jamSettings?.infinite ? lesson.notes : practiceNotes);
    setRounds(lesson.jamSettings?.rounds ?? []);
    generatedThroughRoundRef.current = 0;
    const startTime = isCountInOn ? -4 * 60 / tempo : 0;
    timeRef.current = startTime;
    setCurrentTime(startTime);
    setResults({});
    resultsRef.current = {};
    nextNoteCursorRef.current = 0;
    pendingNoteIndicesRef.current = [];
    setScore(0);
    setFeedback(lesson.jamSettings?.infinite ? {kind:'close',text:'Mixed practice rounds · scales, triads, and chords'} : null);
    setActiveIndex(null);
    setIsWaiting(false);
    setIsFinished(false);
    setAttempted(false);
    setCountInBeat(null);
    setIsPlaying(true);
    synthNotesRef.current.clear();
    completedRef.current = false;
  }, [isCountInOn, lesson.jamSettings, lesson.notes, tempo]);

  useEffect(() => {
    if (!lesson.jamSettings?.infinite) return;
    if (infiniteAutoStartedRef.current) return;
    infiniteAutoStartedRef.current = true;
    // Infinite jams begin with a count-in, then play through as an audible backing phrase.
    resetPractice(lesson.notes);
  }, [lesson.jamSettings?.infinite, lesson.notes, resetPractice]);

  const togglePlayback = () => {
    sound.playClick();
    if (isWaiting && activeIndex !== null) {
      markMiss(activeIndex);
      setIsWaiting(false);
      setActiveIndex(null);
      setIsPlaying(true);
      return;
    }
    if (isFinished) {
      resetPractice(notes);
      return;
    }
    if (!isPlaying && currentTime === 0 && !attempted && isCountInOn) {
      timeRef.current = -4 * 60 / tempo;
      setCurrentTime(timeRef.current);
      setCountInBeat(4);
    }
    setIsPlaying((value) => !value);
  };

  const skipNote = () => {
    if (activeIndex === null) return;
    markMiss(activeIndex);
    setIsWaiting(false);
    setActiveIndex(null);
    setIsPlaying(true);
  };

  // Compare against the current target, rather than the nearest chromatic note's cents.
  useEffect(() => {
    if (!livePitch.frequency || !livePitch.isStable || activeIndex === null || !isWaiting) return;
    const target = notes[activeIndex];
    if (!target || target.isRest) return;
    const cents = PitchDetector.getCentsDiff(livePitch.frequency, getTargetFrequency(target));
    if (Math.abs(cents) <= 50) {
      registerHit(activeIndex, cents);
    } else if (livePitch.volume > 0.01) {
      const direction = cents > 0 ? `Sharp by ${Math.abs(cents)}¢` : `Flat by ${Math.abs(cents)}¢`;
      setFeedback({ kind: 'wrong', text: `Heard ${livePitch.noteName}${livePitch.octave ?? ''} · ${direction}` });
    }
  }, [activeIndex, isWaiting, livePitch, notes, registerHit]);

  // Continuous play scores only notes actually detected near the playhead.
  useEffect(() => {
    if (guided || !isPlaying || isWaiting || !livePitch.frequency || !livePitch.isStable) return;
    let closestIndex: number | null = null;
    let smallestDistance = Number.POSITIVE_INFINITY;
    const candidateIndices = lesson.jamSettings?.infinite ? pendingNoteIndicesRef.current : notes.flatMap((note, index) => note.isRest ? [] : [index]);
    candidateIndices.forEach((index) => {
      const note = notes[index];
      if (!note) return;
      if (resultsRef.current[index]) return;
      const distance = Math.abs(note.time - currentTime);
      if (distance <= 0.32 && distance < smallestDistance) {
        closestIndex = index;
        smallestDistance = distance;
      }
    });
    if (closestIndex !== null) {
      const note = notes[closestIndex];
      const cents = PitchDetector.getCentsDiff(livePitch.frequency, getTargetFrequency(note));
      if (Math.abs(cents) <= 50) registerHit(closestIndex, cents);
    }
  }, [currentTime, guided, isPlaying, isWaiting, lesson.jamSettings?.infinite, livePitch, notes, registerHit]);

  // Drive the tab, reference tone, metronome, guided stops and loop from one clock.
  useEffect(() => {
    if (!isPlaying || isFinished || isWaiting) {
      previousFrameRef.current = null;
      return;
    }
    const tick = (timestamp: number) => {
      if (previousFrameRef.current === null) previousFrameRef.current = timestamp;
      const delta = Math.min(0.1, (timestamp - previousFrameRef.current) / 1000);
      previousFrameRef.current = timestamp;
      const nextTime = timeRef.current + delta * (tempo / baseTempo);
      timeRef.current = nextTime;
      setCurrentTime(nextTime);
      if (nextTime < 0) {
        const beat = Math.max(1, Math.ceil(-nextTime / (60 / tempo)));
        setCountInBeat(beat);
        const countBeatIndex = Math.floor((nextTime + 4 * 60 / tempo) / (60 / tempo));
        if (isMetronomeOn && metronomeBeatRef.current !== countBeatIndex) {
          metronomeBeatRef.current = countBeatIndex;
          sound.playClick();
        }
      } else {
        setCountInBeat(null);
        if (isMetronomeOn) {
          const beatIndex = Math.floor(nextTime / (beatQuarterLength * 60 / baseTempo));
          if (metronomeBeatRef.current !== beatIndex) {
            metronomeBeatRef.current = beatIndex;
            sound.playClick();
          }
        }
        if (lesson.jamSettings?.infinite) {
          while (nextNoteCursorRef.current < notes.length && notes[nextNoteCursorRef.current].time <= nextTime) {
            const index = nextNoteCursorRef.current++;
            const note = notes[index];
            if (note.isRest) continue;
            if (resultsRef.current[index]) continue;
            if (!synthNotesRef.current.has(index)) {
              synthNotesRef.current.add(index);
              if (isSynthOn) sound.playPluck(note.stringIndex, note.fret, Math.min(note.duration * (baseTempo / tempo), 4));
            }
            if (guided) {
              setActiveIndex(index);
              setIsWaiting(true);
              setIsPlaying(false);
              setFeedback({ kind: 'close', text: `Play ${note.noteName} · string ${note.stringIndex + 1}, fret ${note.fret}` });
              timeRef.current = note.time;
              setCurrentTime(note.time);
              break;
            }
            pendingNoteIndicesRef.current.push(index);
          }
          if (!guided) {
            pendingNoteIndicesRef.current = pendingNoteIndicesRef.current.filter((index) => {
              if (resultsRef.current[index]) return false;
              if (nextTime > notes[index].time + 0.42) {
                markMiss(index);
                return false;
              }
              return true;
            });
          }
        } else {
          for (let index = 0; index < notes.length; index++) {
            const note = notes[index];
            if (note.isRest) continue;
            if (resultsRef.current[index] || note.time > nextTime) continue;
            if (!synthNotesRef.current.has(index)) {
              synthNotesRef.current.add(index);
              if (isSynthOn) sound.playPluck(note.stringIndex, note.fret, Math.min(note.duration, 1.2));
            }
            if (guided) {
              setActiveIndex(index);
              setIsWaiting(true);
              setIsPlaying(false);
              setFeedback({ kind: 'close', text: `Play ${note.noteName} · string ${note.stringIndex + 1}, fret ${note.fret}` });
              timeRef.current = note.time;
              setCurrentTime(note.time);
              break;
            }
            if (nextTime > note.time + 0.42) markMiss(index);
          }
        }
        if (lesson.jamSettings?.infinite) {
          // The queue stays ahead of playback. Once two rounds have completed,
          // append two more behind the final scheduled note without resetting
          // the transport clock or moving the playhead back to the start.
          const completedRoundCount = rounds.filter((round) => nextTime >= round.endTime).length;
          if (completedRoundCount >= 2 && completedRoundCount % 2 === 0 && completedRoundCount > generatedThroughRoundRef.current && rounds.length <= completedRoundCount + 1) {
            const settings = lesson.jamSettings;
            const available = settings.materials as JamMaterial[];
            const appendedRounds: JamRound[] = [];
            let startTime = rounds.at(-1)?.endTime ?? totalDuration;
            for (let offset = 0; offset < 2; offset++) {
              const round = composeJamRound(settings.root, available, baseTempo, rounds.length + offset + 1, startTime);
              appendedRounds.push(round);
              startTime = round.endTime;
            }
            generatedThroughRoundRef.current = completedRoundCount;
            setRounds((current) => [...current, ...appendedRounds]);
            setNotes((current) => [...current, ...appendedRounds.flatMap((round) => round.notes)]);
            setFeedback({kind:'close',text:`Added rounds ${appendedRounds[0].number}–${appendedRounds[1].number}`});
          }
        } else if (nextTime >= totalDuration) {
          if (isLooping) {
            resultsRef.current = {};
            setResults({});
            setScore(0);
            synthNotesRef.current.clear();
            timeRef.current = 0;
            setCurrentTime(0);
            setFeedback({ kind: 'close', text: 'Loop restarted' });
          } else {
            finishLesson();
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [finishLesson, guided, isFinished, isLooping, isMetronomeOn, isPlaying, isSynthOn, isWaiting, lesson.jamSettings, markMiss, notes, rounds, tempo, totalDuration]);

  useEffect(() => {
    const updateLayout = () => {
    setViewportWidth(window.innerWidth);
    setPlayheadPosition(Math.min(300, Math.max(150, window.innerWidth * 0.16)));
      setStringHeight(Math.max(25, Math.min(38, window.innerHeight * 0.032)));
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePlayer();
      if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement) && !(event.target instanceof HTMLSelectElement)) {
        event.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const measureLines = useMemo(() => {
    const first = Math.max(0, Math.floor(Math.max(0, currentTime - playheadPosition / NOTE_SPEED) / measureDuration) - 1);
    const last = Math.ceil((currentTime + (viewportWidth - playheadPosition) / NOTE_SPEED + 1) / measureDuration);
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
  }, [currentTime, measureDuration, playheadPosition, viewportWidth]);

  const visibleNotes = useMemo(() => {
    const firstTime = Math.max(0, currentTime - playheadPosition / NOTE_SPEED - 1);
    const lastTime = currentTime + (viewportWidth - playheadPosition) / NOTE_SPEED + 1;
    const firstIndex = findFirstNoteAtOrAfter(notes, firstTime);
    const lastIndex = findFirstNoteAtOrAfter(notes, lastTime + 0.0001);
    return notes.slice(firstIndex, lastIndex).map((note, offset) => ({ note, index: firstIndex + offset }));
  }, [currentTime, notes, playheadPosition, viewportWidth]);

  const rhythmNotes = useMemo(() => visibleNotes.map(({ note, index }) => {
    const durationInBeats = note.duration / (60 / baseTempo);
    const figure = RHYTHMIC_FIGURES.find((candidate) => candidate.id === note.rhythmFigureId)
      ?? RHYTHMIC_FIGURES.reduce((closest, candidate) => Math.abs(candidate.beats - durationInBeats) < Math.abs(closest.beats - durationInBeats) ? candidate : closest);
    return {
      index,
      left: playheadPosition + note.time * NOTE_SPEED - 60,
      duration: note.duration,
      beat: Math.floor(note.time / beatDuration + 0.0001),
      figure,
      isRest: Boolean(note.isRest),
      tupletGroupId: note.tupletGroupId,
    };
  }), [baseTempo, beatDuration, playheadPosition, visibleNotes]);

  const tabTranslate = Math.max(0, currentTime * NOTE_SPEED);
  const playableNotes = notes.filter((note) => !note.isRest);
  const ballNext = isWaiting && activeIndex !== null
    ? Math.max(0, playableNotes.findIndex((note) => note.time === notes[activeIndex]?.time))
    : Math.min(findFirstNoteAtOrAfter(playableNotes, Math.max(0, currentTime)), playableNotes.length - 1);
  const ballPrevious = Math.max(0, ballNext - 1);
  const fromBall = playableNotes[ballPrevious];
  const toBall = playableNotes[ballNext];
  const segmentProgress = fromBall && toBall && ballNext !== ballPrevious ? Math.min(1,Math.max(0,(currentTime-fromBall.time)/(toBall.time-fromBall.time))) : 0;
  const ballX = fromBall && toBall ? playheadPosition + (fromBall.time + (toBall.time-fromBall.time)*segmentProgress)*NOTE_SPEED - tabTranslate : 0;
  const ballY = fromBall && toBall ? (5-fromBall.stringIndex)*stringHeight + stringHeight/2 + (((5-toBall.stringIndex)*stringHeight + stringHeight/2)-((5-fromBall.stringIndex)*stringHeight + stringHeight/2))*segmentProgress - Math.sin(segmentProgress*Math.PI)*Math.min(38,stringHeight*1.2) : 0;

  return (
    <div role="dialog" aria-modal="true" aria-label={`${lesson.title} lesson player`} className="fixed inset-0 z-[100] bg-[#17181b] text-[#e8e8eb] flex flex-col overflow-hidden">
      <header className="h-[76px] px-4 sm:px-8 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#1d1e21]">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={closePlayer} aria-label="Close lesson" className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center shrink-0"><ChevronLeft className="w-6 h-6" /></button>
          <div className="min-w-0"><h1 className="text-lg sm:text-2xl font-bold truncate">{lesson.title}</h1><div className="text-[11px] sm:text-sm text-gray-400">{lesson.category} guitar lesson <span className="mx-1">·</span>{lesson.difficulty}</div></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0"><div className="hidden sm:block text-xs text-gray-400">{Math.floor(Math.max(0,currentTime) / 60)}:{String(Math.floor(Math.max(0,currentTime) % 60)).padStart(2,'0')}</div><div className="flex items-center gap-1 text-blue-400">{[1,2,3].map(star=><Star key={star} className={`w-4 h-4 ${star <= earnedStars && isFinished ? 'fill-current' : ''}`} />)}</div><div className="text-xs font-bold tabular-nums">{score} pts</div></div>
      </header>

      <div className="px-4 sm:px-8 py-2.5 flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#202124] shrink-0">
          <div className="min-w-0 flex items-center gap-2"><MicToggleButton variant="pill" showLabel />{micError && <div role="status" className="text-[10px] text-amber-300 truncate max-w-[240px] flex items-center gap-1" title={micError}><AlertCircle className="w-3.5 h-3.5 shrink-0"/>{micError}</div>}{isSynthOn&&isMicActive&&<span className="hidden md:inline text-[10px] text-amber-200">Headphones recommended with synth playback</span>}</div>
        <div className="flex items-center gap-1 rounded-xl p-1 bg-black/20"><button onClick={()=>{setGuided(true); if (!isWaiting) setFeedback({kind:'close',text:'Guided · wait for each note'});}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${guided?'bg-white/15 text-white':'text-gray-400 hover:text-white'}`}>Guided</button><button onClick={()=>{setGuided(false); if(isWaiting) skipNote(); setFeedback({kind:'close',text:'Play along · misses are tracked'});}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${!guided?'bg-white/15 text-white':'text-gray-400 hover:text-white'}`}>Play along</button></div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-3 shrink-0">
          <div><div className="text-xs text-gray-400">{lesson.tag} <span className="mx-1">·</span> Standard tuning</div><div className="text-sm font-semibold mt-0.5">{activeNote ? `Target: ${activeNote.noteName}` : detectedPitchLabel}</div></div>
        {activeRound && <div className="max-w-[55%] text-right"><div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Round {activeRound.number}</div><div className="text-xs text-gray-300 truncate" aria-label={activeRound.materials.join(' · ')}>{activeRound.materials.map((material, index) => <React.Fragment key={`${activeRound.number}-${material}`}>{index > 0 && <span className="mx-1 text-gray-500">·</span>}<span className={`transition-colors duration-200 ${activeRoundMaterialIndex === index ? 'font-semibold text-[#35b84b]' : ''}`}>{material}</span></React.Fragment>)}</div></div>}
        <div className={`flex items-center gap-2 text-xs font-medium ${feedback?.kind==='good'?'text-emerald-300':feedback?.kind==='wrong'||feedback?.kind==='miss'?'text-rose-300':feedback?.kind==='close'?'text-amber-200':'text-gray-400'}`} aria-live="polite">{feedback && <><span className="w-2 h-2 rounded-full bg-current"/><span>{feedback.text}</span></>}</div>
      </div>

      {countInBeat !== null && <div className="absolute z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-blue-600 text-white text-5xl font-black flex items-center justify-center shadow-2xl">{countInBeat}</div>}

      <main className="flex-1 min-h-0 flex flex-col justify-center overflow-y-auto px-0 sm:px-5 pb-2">
        <div ref={viewportRef} className="relative w-full shrink-0 overflow-hidden bg-[#1b1c1f] border-y border-white/[0.08] py-5">
          <div className="absolute z-30 top-1 left-[60px] h-10 flex items-end pb-2 text-sm text-gray-400 pointer-events-none"><span className="mr-3">{tempoFeel}</span><Gauge className="w-4 h-4 mr-1"/><strong className="text-gray-200">♩ = {tempo}</strong></div>
          <div aria-hidden="true" className="absolute z-20 pointer-events-none drop-shadow-[0_0_5px_rgba(65,205,82,0.45)]" style={{left:playheadPosition-20,top:48,width:40,height:stringHeight*6+21}}>
            <svg className="w-full h-full overflow-visible" viewBox="0 0 40 200" preserveAspectRatio="none">
              <path d="M20 3 C12 3 9 9 9 18 L9 178 Q9 186 13 192 L20 199 L27 192 Q31 186 31 178 L31 18 C31 9 28 3 20 3 Z" fill="rgba(26, 28, 30, 0.28)" stroke="#35b84b" strokeWidth="3.5" strokeLinejoin="round"/>
              <circle cx="20" cy="16" r="5.5" fill="#35b84b"/>
            </svg>
          </div>
          <div className="absolute z-30 left-0 top-[68px] w-[60px] grid bg-[#1b1c1f]" style={{height:stringHeight*6,gridTemplateRows:`repeat(6, ${stringHeight}px)`}}>{TAB_STRINGS.map((stringIndex)=><div key={stringIndex} className="flex items-center justify-end pr-3 text-sm font-semibold text-gray-300">{ORDERED_GUITAR_STRINGS[stringIndex].name}</div>)}</div>
          <div className="absolute z-30 left-0 w-[60px] flex items-center justify-end pr-3 bg-[#1b1c1f] text-[9px] font-bold tracking-wider text-gray-400" style={{top:76+stringHeight*6,height:38}}>RHYTHM</div>
          <div className="relative transition-transform duration-75 ease-linear" style={{width:tabWidth, transform:`translateX(-${tabTranslate}px)`}}>
            <div className="h-11" />
            <div className="relative" style={{height:stringHeight*6}}>
              {measureLines.map((measure)=>{const left=playheadPosition+measure*measureDuration*NOTE_SPEED;return <React.Fragment key={measure}><div className="absolute top-0 bottom-0 border-l border-white/20" style={{left}}/><span className="absolute -top-6 text-xs text-gray-500" style={{left:left+5}}>{measure+1}</span></React.Fragment>;})}
              {TAB_STRINGS.map((stringIndex,row)=><div key={stringIndex} className="absolute left-0 right-0" style={{top:row*stringHeight,height:stringHeight}}><div className="absolute left-[60px] right-0 top-1/2 border-t border-white/45"/>{visibleNotes.map(({note,index})=>!note.isRest&&note.stringIndex===stringIndex?<div key={index} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{left:playheadPosition+note.time*NOTE_SPEED}}><span className={`min-w-6 h-6 px-1 flex items-center justify-center bg-[#1b1c1f] text-white text-lg font-medium leading-none ${activeIndex===index?'text-[#73d17b] scale-125':''} ${results[index]==='hit'?'text-emerald-400':results[index]==='miss'?'text-rose-400':''}`}>{note.fret}</span></div>:null)}</div>)}
              {isNoteBallOn&&isPlaying&&fromBall&&<div className="absolute z-30 w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-white shadow-[0_0_14px_rgba(110,231,183,.95)] pointer-events-none" style={{left:ballX,top:ballY,transform:'translate(-50%,-50%)'}}/>}
            </div>
            <div aria-label="Rhythmic notation synchronized to the tab" className="relative mt-3 h-[38px] border-y border-white/10 bg-black/[0.12]">
              <div className="absolute left-[60px] right-0 top-0 bottom-0 pointer-events-none">
                {measureLines.map((measure)=>{const left=playheadPosition+measure*measureDuration*NOTE_SPEED-60;return <div key={measure} className="absolute top-0 bottom-0 border-l border-white/15" style={{left}}/>;})}
                {rhythmNotes.filter((note) => !note.tupletGroupId || rhythmNotes.findIndex((candidate) => candidate.tupletGroupId === note.tupletGroupId) === rhythmNotes.indexOf(note)).map((note) => {
                  const group = note.tupletGroupId ? rhythmNotes.filter((candidate) => candidate.tupletGroupId === note.tupletGroupId) : [note];
                  const groupCenter = group.length > 1 ? (group[0].left + group[group.length - 1].left) / 2 : note.left;
                  const groupDuration = group.reduce((sum, event) => sum + event.duration, 0);
                  const glyphWidth = Math.min(note.tupletGroupId ? 64 : 28, Math.max(8, groupDuration * NOTE_SPEED * 0.9));
                  return <div key={note.tupletGroupId ?? note.index} className="absolute top-[3px]" style={{left:groupCenter-glyphWidth/2,width:glyphWidth,height:32}}>
                    <RhythmFigureIcon figure={note.figure} isRest={note.isRest} className="w-full h-full" />
                  </div>;
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 px-5 sm:px-8 pt-3 flex items-center justify-between text-xs text-gray-400"><span>{completedNotes} / {scoreableNoteCount} notes checked</span><span className="flex items-center gap-3"><span>♩ {tempo} BPM</span><span>{hitCount} hit <span className="mx-1">·</span>{missCount} missed <span className="mx-1">·</span>{accuracy}% accuracy</span></span></div>
      </main>

      <div className="relative shrink-0 bg-[#242529] border-t border-white/[0.08] px-3 sm:px-8 py-3 sm:py-4">
        <div className="w-full flex flex-wrap justify-center gap-2">
          <button onClick={()=>setIsMetronomeOn(value=>!value)} aria-pressed={isMetronomeOn} title="Toggle metronome" className={`w-[6em] shrink-0 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 ${isMetronomeOn?'bg-blue-600 text-white':'bg-black/25 text-gray-300 hover:bg-black/40'}`}><Metronome className="w-5 h-5"/><span className="text-[9px]">Click</span></button>
          <button onClick={()=>setIsLooping(value=>!value)} aria-pressed={isLooping} title="Loop lesson" className={`w-[6em] shrink-0 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 ${isLooping?'bg-blue-600 text-white':'bg-black/25 text-gray-300 hover:bg-black/40'}`}><Repeat2 className="w-5 h-5"/><span className="text-[9px]">Loop</span></button>
          <div className="w-[6em] shrink-0 h-14 rounded-xl bg-black/25 px-1 flex items-center justify-center gap-1 text-[9px] text-gray-200" title="Playback tempo">
            <button aria-label="Increase tempo" onClick={()=>setTempo(value=>Math.min(160,value+5))} className="w-5 h-8 rounded-lg hover:bg-white/10 font-semibold">+</button>
            <span className="whitespace-nowrap tabular-nums text-[8px]">{tempo} BPM</span>
            <button aria-label="Decrease tempo" onClick={()=>setTempo(value=>Math.max(50,value-5))} className="w-5 h-8 rounded-lg hover:bg-white/10 font-semibold">−</button>
          </div>
          <button onClick={()=>resetPractice(notes)} title="Restart practice" className="w-[6em] shrink-0 h-14 rounded-xl bg-black/25 text-gray-300 hover:bg-black/40 flex flex-col items-center justify-center gap-0.5"><RotateCcw className="w-5 h-5"/><span className="text-[9px]">Restart</span></button>
          <button onClick={togglePlayback} aria-label={isWaiting?'Skip this note':isPlaying?'Pause':'Play'} className="w-[6em] shrink-0 h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-blue-900/30">{isWaiting?<SkipForward className="w-5 h-5"/>:isPlaying?<Pause className="w-5 h-5 fill-current"/>:<Play className="w-5 h-5 fill-current"/>}<span className="text-[9px]">{isPlaying?'Pause':isWaiting?'Skip':'Play'}</span></button>
          <div className="w-[6em] shrink-0 h-14 rounded-xl bg-black/25 p-1 flex flex-col justify-center items-center"><span className="text-[8px] text-gray-400 mb-0.5">AUDIO</span><div className="flex items-center gap-0.5"><span className="px-1.5 py-1 rounded bg-blue-600 text-[9px]">SYNTH</span><button disabled title="No original recording is available for this lesson" className="px-1.5 py-1 rounded text-[9px] text-gray-600 flex items-center gap-0.5 cursor-not-allowed">ORIG <LockKeyhole className="w-2.5 h-2.5"/></button></div></div>
          <button onClick={()=>setIsCountInOn(value=>!value)} aria-pressed={isCountInOn} title="Four-beat count-in" className={`w-[6em] shrink-0 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 ${isCountInOn?'bg-blue-600 text-white':'bg-black/25 text-gray-300'}`}><Clock3 className="w-5 h-5"/><span className="text-[9px]">Count-in</span></button>
          <button onClick={()=>setIsNoteBallOn(value=>!value)} aria-pressed={isNoteBallOn} title="Toggle animated note guide" className={`w-[6em] shrink-0 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 ${isNoteBallOn?'bg-blue-600 text-white':'bg-black/25 text-gray-300'}`}><Activity className="w-5 h-5"/><span className="text-[9px]">Note guide</span></button>
          <button onClick={()=>{setShowHelp(value=>!value);setShowSettings(false);}} aria-expanded={showHelp} title="Tab help" className="w-[6em] shrink-0 h-14 rounded-xl bg-black/25 text-gray-300 hover:bg-black/40 flex flex-col items-center justify-center gap-0.5"><CircleHelp className="w-5 h-5"/><span className="text-[9px]">Help</span></button>
          <button onClick={()=>{setShowSettings(value=>!value);setShowHelp(false);}} aria-expanded={showSettings} title="Playback settings" className="w-[6em] shrink-0 h-14 rounded-xl bg-black/25 text-gray-300 hover:bg-black/40 flex flex-col items-center justify-center gap-0.5"><Settings2 className="w-5 h-5"/><span className="text-[9px]">Settings</span></button>
          <button onClick={skipNote} disabled={!isWaiting} title="Skip current note" className="w-[6em] shrink-0 h-14 rounded-xl bg-black/25 text-gray-300 hover:bg-black/40 disabled:opacity-30 flex flex-col items-center justify-center gap-0.5"><SkipForward className="w-5 h-5"/><span className="text-[9px]">Skip note</span></button>
          <button aria-label={isSynthOn?'Mute synthesized notes':'Enable synthesized notes'} title="Synthesized guitar" onClick={()=>setIsSynthOn(value=>!value)} className={`w-[6em] shrink-0 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 ${isSynthOn?'bg-blue-600 text-white':'bg-black/25 text-gray-300 hover:bg-black/40'}`}>{isSynthOn?<Volume2 className="w-5 h-5"/>:<VolumeX className="w-5 h-5"/>}<span className="text-[9px]">Synth</span></button>
        </div>
        {showHelp&&<div className="absolute bottom-full left-4 right-4 sm:left-auto sm:right-[max(2rem,calc((100vw-64rem)/2))] mb-2 max-w-sm rounded-xl bg-[#303136] border border-white/10 p-4 text-xs text-gray-200 shadow-2xl"><div className="font-bold mb-1">Reading this tab</div><p className="text-gray-400">Strings run high E to low E from top to bottom. Numbers show fret positions. The green playhead marks the note to play. In Guided mode the lesson waits for the correct pitch; Play along mode tracks hits and misses.</p></div>}
        {showSettings&&<div className="absolute bottom-full left-4 right-4 sm:left-auto sm:right-8 mb-2 max-w-sm rounded-xl bg-[#303136] border border-white/10 p-4 text-xs text-gray-200 shadow-2xl"><div className="font-bold mb-1 flex items-center gap-2"><Settings2 className="w-4 h-4"/>Playback settings</div><p className="text-gray-400">Click, Loop, and Count-in are now available directly in the player controls.</p></div>}
      </div>

      {isFinished&&<div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="Practice results" className="w-full max-w-md rounded-3xl bg-[#242529] border border-white/10 p-6 text-center shadow-2xl"><div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 text-blue-300 flex items-center justify-center"><Sparkles className="w-7 h-7"/></div><h2 className="text-2xl font-bold mt-3">Practice complete</h2><p className="text-sm text-gray-400 mt-1">{lesson.title}</p><div className="my-5 flex justify-center gap-2">{[1,2,3].map(star=><Star key={star} className={`w-7 h-7 ${star<=earnedStars?'fill-amber-400 text-amber-400':'text-gray-600'}`}/>)}</div><div className="grid grid-cols-3 gap-2 text-center mb-5"><div className="rounded-xl bg-black/20 p-3"><div className="text-xl font-bold">{accuracy}%</div><div className="text-[10px] text-gray-400">Accuracy</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xl font-bold text-emerald-300">{hitCount}</div><div className="text-[10px] text-gray-400">Hit</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xl font-bold text-rose-300">{missCount}</div><div className="text-[10px] text-gray-400">Missed</div></div></div><div className="flex gap-2"><button onClick={()=>resetPractice(notes)} className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold">Practice again</button><button onClick={()=>resetPractice(notes.filter((note,index)=>!note.isRest&&results[index]==='miss'))} disabled={missCount===0} className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-semibold">Retry missed</button></div><button onClick={closePlayer} className="mt-3 w-full h-10 rounded-xl text-sm text-gray-300 hover:bg-white/5">Done</button></section></div>}
    </div>
  );
};
