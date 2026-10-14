import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, Award, AudioLines, X, Dices } from 'lucide-react';
import type { JamRound, Lesson } from '../types';
import { LessonCard } from './LessonCard';
import { sound } from '../utils/audio';
import { useMic } from '../context/MicContext';
import { MicToggleButton } from './MicToggleButton';
import { composeJamRound, generateJamSequence, JAM_MATERIALS } from '../utils/jamGenerator';
import type { JamMaterial } from '../utils/jamGenerator';
import { RhythmFigureTestSection } from './RhythmFigureTestSection';
import { Fretboard } from './tools/Fretboard';
import { PracticeLab } from './tools/PracticeLab';
import type { FretboardPosition, PracticeLabConfig, PracticeSessionRequest } from './tools/toolContracts';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_COLORS: Record<string, string> = {
  C: '#9ac34a', 'C#': '#7b61a8', D: '#7654a4', 'D#': '#597fc3', E: '#547bc2',
  F: '#e45459', 'F#': '#ea727d', G: '#304b80', 'G#': '#4b6795', A: '#f08b3e',
  'A#': '#f1a15a', B: '#999999',
};
const DEFAULT_TUNING = [
  { id: 'high-e', label: 'e', openMidi: 64 },
  { id: 'b', label: 'B', openMidi: 59 },
  { id: 'g', label: 'G', openMidi: 55 },
  { id: 'd', label: 'D', openMidi: 50 },
  { id: 'a', label: 'A', openMidi: 45 },
  { id: 'low-e', label: 'E', openMidi: 40 },
];
const DEFAULT_LAB_CONFIG: PracticeLabConfig = {
  id: 'guitar-practice',
  title: 'Practice Lab',
  description: 'Practice scales, modes, triads, and chord tones.',
  rootOptions: NOTE_NAMES.map((label, pitchClass) => ({ id: String(pitchClass), label, pitchClass })),
  materialOptions: JAM_MATERIALS.map((label) => ({ id: label, label })),
  tempo: { min: 60, max: 140, step: 5, default: 90 },
  modes: [{ id: 'single', label: 'Set practice', strategy: 'single' }, { id: 'rotation', label: 'Infinite rotation', strategy: 'rotation' }],
  defaultMode: 'single',
  defaultRootId: '0',
  defaultMaterialIds: ['Major scale'],
  sequence: { minItems: 8, maxItems: 64, defaultItems: 24 },
  rotation: { minRounds: 1, maxRounds: 12, initialRounds: 3, roundsPerExpansion: 2 },
};

