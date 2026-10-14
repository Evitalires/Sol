import React from 'react';
import { Flame, Play, ShieldAlert, Award } from 'lucide-react';
import { sound } from '../utils/audio';

export const MetallicaTab: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-4 bg-[#121418] select-none text-white overflow-y-auto">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-4 border border-[#3b3420] shadow-2xl bg-[#181510]">
        <img
          src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80"
          alt="Metallica course"
          className="w-full h-40 object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121418] via-black/40 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-yellow-500 text-black">
              Official Artist Course
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">
            METALLICA x YOUSICIAN
          </h2>
          <p className="text-xs text-gray-300">
            Learn directly with James Hetfield & Kirk Hammett
          </p>
        </div>
      </div>

      {/* Course Modules */}
      <div className="space-y-3 pb-4">
        {[
          {
            title: 'Downpicking Mastery with James',
            desc: 'The iconic Hetfield rhythm engine: high-speed relentless eighth notes.',
            level: 'Level 6 - 8',
            riff: 'Enter Sandman Main Riff',
          },
          {
            title: 'Wah & Solo Phrasing with Kirk',
            desc: 'Pentatonic runs, whammy control, and melodic metal phrasing.',
            level: 'Level 7 - 9',
            riff: 'Nothing Else Matters Solo',
          },
          {
            title: 'Master of Puppets Full Marathon',
            desc: '212 BPM chromatic galloping and time signature transitions.',
            level: 'Level 8 - 10',
            riff: 'Master of Puppets Intro',
          },
        ].map((mod, idx) => (
          <div
            key={idx}
            onClick={() => {
              sound.playChord('E');
            }}
            className="p-3.5 bg-[#1a1c24] border border-[#2c3040] rounded-2xl hover:border-yellow-500/50 hover:bg-[#202330] cursor-pointer transition-all active:scale-98 flex items-center justify-between"
          >
            <div>
              <div className="text-[10px] font-black text-yellow-400 uppercase tracking-wider mb-0.5">
                {mod.level} • {mod.riff}
              </div>
              <h4 className="text-sm font-extrabold text-white">{mod.title}</h4>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{mod.desc}</p>
            </div>

            <button className="w-9 h-9 rounded-xl bg-yellow-500 text-black flex items-center justify-center shrink-0 ml-3 hover:bg-yellow-400 shadow-md shadow-yellow-500/20">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
