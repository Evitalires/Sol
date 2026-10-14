import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useMic } from '../context/MicContext';

interface MicToggleButtonProps {
  variant?: 'circle' | 'pill' | 'compact';
  className?: string;
  showLabel?: boolean;
}

export const MicToggleButton: React.FC<MicToggleButtonProps> = ({
  variant = 'circle',
  className = '',
  showLabel = false,
}) => {
  const { isMicActive, toggleMic } = useMic();

  if (variant === 'circle') {
    return (
      <button
        onClick={toggleMic}
        className={`relative w-8 h-8 rounded-full border transition-all flex items-center justify-center active:scale-90 ${
          isMicActive
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/30'
            : 'bg-[#22252c] text-gray-400 border-white/5 hover:text-white hover:bg-[#2c303a]'
        } ${className}`}
        title={isMicActive ? 'Microphone Listening (Tap to Mute)' : 'Enable Microphone'}
      >
        {isMicActive ? (
          <>
            <Mic className="w-4 h-4 animate-pulse" />
            {/* Live pulsating green beacon */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#121418]" />
          </>
        ) : (
          <MicOff className="w-4 h-4" />
        )}
      </button>
    );
  }

  // Pill variant with optional text label
  return (
    <button
      onClick={toggleMic}
      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border shadow-sm active:scale-95 ${
        isMicActive
          ? 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/30 font-black'
          : 'bg-[#22252c] text-gray-300 border-white/10 hover:text-white hover:bg-[#2c303a]'
      } ${className}`}
      title={isMicActive ? 'Microphone Active (Tap to Mute)' : 'Enable Microphone'}
    >
      <div className="relative flex items-center justify-center">
        {isMicActive ? (
          <>
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping absolute -top-0.5 -right-0.5" />
          </>
        ) : (
          <MicOff className="w-3.5 h-3.5" />
        )}
      </div>
      {(showLabel || variant === 'pill') && (
        <span>{isMicActive ? 'Mic: Listening' : 'Enable Mic'}</span>
      )}
    </button>
  );
};
