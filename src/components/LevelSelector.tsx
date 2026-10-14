import React from 'react';
import { LevelInfo } from '../types';
import { sound } from '../utils/audio';

interface LevelSelectorProps {
  levels: LevelInfo[];
  selectedLevel: number;
  onSelectLevel: (levelNum: number) => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  levels,
  selectedLevel,
  onSelectLevel,
}) => {
  return (
    <div className="px-3.5 py-2.5 bg-[#121418] border-b border-white/5 select-none shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar">
      <span className="text-xs font-extrabold text-white tracking-wide shrink-0 ml-1">Level</span>
      <div className="flex items-center gap-2 shrink-0">
        {levels.map((lvl) => {
          const isSelected = selectedLevel === lvl.levelNumber;

          return (
            <button
              key={lvl.levelNumber}
              onClick={() => {
                sound.playClick();
                onSelectLevel(lvl.levelNumber);
              }}
              className={`relative flex items-center justify-center rounded-full transition-all shrink-0 ${
                isSelected
                  ? 'w-7 h-7 bg-[#f59e0b] text-black font-black text-xs ring-2 ring-white ring-offset-2 ring-offset-[#121418] shadow-lg shadow-amber-500/30 scale-105'
                  : 'w-6 h-6 bg-[#2b3038] text-gray-300 font-bold text-xs hover:scale-105 hover:bg-[#414853]'
              }`}
              title={
                `Lesson ${lvl.levelNumber}: ${lvl.name}`
              }
            >
              <span>{lvl.levelNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
