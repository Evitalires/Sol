import React from 'react';
import { Music2, Play } from 'lucide-react';
import type { PracticeLabConfig, PracticeSessionRequest } from './toolContracts';

export interface PracticeLabProps {
  config: PracticeLabConfig;
  onGenerate: (request: PracticeSessionRequest) => void;
}

/** Configurable practice-session selector. Generation and persistence are supplied by the host. */
export const PracticeLab: React.FC<PracticeLabProps> = ({ config, onGenerate }) => {
  const [mode, setMode] = React.useState(config.defaultMode);
  const [rootId, setRootId] = React.useState(config.defaultRootId);
  const [materialIds, setMaterialIds] = React.useState(config.defaultMaterialIds);
  const [tempoBpm, setTempoBpm] = React.useState(config.tempo.default);
  const [itemCount, setItemCount] = React.useState(config.sequence?.defaultItems ?? 24);
  const [rounds, setRounds] = React.useState(config.rotation?.initialRounds ?? 1);
  const [rhythmStyleId, setRhythmStyleId] = React.useState(config.rhythm?.defaultStyleId);
  React.useEffect(() => {
    setMode(config.defaultMode);
    setRootId(config.defaultRootId);
    setMaterialIds(config.defaultMaterialIds);
    setTempoBpm(config.tempo.default);
    setItemCount(config.sequence?.defaultItems ?? 24);
    setRounds(config.rotation?.initialRounds ?? 1);
    setRhythmStyleId(config.rhythm?.defaultStyleId);
  }, [config.id, config.defaultMode, config.defaultRootId, config.defaultMaterialIds.join('|'), config.tempo.default, config.sequence?.defaultItems, config.rotation?.initialRounds, config.rhythm?.defaultStyleId]);
  const rotating = config.modes.find((option) => option.id === mode)?.strategy === 'rotation';
  const selectedMaterialIds = materialIds.length ? materialIds : config.defaultMaterialIds;

  return <div className={`w-[300px] rounded-3xl p-4 bg-[#1b2028] border border-blue-400/25 shadow-xl flex flex-col justify-between ${rotating ? 'min-h-[420px]' : 'h-[340px]'}`}>
    <div className="flex items-center justify-between"><span className="px-2 py-1 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-400/15 text-blue-300">Practice generator</span><Music2 className="w-5 h-5 text-blue-300" /></div>
    <div className="my-4">
      <h3 className="text-2xl font-black">{config.title ?? 'Practice Lab'}</h3>
      <p className="text-xs text-gray-400 mt-1">{config.description ?? 'Build a focused practice session from lesson material.'}</p>
      <div className="flex gap-1 p-1 mt-3 rounded-xl bg-black/25">
        {config.modes.map((option) => <button key={option.id} onClick={() => setMode(option.id)} aria-pressed={mode === option.id}
          className={`flex-1 h-8 rounded-lg text-[10px] font-bold ${mode === option.id ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>{option.label}</button>)}
      </div>
      <div className="flex gap-2 mt-3">
        <select aria-label="Root note" value={rootId} onChange={(event) => setRootId(event.target.value)} className="min-w-0 flex-1 h-9 rounded-xl bg-black/25 px-2 text-xs">
          {config.rootOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        {!rotating && <select aria-label="Practice material" value={selectedMaterialIds[0]} onChange={(event) => setMaterialIds([event.target.value])} className="min-w-0 flex-1 h-9 rounded-xl bg-black/25 px-2 text-[10px]">
          {config.materialOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>}
      </div>
      {rotating && <div className="mt-3">
        <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1.5">Rotate through</div>
        <div className="flex flex-wrap gap-1">{config.materialOptions.map((option) => {
          const active = materialIds.includes(option.id);
          return <button key={option.id} aria-pressed={active} onClick={() => setMaterialIds((current) => active
            ? (current.length > 1 ? current.filter((id) => id !== option.id) : current)
            : [...current, option.id])}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold ${active ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/20' : 'bg-white/5 text-gray-500'}`}>{option.label}</button>;
        })}</div>
        {config.rotation && <label className="block text-[10px] text-gray-400 mt-2">Rounds · {rounds}
          <input aria-label="Practice rounds" type="range" min={config.rotation.minRounds} max={config.rotation.maxRounds} step="1" value={rounds} onChange={(event) => setRounds(Number(event.target.value))} className="block w-full accent-blue-400" />
        </label>}
      </div>}
      {config.sequence && <label className="block text-[10px] text-gray-400 mt-3">Items · {itemCount}
        <input aria-label="Practice item count" type="range" min={config.sequence.minItems} max={config.sequence.maxItems} step={config.sequence.step ?? 1} value={itemCount} onChange={(event) => setItemCount(Number(event.target.value))} className="block w-full accent-blue-400" />
      </label>}
      <label className="block text-[10px] text-gray-400 mt-3">Tempo · {tempoBpm} BPM
        <input aria-label="Practice tempo" type="range" min={config.tempo.min} max={config.tempo.max} step={config.tempo.step ?? 1} value={tempoBpm} onChange={(event) => setTempoBpm(Number(event.target.value))} className="block w-full accent-blue-400" />
      </label>
      {config.rhythm?.enabled && !!config.rhythm.styles?.length && <label className="block text-[10px] text-gray-400 mt-3">Rhythm
        <select aria-label="Rhythm style" value={rhythmStyleId} onChange={(event) => setRhythmStyleId(event.target.value)} className="block w-full h-9 mt-1 rounded-xl bg-black/25 px-2 text-xs">
          {config.rhythm.styles.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
        </select>
      </label>}
    </div>
    <button onClick={() => onGenerate({ configId: config.id, mode, rootId, materialIds: selectedMaterialIds, tempoBpm, itemCount, rounds, rhythmStyleId })}
      className="h-10 shrink-0 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-black flex items-center justify-center gap-2"><Play className="w-4 h-4 fill-current" />{rotating ? 'Start rotation' : 'Start practice'}</button>
  </div>;
};