const FreePlayCard: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [view, setView] = React.useState<'full'|'game'>('full');
  const [difficulty, setDifficulty] = React.useState(12);
  const [targetMidi, setTargetMidi] = React.useState<number | null>(null);
  const [gameScore, setGameScore] = React.useState(0);
  const [gameFeedback, setGameFeedback] = React.useState('');
  const [showCorrect, setShowCorrect] = React.useState(false);
  const { livePitch, isMicActive } = useMic();
  const detectedMidi = livePitch.frequency ? Math.round(69 + 12 * Math.log2(livePitch.frequency / 440)) : null;
  const detectedName = detectedMidi === null ? null : NOTE_NAMES[((detectedMidi % 12) + 12) % 12];
  const nextTarget = (fretRange = difficulty) => {
    const string = DEFAULT_TUNING[Math.floor(Math.random() * DEFAULT_TUNING.length)];
    setTargetMidi(string.openMidi + Math.floor(Math.random() * (fretRange + 1)));
    setShowCorrect(false);
    setGameFeedback('Find that pitch on the fretboard.');
  };
  const onSelectPosition = (position: FretboardPosition) => {
    const string = DEFAULT_TUNING.find((item) => item.id === position.stringId);
    const isCorrect = !!string && string.openMidi + position.fret === targetMidi;
    if (isCorrect) {
      setGameScore((score) => score + 1);
      setShowCorrect(true);
      setGameFeedback('Correct! Nice find.');
      window.setTimeout(() => nextTarget(), 650);
    } else setGameFeedback('Try another string or fret.');
  };
  const maxFret = view === 'game' ? difficulty : 12;
  const detectedPositions: FretboardPosition[] = detectedMidi === null ? [] : DEFAULT_TUNING.flatMap((string) =>
    Array.from({ length: maxFret + 1 }, (_, fret) => ({ stringId: string.id, fret }))
      .filter((position) => string.openMidi + position.fret === detectedMidi));
  const targetPositions = targetMidi === null ? [] : DEFAULT_TUNING.flatMap((string) =>
    string.openMidi <= targetMidi && targetMidi - string.openMidi <= maxFret && (string.openMidi + maxFret >= targetMidi)
      ? (Array.from({ length: maxFret + 1 }, (_, fret) => ({ stringId: string.id, fret })).filter((position) => string.openMidi + position.fret === targetMidi)) : []);

  return <>
    <button onClick={() => { sound.playClick(); setIsOpen(true); }} className="w-[270px] h-[300px] rounded-3xl p-4 text-left bg-gradient-to-br from-[#163a35] to-[#1b2229] border border-emerald-400/30 shadow-xl flex flex-col justify-between hover:border-emerald-300/60 transition-colors">
      <div className="flex items-center justify-between"><span className="px-2 py-1 rounded-full text-[9px] font-black tracking-wider uppercase bg-emerald-400/15 text-emerald-300">Free practice</span><AudioLines className="w-5 h-5 text-emerald-300" /></div>
      <div><div className="text-2xl font-black text-white leading-tight">Fretboard</div><p className="text-xs text-gray-300 mt-2 leading-relaxed">Play any note and see where the app hears it on the fretboard.</p></div>
      <div className="h-[76px] rounded-xl bg-black/20 border border-white/10 p-2 flex flex-col justify-between"><div className="flex justify-between text-[8px] text-gray-400"><span>LIVE NOTE</span><span>OPEN</span></div><div className="flex items-center gap-1.5">{DEFAULT_TUNING.map((string) => <div key={string.id} className="h-1 flex-1 rounded-full" style={{ background: NOTE_COLORS[NOTE_NAMES[string.openMidi % 12]], opacity: .85 }} />)}</div><div className="text-[10px] font-bold text-emerald-200">Tap to open tuner check</div></div>
    </button>
    {isOpen && <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3" onClick={() => setIsOpen(false)}>
      <section role="dialog" aria-modal="true" aria-label="Fretboard" onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#11151a] border border-white/10 text-white p-4 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] uppercase tracking-widest text-emerald-400 font-black">Free mode</span><h2 className="text-xl font-black mt-1">Fretboard</h2><p className="text-xs text-gray-400 mt-1">Check mic detection or practice finding notes by position.</p></div><button aria-label="Close" onClick={() => setIsOpen(false)} className="p-2 rounded-xl bg-white/5"><X className="w-4 h-4" /></button></div>
        <div className="flex items-center gap-2 mt-4"><button onClick={() => setView('full')} className={`h-9 px-3 rounded-xl text-xs font-bold ${view === 'full' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-300'}`}>Fretboard</button><button onClick={() => { setView('game'); if (targetMidi === null) nextTarget(); }} className={`h-9 px-3 rounded-xl text-xs font-bold ${view === 'game' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-300'}`}>Find the note</button>{view === 'game' && <select value={difficulty} onChange={(event) => { const range = Number(event.target.value); setDifficulty(range); nextTarget(range); }} aria-label="Game difficulty" className="ml-auto h-9 rounded-xl bg-[#20252b] px-2 text-xs"><option value={5}>Easy · 5 frets</option><option value={12}>Medium · 12 frets</option><option value={17}>Hard · 17 frets</option></select>}</div>
        {view === 'game' && <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 flex items-center justify-between gap-3"><div><div className="text-[9px] uppercase text-emerald-300 font-bold">Find this note · {gameScore} points</div><div className="text-xl font-black">{targetMidi === null ? '—' : NOTE_NAMES[((targetMidi % 12) + 12) % 12]}</div><div className="text-[10px] text-gray-300">{gameFeedback}</div></div><button onClick={() => nextTarget()} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center" title="New note"><Dices className="w-4 h-4" /></button></div>}
        <div className="mt-4 rounded-2xl bg-[#1a1f25] border border-white/5 p-3 flex items-center justify-between gap-3"><div><div className="text-[9px] uppercase tracking-wider text-gray-400">Detected note</div><div className="text-3xl font-black" style={{ color: detectedName ? NOTE_COLORS[detectedName] : '#fff' }}>{livePitch.frequency && livePitch.noteName ? `${livePitch.noteName}${livePitch.octave ?? ''}` : '—'}</div><div className="text-[10px] text-gray-400">{livePitch.frequency ? `${livePitch.frequency.toFixed(1)} Hz · ${livePitch.cents ?? 0}¢` : isMicActive ? 'Play a note…' : 'Microphone is off'}</div></div><MicToggleButton variant="pill" showLabel /></div>
        <div className="mt-4"><Fretboard tuning={DEFAULT_TUNING} maxFret={maxFret} noteDisplay="all" highlightedPositions={detectedPositions} targetPositions={view === 'game' && showCorrect ? targetPositions : []} interactive={view === 'game'} onSelectPosition={onSelectPosition} /></div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[9px] text-gray-400"><span>Color = note</span><span>White ring = detected or target pitch</span><span>Standard tuning · open to {maxFret}th fret</span></div>
      </section>
    </div>}
  </>;
};

