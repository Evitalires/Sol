import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { MicToggleButton } from './MicToggleButton';
import { sound } from '../utils/audio';
import { useMic } from '../context/MicContext';
import {
  STRING_COLORS,
  ORDERED_GUITAR_STRINGS,
  StringColorDefinition,
} from '../constants/theme';
import { PitchDetector } from '../utils/pitchDetector';

export const TunerTab: React.FC = () => {
  // Global Shared Microphone State
  const { isMicActive, toggleMic, livePitch, micError } = useMic();

  // Active targeted guitar string (Default: G string, exactly matching the screenshot)
  const [selectedString, setSelectedString] = useState<StringColorDefinition>(STRING_COLORS.G);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true); // Auto switch toggle

  // Real-time pitch smoothing states
  const [targetCents, setTargetCents] = useState<number>(0);
  const [displayedCents, setDisplayedCents] = useState<number>(0);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);

  // Waveform canvas ref for the animated green trace line
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchHistoryRef = useRef<number[]>(new Array(60).fill(0));
  const hasChimedInTuneRef = useRef<boolean>(false);
  const inTuneFramesRef = useRef<number>(0);
  const stringCandidateRef = useRef<{ string: StringColorDefinition; count: number }>({
    string: STRING_COLORS.G,
    count: 0,
  });

  // Process live pitch updates from global microphone
  useEffect(() => {
    if (livePitch.frequency && livePitch.isStable) {
      const freq = livePitch.frequency;
      setDetectedPitch(Math.round(freq * 10) / 10);

      // Match string using logarithmic musical interval and harmonic resolution
      const match = PitchDetector.identifyGuitarString(freq);
      const matchedColorDef = STRING_COLORS[match.string.name] || STRING_COLORS.E;

      if (isAutoMode) {
        if (matchedColorDef.name !== stringCandidateRef.current.string.name) {
          stringCandidateRef.current = { string: matchedColorDef, count: 1 };
        } else {
          stringCandidateRef.current.count++;
          if (stringCandidateRef.current.count >= 4 && selectedString.name !== matchedColorDef.name) {
            setSelectedString(matchedColorDef);
          }
        }
      }

      // Cents deviation against current active string
      const cents = match.string.name === selectedString.name
        ? match.cents
        : PitchDetector.getCentsDiff(freq, selectedString.freq);

      const clampedCents = Math.max(-50, Math.min(50, cents));
      setTargetCents(clampedCents);

      // Update green trace waveform
      pitchHistoryRef.current.shift();
      pitchHistoryRef.current.push(clampedCents);

      // Debounced in-tune chime
      if (Math.abs(clampedCents) <= 3.5) {
        inTuneFramesRef.current++;
        if (inTuneFramesRef.current >= 5 && !hasChimedInTuneRef.current) {
          hasChimedInTuneRef.current = true;
          sound.playSuccessSound();
        }
      } else {
        inTuneFramesRef.current = 0;
        if (Math.abs(clampedCents) > 8) {
          hasChimedInTuneRef.current = false;
        }
      }
    } else if (!livePitch.frequency) {
      // Natural decay when string decays
      pitchHistoryRef.current.shift();
      pitchHistoryRef.current.push(pitchHistoryRef.current[pitchHistoryRef.current.length - 1] * 0.9);
      inTuneFramesRef.current = 0;
      hasChimedInTuneRef.current = false;
    }
  }, [livePitch, isAutoMode, selectedString]);

  // Smooth needle inertia loop
  useEffect(() => {
    let animId: number;
    const smoothLoop = () => {
      setDisplayedCents((prev) => {
        const delta = targetCents - prev;
        if (Math.abs(delta) < 0.15) return targetCents;
        return prev + delta * 0.22;
      });
      animId = requestAnimationFrame(smoothLoop);
    };
    animId = requestAnimationFrame(smoothLoop);
    return () => cancelAnimationFrame(animId);
  }, [targetCents]);

  // Draw real-time green trace on the oscilloscope canvas (Faithful to Screenshot)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWave = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw center reference horizontal line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Draw Neon Green Pitch Trace Line
      const history = pitchHistoryRef.current;
      ctx.beginPath();
      ctx.strokeStyle = '#22c55e'; // Green
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const step = (width - 35) / (history.length - 1);
      for (let i = 0; i < history.length; i++) {
        const x = i * step;
        // Invert cents: sharp goes UP toward '#', flat goes DOWN toward 'b'
        const y = centerY - (history[i] / 50) * (centerY - 8);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePegClick = (str: StringColorDefinition) => {
    setSelectedString(str);
    setTargetCents(0);
    hasChimedInTuneRef.current = false;
    sound.playPluck(str.stringIndex, 0, 2.5);
  };

  const simulateStrum = (offsetCents: number) => {
    setTargetCents(offsetCents);
    const simulatedFreq = selectedString.freq * Math.pow(2, offsetCents / 1200);
    setDetectedPitch(Math.round(simulatedFreq * 10) / 10);
    sound.playTunerReference(simulatedFreq, 2.0);

    pitchHistoryRef.current.shift();
    pitchHistoryRef.current.push(offsetCents);

    if (Math.abs(offsetCents) <= 3.5) {
      sound.playSuccessSound();
    } else {
      sound.playClick();
    }
  };

  const roundedCents = Math.round(displayedCents);
  const isInTune = Math.abs(roundedCents) <= 3.5;

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#0e0f12] select-none text-white overflow-hidden relative font-sans">
      {/* 1. TOP HEADER: "Guitarra (3x3)" & Settings */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between shrink-0 z-20">
        <button
          onClick={() => sound.playClick()}
          className="px-3 py-1.5 rounded-lg bg-[#22252c] border border-white/5 text-gray-200 text-xs font-bold flex items-center gap-2 hover:bg-[#2c303a] active:scale-95 transition-all shadow-sm"
        >
          <span>Guitarra (3x3)</span>
          <span className="text-[10px] text-gray-400">▼</span>
        </button>

        <MicToggleButton variant="circle" />
      </div>

      {/* Mic Notice if blocked */}
      {micError && (
        <div className="mx-4 my-1 p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Microphone access needed for live guitar tuning. Tap pegs to tune by ear!</span>
        </div>
      )}

      {/* 2. OSCILLOSCOPE & PITCH DISPLAY (Screenshot Accurate) */}
      <div className="mx-3.5 my-1 h-28 bg-[#17191e] border border-[#262832] rounded-2xl overflow-hidden shadow-2xl relative flex shrink-0">
        {/* Geometric low-poly triangular background pattern */}
        <div className="absolute inset-0 opacity-12 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 120 100">
            <polygon points="0,0 30,50 0,100" fill="#ffffff" />
            <polygon points="30,50 60,0 90,50" fill="#ffffff" />
            <polygon points="60,0 120,0 90,50" fill="#ffffff" />
            <polygon points="30,50 90,50 60,100" fill="#ffffff" />
            <polygon points="90,50 120,0 120,100" fill="#ffffff" />
            <polygon points="0,100 60,100 30,50" fill="#ffffff" />
            <polygon points="60,100 120,100 90,50" fill="#ffffff" />
          </svg>
        </div>

        {/* Sharp '#' indicator on top-left */}
        <div className="absolute top-1.5 left-2.5 text-xs font-mono font-bold text-gray-500 pointer-events-none">
          #
        </div>

        {/* Flat 'b' indicator on bottom-left */}
        <div className="absolute bottom-1.5 left-2.5 text-xs font-mono font-bold text-gray-500 pointer-events-none">
          b
        </div>

        {/* Real-time Waveform Canvas */}
        <div className="flex-1 relative h-full">
          <canvas
            ref={canvasRef}
            width={230}
            height={112}
            className="w-full h-full"
          />

          {/* Dotted Vertical Target Line (Gradient dots from red/orange to green) */}
          <div className="absolute top-2 bottom-2 right-4 w-1 flex flex-col justify-between items-center pointer-events-none">
            {[
              '#ef4444', '#f97316', '#facc15', '#84cc16',
              '#22c55e', '#22c55e',
              '#84cc16', '#facc15', '#f97316', '#ef4444'
            ].map((dotColor, dIdx) => (
              <span
                key={dIdx}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
            ))}
          </div>
        </div>

        {/* Right Side Bold Note Block (Uses Global String Color or Green when in-tune) */}
        <div
          className="w-28 h-full flex flex-col items-center justify-center transition-colors duration-200 shrink-0 text-black shadow-lg"
          style={{
            backgroundColor: isInTune ? '#10b981' : selectedString.color,
          }}
        >
          <span className="text-4xl font-black tracking-tight leading-none drop-shadow-sm">
            {selectedString.name}
          </span>
          <span className="text-xs font-black mt-1 uppercase tracking-wider">
            {isInTune ? 'IN TUNE' : roundedCents !== 0 ? (roundedCents > 0 ? `+${roundedCents}` : `${roundedCents}`) : '--'}
          </span>
        </div>
      </div>

      {/* 3. CENTER HEADSTOCK: REPRODUCED WITH FULL FIDELITY TO SCREENSHOT */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden my-auto py-1">
        <div className="relative w-[320px] h-[360px] flex items-center justify-center">
          {/* SVG Headstock matching user's image */}
          <svg
            className="w-full h-full drop-shadow-2xl"
            viewBox="0 0 320 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Walnut Wood Headstock Gradient matching screenshot */}
              <linearGradient id="headstockWoodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#443224" />
                <stop offset="35%" stopColor="#38271a" />
                <stop offset="70%" stopColor="#2c1d12" />
                <stop offset="100%" stopColor="#1f140c" />
              </linearGradient>

              {/* Fretboard Dark Rosewood Gradient */}
              <linearGradient id="fretboardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#23170e" />
                <stop offset="100%" stopColor="#150e08" />
              </linearGradient>

              {/* Dark Teardrop Truss Rod Recess Gradient */}
              <linearGradient id="trussRecessGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#120c07" />
                <stop offset="60%" stopColor="#1e140d" />
                <stop offset="100%" stopColor="#2c1d12" />
              </linearGradient>

              {/* Washer Metal Radial */}
              <radialGradient id="washerMetal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </radialGradient>
            </defs>

            {/* Fretboard (Going Down to Bottom) */}
            <rect x="124" y="248" width="72" height="112" fill="url(#fretboardGradient)" />
            {/* Nickel Frets */}
            <line x1="124" y1="275" x2="196" y2="275" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="124" y1="310" x2="196" y2="310" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="124" y1="345" x2="196" y2="345" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Bone Nut */}
            <rect x="120" y="242" width="80" height="7.5" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />

            {/* Authentic Headstock Body with Crown V-Notch (Matches Screenshot) */}
            <path
              d="M124 242 
                 L102 180 
                 C98 140, 106 100, 96 68 
                 C118 64, 142 66, 160 76 
                 C178 66, 202 64, 224 68 
                 C214 100, 222 140, 218 180 
                 L196 242 Z"
              fill="url(#headstockWoodGradient)"
              stroke="#543d2c"
              strokeWidth="2.5"
            />

            {/* Dark Teardrop / Oval Truss Rod Cavity Recess (Prominent in Screenshot) */}
            <path
              d="M148 242 C146 200, 146 175, 160 175 C174 175, 174 200, 172 242 Z"
              fill="url(#trussRecessGradient)"
              stroke="#0f0a06"
              strokeWidth="1.5"
            />

            {/* --- 6 STRINGS ROUTING FROM POSTS INTO NUT AND DOWN FRETBOARD --- */}

            {/* 1. Low E (Post at x=122, y=200 -> nut x=131) */}
            <line
              x1="122" y1="200" x2="131" y2="242"
              stroke={selectedString.name === 'E' ? STRING_COLORS.E.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'E' ? 3.2 : 2.2}
            />
            <line
              x1="131" y1="242" x2="131" y2="360"
              stroke={selectedString.name === 'E' ? STRING_COLORS.E.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'E' ? 3.2 : 2.2}
            />

            {/* 2. A String (Post at x=122, y=150 -> nut x=143) */}
            <line
              x1="122" y1="150" x2="143" y2="242"
              stroke={selectedString.name === 'A' ? STRING_COLORS.A.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'A' ? 2.8 : 1.8}
            />
            <line
              x1="143" y1="242" x2="143" y2="360"
              stroke={selectedString.name === 'A' ? STRING_COLORS.A.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'A' ? 2.8 : 1.8}
            />

            {/* 3. D String (Post at x=122, y=100 -> nut x=154) */}
            <line
              x1="122" y1="100" x2="154" y2="242"
              stroke={selectedString.name === 'D' ? STRING_COLORS.D.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'D' ? 2.6 : 1.6}
            />
            <line
              x1="154" y1="242" x2="154" y2="360"
              stroke={selectedString.name === 'D' ? STRING_COLORS.D.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'D' ? 2.6 : 1.6}
            />

            {/* 4. G String (Post at x=198, y=100 -> nut x=166) */}
            <line
              x1="198" y1="100" x2="166" y2="242"
              stroke={selectedString.name === 'G' ? STRING_COLORS.G.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'G' ? 2.8 : 1.4}
            />
            <line
              x1="166" y1="242" x2="166" y2="360"
              stroke={selectedString.name === 'G' ? STRING_COLORS.G.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'G' ? 2.8 : 1.4}
            />

            {/* 5. B String (Post at x=198, y=150 -> nut x=177) */}
            <line
              x1="198" y1="150" x2="177" y2="242"
              stroke={selectedString.name === 'B' ? STRING_COLORS.B.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'B' ? 2.5 : 1.2}
            />
            <line
              x1="177" y1="242" x2="177" y2="360"
              stroke={selectedString.name === 'B' ? STRING_COLORS.B.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'B' ? 2.5 : 1.2}
            />

            {/* 6. High e String (Post at x=198, y=200 -> nut x=189) */}
            <line
              x1="198" y1="200" x2="189" y2="242"
              stroke={selectedString.name === 'e' ? STRING_COLORS.e.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'e' ? 2.5 : 1.0}
            />
            <line
              x1="189" y1="242" x2="189" y2="360"
              stroke={selectedString.name === 'e' ? STRING_COLORS.e.color : '#cbd5e1'}
              strokeWidth={selectedString.name === 'e' ? 2.5 : 1.0}
            />

            {/* --- TUNING POSTS WITH HEX NUTS & WASHERS (Matching Screenshot) --- */}
            {/* Left Posts */}
            <g transform="translate(122, 100)">
              <circle r="9" fill="url(#washerMetal)" stroke={selectedString.name === 'D' ? STRING_COLORS.D.color : '#475569'} strokeWidth="1.5" />
              <polygon points="0,-6 5,-3 5,3 0,6 -5,3 -5,-3" fill="#1e293b" />
              <circle r="4" fill="#0f172a" />
            </g>
            <g transform="translate(122, 150)">
              <circle r="9" fill="url(#washerMetal)" stroke={selectedString.name === 'A' ? STRING_COLORS.A.color : '#475569'} strokeWidth="1.5" />
              <polygon points="0,-6 5,-3 5,3 0,6 -5,3 -5,-3" fill="#1e293b" />
              <circle r="4" fill="#0f172a" />
            </g>
            <g transform="translate(122, 200)">
              <circle r="9" fill="url(#washerMetal)" stroke={selectedString.name === 'E' ? STRING_COLORS.E.color : '#475569'} strokeWidth="1.5" />
              <polygon points="0,-6 5,-3 5,3 0,6 -5,3 -5,-3" fill="#1e293b" />
              <circle r="4" fill="#0f172a" />
            </g>

            {/* Right Posts */}
            <g transform="translate(198, 100)">
              <circle r="9" fill="url(#washerMetal)" stroke={selectedString.name === 'G' ? STRING_COLORS.G.color : '#475569'} strokeWidth="1.5" />
              <polygon points="0,-6 5,-3 5,3 0,6 -5,3 -5,-3" fill="#1e293b" />
              <circle r="4" fill="#0f172a" />
            </g>
            <g transform="translate(198, 150)">
              <circle r="9" fill="url(#washerMetal)" stroke={selectedString.name === 'B' ? STRING_COLORS.B.color : '#475569'} strokeWidth="1.5" />
              <polygon points="0,-6 5,-3 5,3 0,6 -5,3 -5,-3" fill="#1e293b" />
              <circle r="4" fill="#0f172a" />
            </g>
            <g transform="translate(198, 200)">
              <circle r="9" fill="url(#washerMetal)" stroke={selectedString.name === 'e' ? STRING_COLORS.e.color : '#475569'} strokeWidth="1.5" />
              <polygon points="0,-6 5,-3 5,3 0,6 -5,3 -5,-3" fill="#1e293b" />
              <circle r="4" fill="#0f172a" />
            </g>
          </svg>

          {/* --- INTERACTIVE 6 PEGS & BADGES (Exact layout as screenshot) --- */}

          {/* LEFT 1: D (Top Left) */}
          <div className="absolute top-[82px] left-[15px] flex items-center gap-2">
            <button
              onClick={() => handlePegClick(STRING_COLORS.D)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                selectedString.name === 'D'
                  ? 'bg-[#e2e8f0] text-black ring-2 ring-white shadow-lg scale-105'
                  : 'bg-[#181a20] text-white border border-white/20 hover:border-white'
              }`}
            >
              D
            </button>
            {/* Keystone Knob */}
            <button
              onClick={() => handlePegClick(STRING_COLORS.D)}
              className={`w-5 h-8 rounded-lg transition-all border-2 ${
                selectedString.name === 'D'
                  ? 'bg-white border-white shadow-lg'
                  : 'bg-[#121316] border-white/80 hover:bg-white/20'
              }`}
            />
          </div>

          {/* LEFT 2: A (Middle Left - Yellow in Screenshot) */}
          <div className="absolute top-[134px] left-[15px] flex items-center gap-2">
            <button
              onClick={() => handlePegClick(STRING_COLORS.A)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                selectedString.name === 'A'
                  ? 'bg-[#facc15] text-black ring-2 ring-[#facc15] shadow-lg shadow-yellow-500/40 scale-105'
                  : 'bg-[#181a20] text-white border border-[#facc15]/40 hover:border-[#facc15]'
              }`}
            >
              A
            </button>
            {/* Keystone Knob */}
            <button
              onClick={() => handlePegClick(STRING_COLORS.A)}
              className={`w-5 h-8 rounded-lg transition-all border-2 ${
                selectedString.name === 'A'
                  ? 'bg-[#facc15] border-[#facc15] shadow-lg shadow-yellow-500/40'
                  : 'bg-[#121316] border-[#facc15] hover:bg-[#facc15]/20'
              }`}
            />
          </div>

          {/* LEFT 3: Low E (Bottom Left - Red in Screenshot) */}
          <div className="absolute top-[184px] left-[15px] flex items-center gap-2">
            <button
              onClick={() => handlePegClick(STRING_COLORS.E)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                selectedString.name === 'E'
                  ? 'bg-[#ef4444] text-white ring-2 ring-[#ef4444] shadow-lg shadow-red-500/40 scale-105'
                  : 'bg-[#181a20] text-white border border-[#ef4444]/40 hover:border-[#ef4444]'
              }`}
            >
              E
            </button>
            {/* Keystone Knob */}
            <button
              onClick={() => handlePegClick(STRING_COLORS.E)}
              className={`w-5 h-8 rounded-lg transition-all border-2 ${
                selectedString.name === 'E'
                  ? 'bg-[#ef4444] border-[#ef4444] shadow-lg shadow-red-500/40'
                  : 'bg-[#121316] border-[#ef4444] hover:bg-[#ef4444]/20'
              }`}
            />
          </div>

          {/* RIGHT 1: G (Top Right - Solid Orange in Screenshot) */}
          <div className="absolute top-[82px] right-[15px] flex items-center gap-2">
            {/* Keystone Knob */}
            <button
              onClick={() => handlePegClick(STRING_COLORS.G)}
              className={`w-5 h-8 rounded-lg transition-all border-2 ${
                selectedString.name === 'G'
                  ? 'bg-[#f97316] border-[#f97316] shadow-lg shadow-orange-500/50'
                  : 'bg-[#121316] border-[#f97316] hover:bg-[#f97316]/20'
              }`}
            />
            <button
              onClick={() => handlePegClick(STRING_COLORS.G)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                selectedString.name === 'G'
                  ? 'bg-[#181a20] text-white ring-2 ring-[#f97316] border-2 border-[#f97316] shadow-lg shadow-orange-500/40 scale-105'
                  : 'bg-[#181a20] text-white border border-[#f97316]/40 hover:border-[#f97316]'
              }`}
            >
              G
            </button>
          </div>

          {/* RIGHT 2: B (Middle Right) */}
          <div className="absolute top-[134px] right-[15px] flex items-center gap-2">
            {/* Keystone Knob */}
            <button
              onClick={() => handlePegClick(STRING_COLORS.B)}
              className={`w-5 h-8 rounded-lg transition-all border-2 ${
                selectedString.name === 'B'
                  ? 'bg-[#38bdf8] border-[#38bdf8] shadow-lg shadow-cyan-500/50'
                  : 'bg-[#121316] border-white/80 hover:bg-white/20'
              }`}
            />
            <button
              onClick={() => handlePegClick(STRING_COLORS.B)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                selectedString.name === 'B'
                  ? 'bg-[#38bdf8] text-black ring-2 ring-[#38bdf8] shadow-lg shadow-cyan-500/40 scale-105'
                  : 'bg-[#181a20] text-white border border-white/20 hover:border-white'
              }`}
            >
              B
            </button>
          </div>

          {/* RIGHT 3: High e (Bottom Right - Purple in Screenshot) */}
          <div className="absolute top-[184px] right-[15px] flex items-center gap-2">
            {/* Keystone Knob */}
            <button
              onClick={() => handlePegClick(STRING_COLORS.e)}
              className={`w-5 h-8 rounded-lg transition-all border-2 ${
                selectedString.name === 'e'
                  ? 'bg-[#a855f7] border-[#a855f7] shadow-lg shadow-purple-500/50'
                  : 'bg-[#121316] border-[#a855f7] hover:bg-[#a855f7]/20'
              }`}
            />
            <button
              onClick={() => handlePegClick(STRING_COLORS.e)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                selectedString.name === 'e'
                  ? 'bg-[#a855f7] text-white ring-2 ring-[#a855f7] shadow-lg shadow-purple-500/40 scale-105'
                  : 'bg-[#181a20] text-white border border-[#a855f7]/40 hover:border-[#a855f7]'
              }`}
            >
              e
            </button>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM CONTROLS: "Auto" Switch & "E estándar" Button */}
      <div className="px-4 py-3 bg-[#0c0d10] border-t border-white/5 flex items-center justify-between shrink-0 z-20">
        {/* "Auto" Switch */}
        <div className="flex flex-col items-start">
          <span className="text-[11px] font-bold text-gray-300 mb-0.5">Auto</span>
          <button
            onClick={() => {
              sound.playClick();
              setIsAutoMode(!isAutoMode);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              isAutoMode ? 'bg-[#facc15]' : 'bg-[#2a2e38]'
            }`}
            title="Toggle Automatic String Detection"
          >
            <div
              className={`w-5 h-5 rounded-full bg-[#181a20] transition-transform duration-200 shadow-md ${
                isAutoMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* "E estándar" Preset Button */}
        <button
          onClick={() => {
            sound.playTunerReference(selectedString.freq, 2.0);
          }}
          className="px-6 py-2 rounded-xl bg-[#22252c] hover:bg-[#2c303a] border border-white/5 text-gray-200 text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-2"
        >
          <span>E estándar</span>
        </button>

        {/* Browser Quick Test Strum Simulator */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => simulateStrum(-15)}
            className="px-2 py-1 rounded-lg bg-[#1a1d24] text-[10px] font-bold text-amber-400 border border-amber-500/20 active:scale-90"
            title="Test Flat -15¢"
          >
            -15¢
          </button>
          <button
            onClick={() => simulateStrum(0)}
            className="px-2 py-1 rounded-lg bg-[#1a1d24] text-[10px] font-black text-emerald-400 border border-emerald-500/20 active:scale-90"
            title="Test In-Tune 0¢"
          >
            0¢
          </button>
          <button
            onClick={() => simulateStrum(15)}
            className="px-2 py-1 rounded-lg bg-[#1a1d24] text-[10px] font-bold text-rose-400 border border-rose-500/20 active:scale-90"
            title="Test Sharp +15¢"
          >
            +15¢
          </button>
        </div>
      </div>
    </div>
  );
};
