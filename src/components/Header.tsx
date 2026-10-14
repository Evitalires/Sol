import React from 'react';
import { Guitar, Settings, Search, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentLevel: number;
  starsCount: number;
  streakCount: number;
  onOpenLevelStats?: () => void;
  onOpenStarsModal?: () => void;
  onOpenStreakModal?: () => void;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  isMicActive: boolean;
  toggleMic: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  currentLevel,
  starsCount,
  streakCount,
  onOpenLevelStats,
  onOpenStarsModal,
  onOpenStreakModal,
  onOpenSettings,
  onOpenSearch,
  isMuted,
  toggleMute,
  isMicActive,
  toggleMic,
}) => {
  return (
    <header className="h-[58px] sm:h-[64px] px-2 sm:px-5 flex items-center gap-1 sm:gap-4 bg-[#121418] border-b border-white/5 select-none shrink-0 z-20">
      <div className="flex items-center gap-2 shrink-0"><div className="w-8 h-8 rounded-lg bg-emerald-400 text-[#0b1712] flex items-center justify-center"><Guitar className="w-4 h-4"/></div><span className="hidden sm:inline text-sm font-extrabold tracking-tight">Sol</span></div>
      {/* Left: User Stats (Level ring, Stars, Streak) */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
        {/* Level Ring Badge */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenLevelStats?.();
          }}
        className="relative group flex items-center justify-center w-8 h-8 rounded-full bg-[#1c1f26] border border-[#2a2f3a] active:scale-95 transition-transform"
          title={`Level ${currentLevel} - Tap for XP details`}
        >
          {/* Circular SVG Progress Ring */}
          <svg className="w-8 h-8 -rotate-90 absolute inset-0">
            <circle
              cx="16"
              cy="16"
              r="13"
              className="stroke-[#2a2f3a]"
              strokeWidth="2.5"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              className="stroke-emerald-400"
              strokeWidth="2.5"
              strokeDasharray="81.68"
              strokeDashoffset="24.5" // ~70% progress toward next level
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="text-[13px] font-black text-white relative z-10">{currentLevel}</span>
        </button>

        {/* Stars Pill */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenStarsModal?.();
          }}
          className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-full bg-[#1d2028] border border-[#2c3140] hover:border-amber-500/50 active:scale-95 transition-all text-xs font-bold text-white shadow-sm"
          title={`${starsCount} Stars collected`}
        >
          <span className="text-amber-400 text-sm leading-none drop-shadow">★</span>
          <span className="text-gray-100">{starsCount}</span>
        </button>

        {/* Streak Pill */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenStreakModal?.();
          }}
          className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-full bg-[#1d2028] border border-[#2c3140] hover:border-orange-500/50 active:scale-95 transition-all text-xs font-bold text-white shadow-sm"
          title={`${streakCount} Days Streak`}
        >
          <span className="text-orange-500 text-sm leading-none animate-pulse">🔥</span>
          <span className="text-gray-100">{streakCount}</span>
        </button>
      </div>

      {/* Settings, search, and app-wide sound controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            onOpenSettings?.();
          }}
          className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenSearch?.();
          }}
          className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-colors relative"
          title="Search Songs & Lessons"
        >
          <Search className="w-4 h-4" />
          {/* Green Activity Indicator Dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#121418] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </button>
        <button onClick={() => void toggleMic()} aria-label={isMicActive ? 'Turn microphone off' : 'Turn microphone on'} title={isMicActive ? 'Microphone on' : 'Microphone off'} className={`p-1.5 sm:p-2 rounded-full transition-colors ${isMicActive ? 'text-emerald-300 bg-emerald-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{isMicActive ? <Mic className="w-4 h-4"/> : <MicOff className="w-4 h-4"/>}</button>
        <button onClick={toggleMute} aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'} title={isMuted ? 'Turn sound on' : 'Turn sound off'} className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5">{isMuted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}</button>
      </div>
    </header>
  );
};