const JammerCard: React.FC<{ onStart: (lesson: Lesson) => void }> = ({ onStart }) => {
  const generate = (request: PracticeSessionRequest) => {
    const root = DEFAULT_LAB_CONFIG.rootOptions.find((option) => option.id === request.rootId)?.pitchClass ?? 0;
    const tempo = request.tempoBpm;
    const selectedMaterials = request.materialIds as JamMaterial[];
    const infinite = request.mode === 'rotation';
    const rounds: JamRound[] = [];
    if (infinite) {
      for (let index = 0; index < request.rounds; index++) {
        const startTime = rounds.at(-1)?.endTime ?? 0;
        rounds.push(composeJamRound(root, selectedMaterials, tempo, index + 1, startTime));
      }
    }
    const sequence = infinite ? rounds.flatMap((round) => round.materials as JamMaterial[]) : selectedMaterials;
    const notes = infinite ? rounds.flatMap((round) => round.notes) : generateJamSequence(root, sequence, tempo, request.itemCount, 0);
    const selectedLabels = selectedMaterials.map((id) => DEFAULT_LAB_CONFIG.materialOptions.find((option) => option.id === id)?.label ?? id);
    const materialLabel = selectedLabels.join(' · ');
    const rootLabel = DEFAULT_LAB_CONFIG.rootOptions.find((option) => option.id === request.rootId)?.label ?? request.rootId;
    const category = /triad|chord/i.test(materialLabel) ? 'Chords' : 'Lead';
    onStart({ id: `jam-${Date.now()}`, tag: infinite ? 'Infinite practice' : 'Practice generator', category, level: 1,
      title: infinite ? `${rootLabel} Infinite Jam` : `${rootLabel} ${materialLabel} Jam`, image: '', stars: 0, maxStars: 3,
      completedExercises: 0, totalExercises: 1, progressPercent: 0,
      description: `${infinite ? `${request.rounds} rotation rounds: ${materialLabel}` : materialLabel} in ${rootLabel} at ${tempo} BPM.`,
      difficulty: 'Intermediate', notes, playbackTempo: tempo,
      jamSettings: { infinite, root, tempo, materials: selectedMaterials, rounds } });
  };
  return <PracticeLab config={DEFAULT_LAB_CONFIG} onGenerate={generate} />;
};

