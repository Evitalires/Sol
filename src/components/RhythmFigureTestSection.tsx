import React from 'react';
import { RHYTHMIC_FIGURES, RhythmicFigure } from '../utils/jamGenerator';

interface RhythmFigureIconProps {
  figure: RhythmicFigure;
  isRest?: boolean;
  className?: string;
}

export const RhythmFigureIcon: React.FC<RhythmFigureIconProps> = ({ figure, isRest = false, className = 'w-12 h-12' }) => {
  const isTriplet = figure.tupletCount === 3;
  const headXs = isTriplet ? [17, 32, 47] : [32];
  const stemXs = headXs.map((x) => x + 6);
  const hasStem = figure.id !== 'whole';

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`${className} shrink-0 text-emerald-300`}>
      <path d="M4 46 H60 M4 40 H60 M4 34 H60 M4 28 H60 M4 22 H60" stroke="currentColor" strokeOpacity=".1" strokeWidth="1" />
      {isRest ? <>
        {figure.restBase === 'whole' && <rect x="25" y="27" width="15" height="6" rx="1" fill="currentColor" />}
        {figure.restBase === 'half' && <rect x="25" y="33" width="15" height="6" rx="1" fill="currentColor" />}
        {figure.restBase === 'quarter' && <path d="M35 17 L27 27 L35 32 L28 39 L35 45 L42 37 L36 31 L43 23 Z" fill="currentColor" />}
        {!['whole', 'half', 'quarter'].includes(figure.restBase) && <>
          <path d="M38 15 L28 40 C25 47 32 49 37 44 C41 40 36 36 31 39" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {Array.from({ length: Math.max(1, figure.flags) }, (_, index) => <circle key={index} cx={38 - index * 3} cy={17 + index * 7} r="2.6" fill="currentColor" />)}
        </>}
        {figure.dotted && <circle cx="46" cy="35" r="2" fill="currentColor" />}
        {isTriplet && <text x="32" y="15" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">3</text>}
      </> : <>
        {headXs.map((x, index) => <React.Fragment key={x}>
          <ellipse cx={x} cy="45" rx="6.5" ry="4.8" transform={`rotate(-25 ${x} 45)`} fill={figure.head === 'open' ? '#1a1f25' : 'currentColor'} stroke="currentColor" strokeWidth="2" />
          {hasStem && <path d={`M${stemXs[index]} 43 V${isTriplet ? 23 : 10}`} stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />}
          {figure.dotted && !isTriplet && index === 0 && <circle cx={x + 12} cy="45" r="2" fill="currentColor" />}
        </React.Fragment>)}
        {hasStem && (isTriplet ? Array.from({ length: figure.flags }, (_, index) => <path key={index} d={`M${stemXs[0]} ${23 + index * 4} H${stemXs[2]}`} stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />) : Array.from({ length: figure.flags }, (_, index) => <path key={index} d={`M38 ${11 + index * 5} C50 ${13 + index * 5} 50 ${19 + index * 5} 39 ${24 + index * 5}`} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />))}
        {isTriplet && <text x="32" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">3</text>}
      </>}
    </svg>
  );
};

export const RhythmFigureTestSection: React.FC = () => (
  <section aria-labelledby="rhythm-figure-test-title" className="mt-5 rounded-3xl border border-white/10 bg-[#1a1f25] p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
      <div>
        <div className="text-[9px] uppercase tracking-[.18em] text-emerald-400 font-black">Test section</div>
        <h2 id="rhythm-figure-test-title" className="text-lg font-black mt-1">Rhythm figures and rests</h2>
        <p className="text-xs text-gray-400 mt-1">Reference for the note values, silence symbols, and tuplets used by Infinite Jam.</p>
      </div>
      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300">{RHYTHMIC_FIGURES.length} figures</span>
    </div>
    <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead className="bg-white/[0.035] text-[9px] uppercase tracking-wider text-gray-400">
          <tr><th className="px-3 py-2.5 font-bold">Figure</th><th className="px-3 py-2.5 text-center font-bold">Note</th><th className="px-3 py-2.5 text-center font-bold">Rest</th><th className="px-3 py-2.5 text-right font-bold">Duration</th></tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {RHYTHMIC_FIGURES.map((figure) => (
            <tr key={figure.id} className="hover:bg-white/[0.025]">
              <th scope="row" className="px-3 py-2 text-xs font-semibold text-gray-100">{figure.name}</th>
              <td className="px-3 py-1 text-center"><span title={figure.name} className="inline-flex"><RhythmFigureIcon figure={figure} /></span></td>
              <td className="px-3 py-1 text-center"><span title={figure.restName} className="inline-flex"><RhythmFigureIcon figure={figure} isRest /></span></td>
              <td className="px-3 py-2 text-right text-xs tabular-nums text-gray-400">{figure.beatLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
