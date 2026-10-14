import React, { useRef, useState } from 'react';
import { AlertCircle, FileMusic, Upload } from 'lucide-react';
import { Lesson } from '../types';
import { parseMusicXmlLesson } from '../utils/musicXml';
import { sound } from '../utils/audio';

export const MusicXmlImportButton: React.FC<{ onImport: (lesson: Lesson) => void }> = ({ onImport }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose a MusicXML file smaller than 5 MB.');
      return;
    }
    setIsLoading(true);
    try {
      const lesson = parseMusicXmlLesson(await file.text(), file.name);
      onImport(lesson);
      sound.playSuccessSound();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read this MusicXML file.');
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return <div className="relative">
    <input ref={inputRef} type="file" accept=".musicxml,.xml,application/vnd.recordare.musicxml+xml,text/xml,application/xml" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />
    <button onClick={() => { sound.playClick(); inputRef.current?.click(); }} disabled={isLoading} className="h-8 px-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/25 text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 whitespace-nowrap" title="Import a MusicXML tab">
      {isLoading ? <FileMusic className="w-3.5 h-3.5 animate-pulse"/> : <Upload className="w-3.5 h-3.5"/>}
      <span>{isLoading ? 'Reading…' : 'Import tab'}</span>
    </button>
    {error && <div role="alert" className="absolute z-40 top-full right-0 mt-2 w-64 rounded-xl border border-rose-400/30 bg-[#21181b] p-3 text-[11px] text-rose-200 shadow-xl flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/><span>{error}</span></div>}
  </div>;
};