interface PathViewProps {
  lessons: Lesson[];
  currentLevel: number;
  onSelectLesson: (lesson: Lesson) => void;
}

export const ToolsView: React.FC<{ onStartJam: (lesson: Lesson) => void }> = ({ onStartJam }) => (
  <section aria-label="Guitar practice tools" className="flex-1 min-h-0 overflow-y-auto bg-[#121418] p-4 sm:p-6">
    <div className="max-w-5xl mx-auto">
      <div className="mb-5"><div className="text-[10px] uppercase tracking-[.2em] text-emerald-400 font-black">Practice tools</div><h1 className="text-2xl font-black mt-1">Explore and practice</h1><p className="text-sm text-gray-400 mt-1">Check your instrument or generate a focused practice jam.</p></div>
      <div className="flex flex-wrap gap-4"><FreePlayCard/><JammerCard onStart={onStartJam}/></div>
      <RhythmFigureTestSection />
    </div>
  </section>
);

export const PathView: React.FC<PathViewProps> = ({
  lessons,
  currentLevel,
  onSelectLesson,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    sound.playClick();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    sound.playClick();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const currentLesson = lessons.find(l => l.level === currentLevel) ?? lessons[0];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden relative bg-[#121418] select-none">
      {/* Background Graphic: Winding Green Path */}
      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 200 C 150 160, 220 320, 100 480 C 40 560, 250 580, 450 500"
            stroke="#059669"
            strokeWidth="56"
            strokeLinecap="round"
          />
          <path
            d="M-50 200 C 150 160, 220 320, 100 480 C 40 560, 250 580, 450 500"
            stroke="#34d399"
            strokeWidth="6"
            strokeDasharray="14 14"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Top Banner / Level 6 Milestone Header */}
      <div className="px-4 pt-3 pb-1 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Big Golden Music Ribbon Medal Award (Faithful to Screenshot) */}
          <div className="relative group cursor-pointer" onClick={() => sound.playSuccessSound()}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-1 shadow-xl shadow-amber-500/25 flex items-center justify-center transform active:scale-95 transition-transform">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#fef08a] to-[#ca8a04] flex items-center justify-center border-2 border-amber-300">
                {/* Fluted Medallion Note Icon */}
                <svg className="w-8 h-8 text-[#78350f] fill-current drop-shadow-sm" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            </div>
            {/* Medallion Ribbon Tails */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
              <div className="w-3.5 h-4 bg-amber-600 clip-ribbon transform -rotate-12 rounded-b-xs shadow" />
              <div className="w-3.5 h-4 bg-amber-600 clip-ribbon transform rotate-12 rounded-b-xs shadow" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Level {currentLevel} Path
              </span>
              <span className="text-[11px] text-gray-400 font-semibold">32 lessons</span>
            </div>
            <h1 className="text-lg font-black text-white tracking-tight mt-0.5">
              {currentLesson?.title ?? `Lesson ${currentLevel}`}
            </h1>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={scrollLeft}
            className="w-7 h-7 rounded-full bg-[#1e222a] border border-[#2e3341] text-gray-300 hover:text-white flex items-center justify-center active:scale-90 transition-all"
            title="Previous lesson"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            className="w-7 h-7 rounded-full bg-[#1e222a] border border-[#2e3341] text-gray-300 hover:text-white flex items-center justify-center active:scale-90 transition-all"
            title="Next lesson"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Lesson Cards Carousel (Screenshot Faithful Layout) */}
      <div className="relative z-10 py-3 my-auto">
        <div
          ref={scrollContainerRef}
          className="flex gap-3.5 px-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {lessons.map((lesson) => (
            <div key={lesson.id} className="snap-start shrink-0">
              <LessonCard lesson={lesson} onSelectLesson={onSelectLesson} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
