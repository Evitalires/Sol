import React from 'react';
import { Home, GraduationCap, Music, Mic2, User } from 'lucide-react';
import { MainTab } from '../types';
import { sound } from '../utils/audio';

interface BottomNavProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { key: MainTab; label: string; icon: React.ReactNode }[] = [
    { key: 'Home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { key: 'Learn', label: 'Learn', icon: <GraduationCap className="w-5 h-5" /> },
    { key: 'Songs', label: 'Songs', icon: <Music className="w-5 h-5" /> },
    { key: 'Tuner', label: 'Tuner', icon: <Mic2 className="w-5 h-5" /> },
    { key: 'Profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="h-[60px] bg-[#121418] border-t border-white/10 px-2 flex items-center justify-around shrink-0 z-30 select-none">
      {navItems.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              sound.playClick();
              onSelectTab(item.key);
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-emerald-400 font-extrabold scale-105'
                : 'text-gray-400 hover:text-gray-200 active:scale-95'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                isActive ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/20' : ''
              }`}
            >
              {item.icon}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
