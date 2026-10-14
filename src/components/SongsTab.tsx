import React, { useState } from 'react';
import { Search, Play, Star, Clock } from 'lucide-react';
import { MOCK_SONGS } from '../data/mockData';
import { sound } from '../utils/audio';
import { MusicXmlImportButton } from './MusicXmlImportButton';
import type { Lesson } from '../types';

export const SongsTab: React.FC<{ onImport: (lesson: Lesson) => void }> = ({ onImport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Metal', 'Rock', 'Grunge', 'Britpop'];

  const filteredSongs = MOCK_SONGS.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || song.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col p-4 bg-[#121418] select-none text-white overflow-y-auto">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
        <h2 className="text-xl font-black">Song Library</h2>
        <p className="text-xs text-gray-400">Learn popular songs arranged for your skill level</p>
        </div>
        <MusicXmlImportButton onImport={onImport}/>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by artist or song..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1b1e27] border border-[#2b3142] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-3 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              sound.playClick();
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-white text-black font-black'
                : 'bg-[#1c202a] text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Song List */}
      <div className="flex flex-col gap-2.5 pb-4">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            onClick={() => {
              sound.playChord(song.chords[0] || 'Em');
            }}
            className="group flex items-center justify-between p-2.5 bg-[#1a1d26] border border-[#292e3c] rounded-2xl hover:border-emerald-500/50 hover:bg-[#202430] cursor-pointer transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <img
                src={song.coverImage}
                alt={song.title}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                    {song.title}
                  </h4>
                  {song.isPopular && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Top
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 font-semibold">{song.artist}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-emerald-400 font-bold">
                    Lvl {song.level}
                  </span>
                  <span className="text-[10px] text-gray-500">•</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {song.duration}
                  </span>
                </div>
              </div>
            </div>

            {/* Play Button */}
            <button className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
