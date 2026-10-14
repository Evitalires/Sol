import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { pitchDetector, PitchDetectionResult } from '../utils/pitchDetector';
import { sound } from '../utils/audio';

interface MicContextType {
  isMicActive: boolean;
  micError: string | null;
  livePitch: PitchDetectionResult;
  toggleMic: () => Promise<void>;
  startMic: () => Promise<boolean>;
  stopMic: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const defaultPitchResult: PitchDetectionResult = {
  frequency: null,
  rawFrequency: null,
  noteName: null,
  octave: null,
  cents: null,
  volume: 0,
  clarity: 0,
  isStable: false,
};

const MicContext = createContext<MicContextType | undefined>(undefined);

export const MicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [livePitch, setLivePitch] = useState<PitchDetectionResult>(defaultPitchResult);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const startMic = useCallback(async (): Promise<boolean> => {
    setMicError(null);
    const res = await pitchDetector.start((result: PitchDetectionResult) => {
      setLivePitch(result);
    });

    if (res.success) {
      setIsMicActive(true);
      return true;
    } else {
      setIsMicActive(false);
      setMicError(res.error || 'Microphone access denied or unavailable.');
      return false;
    }
  }, []);

  const stopMic = useCallback(() => {
    pitchDetector.stop();
    setIsMicActive(false);
    setLivePitch(defaultPitchResult);
  }, []);

  const toggleMic = useCallback(async () => {
    sound.playClick();
    if (isMicActive) {
      stopMic();
    } else {
      await startMic();
    }
  }, [isMicActive, startMic, stopMic]);

  const toggleMute = useCallback(() => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sound.setMuted(nextState);
    if (!nextState) {
      sound.playClick();
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      pitchDetector.stop();
    };
  }, []);

  return (
    <MicContext.Provider
      value={{
        isMicActive,
        micError,
        livePitch,
        toggleMic,
        startMic,
        stopMic,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </MicContext.Provider>
  );
};

export const useMic = (): MicContextType => {
  const context = useContext(MicContext);
  if (!context) {
    throw new Error('useMic must be used within a MicProvider');
  }
  return context;
};
