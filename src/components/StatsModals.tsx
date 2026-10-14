import React from 'react';
import { X, Award, Flame, Star, Search, Settings } from 'lucide-react';
import { sound } from '../utils/audio';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LevelStatsModal: React.FC<ModalProps & { level: number }> = ({ isOpen, onClose, level }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-xs bg-[#161821] border border-[#2b3042] rounded-3xl p-5 shadow-2xl relative text-center">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <Award className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-black text-white">Guitar Level {level}</h3>
        <p className="text-xs text-gray-400 mt-1">Intermediate Guitarist</p>

        <div className="my-4 p-3 bg-[#1c202b] rounded-2xl border border-white/5 space-y-2 text-left">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total XP:</span>
            <span className="text-white font-bold">4,850 / 6,000 XP</span>
          </div>
          <div className="h-2 w-full bg-[#121419] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full w-[70%]" />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Next: Level 7 Barre Chords</span>
            <span className="text-emerald-400 font-bold">70%</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400"
        >
          Keep Practicing
        </button>
      </div>
    </div>
  );
};

export const StreakModal: React.FC<ModalProps & { streak: number }> = ({ isOpen, onClose, streak }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-xs bg-[#161821] border border-[#2b3042] rounded-3xl p-5 shadow-2xl relative text-center">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-500 mx-auto flex items-center justify-center mb-3">
          <Flame className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-lg font-black text-white">Daily Practice Streak</h3>
        <p className="text-xs text-gray-400 mt-1">
          {streak === 0 ? 'Practice today to kick off your streak!' : `${streak} Day Streak!`}
        </p>

        <div className="grid grid-cols-7 gap-1.5 my-4">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl text-center border ${
                idx === 2 || idx === 3
                  ? 'bg-orange-500 text-black font-black border-orange-400'
                  : 'bg-[#1b1f2b] text-gray-400 border-transparent'
              }`}
            >
              <div className="text-[10px] font-bold">{day}</div>
              <div className="text-xs mt-0.5">🔥</div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-orange-500 text-black font-extrabold text-xs hover:bg-orange-400"
        >
          Practice Now
        </button>
      </div>
    </div>
  );
};
