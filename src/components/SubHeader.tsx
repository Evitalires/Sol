import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Lesson, SubTab } from '../types';
import { sound } from '../utils/audio';

interface SubHeaderProps {
  activeSubTab: SubTab;
  onSelectSubTab: (tab: SubTab) => void;
  upNextLesson?: Lesson;
  onContinueLesson?: (lesson: Lesson) => void;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  activeSubTab,
  onSelectSubTab,
  upNextLesson,
  onContinueLesson,
}) => {
  const tabs: { key: SubTab; label: string; badge?: string }[] = [
    { key: 'Path', label: 'Path' },
    { key: 'Workouts', label: 'Workouts' },
    { key: 'Tools', label: 'Tools' },
  ];

  return (
    <div className="px-3.5 py-2.5 flex items-center gap-2.5 bg-[#121418] border-b border-white/5 select-none shrink-0 overflow-x-auto hide-scrollbar">
      {/* Category Navigation Tabs */}
      <nav className="flex items-center gap-1.5 shrink-0">
        {tabs.map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                sound.playClick();
                onSelectSubTab(tab.key);
              }}
              className={`relative px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-blue-600 text-white tracking-wider leading-tight shadow-sm shadow-blue-500/50">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {upNextLesson && onContinueLesson && (
        <>
          <div className="h-8 w-px bg-white/10 shrink-0" aria-hidden="true" />
          <div className="ml-auto flex items-center gap-2.5 min-w-0 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <div className="min-w-0">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Up next · {upNextLesson.tag}</div>
              <div className="max-w-48 truncate text-xs font-bold text-white">{upNextLesson.title}</div>
            </div>
            <button
              onClick={() => {
                sound.playChord('Em');
                onContinueLesson(upNextLesson);
              }}
              className="shrink-0 h-8 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] flex items-center gap-1 transition-colors"
            >
              Continue <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
