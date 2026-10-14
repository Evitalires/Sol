import type {
  Lesson, LessonNote, ScoreDirection, ScoreDocument, ScoreEvent, ScoreHarmony,
  ScoreInstrument, ScoreKeySignature, ScoreMeasure, ScoreNotations, ScorePart,
  ScorePitch, ScoreTechnical, ScoreTie, ScoreTimeSignature, ScoreTuningString, ScoreClef, ScoreTransposition,
} from '../types/index.ts';

interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  text: string;
  children: XmlElement[];
}

const STEP_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const STANDARD_TUNING: ScoreTuningString[] = [
  { line: 1, step: 'E', alter: 0, octave: 2, midi: 40 },
  { line: 2, step: 'A', alter: 0, octave: 2, midi: 45 },
  { line: 3, step: 'D', alter: 0, octave: 3, midi: 50 },
  { line: 4, step: 'G', alter: 0, octave: 3, midi: 55 },
  { line: 5, step: 'B', alter: 0, octave: 3, midi: 59 },
  { line: 6, step: 'E', alter: 0, octave: 4, midi: 64 },
];

function localName(name: string): string {
  const cleaned = name.replace(/^\//, '');
  return cleaned.includes(':') ? cleaned.slice(cleaned.indexOf(':') + 1) : cleaned;
}

function decodeXml(value: string): string {
  return value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => {
    const number = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : parseInt(code, 10);
    return Number.isFinite(number) ? String.fromCodePoint(number) : '';
  }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/** Small, dependency-free XML reader. DTDs/entities are rejected; standard XML entities and namespaces are supported. */
function readXml(source: string): XmlElement {
  if (/<!ENTITY/i.test(source) || /<!DOCTYPE[^>]*\[/i.test(source)) throw new Error('MusicXML custom entities and internal DTD subsets are not supported.');
  const root: XmlElement = { name: '#document', attributes: {}, text: '', children: [] };
  const stack = [root];
  const tokens = source.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g) ?? [];
  for (const token of tokens) {
    if (token.startsWith('<!--') || token.startsWith('<?')) continue;
    if (token.startsWith('<![CDATA[')) {
      stack[stack.length - 1].text += token.slice(9, -3);
      continue;
    }
    if (token.startsWith('</')) {
      if (stack.length === 1) throw new Error('Unexpected closing tag in MusicXML.');
      const closed = stack.pop()!;
      if (localName(token.slice(2, -1).trim()) !== localName(closed.name)) throw new Error(`Mismatched XML closing tag for <${closed.name}>.`);
      continue;
    }
    if (token.startsWith('<!')) continue;
    if (token.startsWith('<')) {
      const selfClosing = /\/\s*>$/.test(token);
      const inside = token.slice(1, selfClosing ? token.lastIndexOf('/') : -1).trim();
      const name = inside.match(/^([^\s/>]+)/)?.[1];
      if (!name) throw new Error('Invalid XML element in MusicXML.');
      const attributes: Record<string, string> = {};
      const remainder = inside.slice(name.length);
      const attributePattern = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let attributeMatch: RegExpExecArray | null;
      while ((attributeMatch = attributePattern.exec(remainder))) attributes[localName(attributeMatch[1])] = decodeXml(attributeMatch[2] ?? attributeMatch[3] ?? '');
      const element: XmlElement = { name, attributes, text: '', children: [] };
      stack[stack.length - 1].children.push(element);
      if (!selfClosing) stack.push(element);
      continue;
    }
    stack[stack.length - 1].text += decodeXml(token);
  }
  if (stack.length !== 1) throw new Error(`Unclosed XML element <${stack[stack.length - 1].name}>.`);
  const score = child(root, 'score-partwise') ?? child(root, 'score-timewise');
  if (!score || localName(score.name) !== 'score-partwise') throw new Error('This importer requires a MusicXML partwise score.');
  return score;
}

function child(element: XmlElement | undefined, name: string): XmlElement | undefined {
  return element?.children.find((item) => localName(item.name) === name);
}

function children(element: XmlElement | undefined, name: string): XmlElement[] {
  return element?.children.filter((item) => localName(item.name) === name) ?? [];
}

function text(element: XmlElement | undefined, fallback = ''): string {
  return element?.text.trim() || fallback;
}

function number(element: XmlElement | undefined, fallback = 0): number {
  const parsed = Number(text(element));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function midiPitch(step: string, alter: number, octave: number): number {
  return (octave + 1) * 12 + (STEP_SEMITONES[step] ?? 0) + alter;
}

function parsePitch(element: XmlElement | undefined): ScorePitch | undefined {
  if (!element) return undefined;
  const step = text(child(element, 'step')).toUpperCase();
  if (!(step in STEP_SEMITONES)) return undefined;
  const alter = number(child(element, 'alter'));
  const octave = number(child(element, 'octave'), 4);
  return { step, alter, octave, midi: midiPitch(step, alter, octave) };
}

function parseTimeSignature(element: XmlElement | undefined, prior?: ScoreTimeSignature): ScoreTimeSignature | undefined {
  if (!element) return prior;
  const beats = children(element, 'beats').map((item) => Number(text(item))).filter(Number.isFinite).reduce((sum, value) => sum + value, 0);
  const beatType = number(child(element, 'beat-type'), prior?.beatType ?? 4);
  return beats > 0 && beatType > 0 ? { beats, beatType, symbol: element.attributes['symbol'] } : prior;
}

function parseKey(element: XmlElement | undefined, prior?: ScoreKeySignature): ScoreKeySignature | undefined {
  if (!element) return prior;
  return { fifths: number(child(element, 'fifths'), prior?.fifths ?? 0), mode: text(child(element, 'mode')) || prior?.mode };
}

function collectNamed(element: XmlElement | undefined): string[] {
  if (!element) return [];
  return element.children.map((item) => localName(item.name));
}

function emptyTechnical(): ScoreTechnical {
  return { other: [] };
}

function parseNotations(element: XmlElement | undefined): ScoreNotations {
  const technicalElement = child(element, 'technical');
  const technical = emptyTechnical();
  for (const item of technicalElement?.children ?? []) {
    const name = localName(item.name);
    if (name === 'string') technical.string = number(item);
    else if (name === 'fret') technical.fret = number(item);
    else if (name === 'fingering') technical.finger = number(item);
    else if (name === 'bend') technical.bendAlter = number(child(item, 'bend-alter'));
    else if (name === 'slide') technical.slideType = item.attributes['type'] ?? 'start';
    else if (name === 'harmonic') technical.harmonic = text(child(item, 'natural')) || text(child(item, 'artificial')) || 'harmonic';
    else if (name === 'other-technical') technical.other.push(text(item));
    else if (name === 'open-string') technical.other.push('open-string');
    else if (name === 'stopped') technical.other.push('stopped');
    else if (name === 'palm-mute') technical.palmMute = true;
    else if (name === 'let-ring') technical.letRing = true;
    else technical.other.push(name);
  }
  const articulationGroup = child(element, 'articulations');
  const ornamentsGroup = child(element, 'ornaments');
  const slurs = children(element, 'slur').map((item) => ({ type: item.attributes['type'] ?? 'start', number: item.attributes['number'] }));
  const tuplets = children(element, 'tuplet').map((item) => ({ type: item.attributes['type'] ?? 'start', number: item.attributes['number'] }));
  const fermata = text(child(element, 'fermata')) || undefined;
  const arpeggiate = Boolean(child(element, 'arpeggiate') || child(element, 'non-arpeggiate'));
  const glissando = child(element, 'glissando');
  return {
    articulations: collectNamed(articulationGroup),
    ornaments: collectNamed(ornamentsGroup),
    slurs,
    tuplets,
    technical,
    fermata,
    arpeggiate,
    glissando: glissando?.attributes['type'] ?? (glissando ? 'start' : undefined),
  };
}

function parseTuning(details: XmlElement | undefined): ScoreTuningString[] {
  const staffTuning = children(details, 'staff-tuning');
  if (!staffTuning.length) return STANDARD_TUNING.map((item) => ({ ...item }));
  const parsed = staffTuning.map((item) => {
    const step = text(child(item, 'tuning-step')).toUpperCase();
    const alter = number(child(item, 'tuning-alter'));
    const octave = number(child(item, 'tuning-octave'), 4);
    return { line: number(undefined, Number(item.attributes['line'] ?? 1)), step, alter, octave, midi: midiPitch(step, alter, octave) };
  }).filter((item) => item.step in STEP_SEMITONES);
  return parsed.length ? parsed : STANDARD_TUNING.map((item) => ({ ...item }));
}

function parseDirection(element: XmlElement, divisions: number): ScoreDirection[] {
  const offsetQuarter = number(child(element, 'offset')) / divisions;
  const context = { placement: element.attributes['placement'], staff: child(element, 'staff') ? number(child(element, 'staff')) : undefined, voice: text(child(element, 'voice')) || undefined };
  const output: ScoreDirection[] = [];
  for (const directionType of children(element, 'direction-type')) {
    for (const item of directionType.children) {
      const kind = localName(item.name);
      if (kind === 'metronome') {
        const perMinute = number(child(item, 'per-minute'));
        const unitQuarter: Record<string, number> = { maxima: 32, long: 16, breve: 8, whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25, '32nd': 0.125, '64th': 0.0625, '128th': 0.03125, '256th': 0.015625 };
        const unit = text(child(item, 'beat-unit'), 'quarter');
        const dots = children(item, 'beat-unit-dot').length;
        const dottedFactor = dots === 0 ? 1 : 2 - 2 ** -dots;
        if (perMinute > 0) output.push({ kind: 'tempo', offsetQuarter, value: unit, tempoBpm: perMinute * (unitQuarter[unit] ?? 1) * dottedFactor, ...context, attributes: { ...item.attributes, beatUnit: unit, perMinute: String(perMinute), beatUnitDots: String(dots) } });
      } else if (kind === 'rehearsal') output.push({ kind: 'rehearsal', offsetQuarter, value: text(item), ...context, attributes: item.attributes });
      else if (kind === 'words') output.push({ kind: 'words', offsetQuarter, value: text(item), ...context, attributes: item.attributes });
      else if (kind === 'segno' || kind === 'coda') output.push({ kind, offsetQuarter, value: item.attributes['id'], ...context, attributes: item.attributes });
      else output.push({ kind: 'other', offsetQuarter, value: text(item) || kind, ...context, attributes: item.attributes });
    }
  }
  const soundTempo = Number(element.attributes['tempo']);
  if (Number.isFinite(soundTempo) && soundTempo > 0) output.push({ kind: 'tempo', offsetQuarter, tempoBpm: soundTempo, value: 'quarter', ...context, attributes: element.attributes });
  for (const key of ['dacapo', 'dalsegno', 'tocoda', 'fine', 'segno', 'coda', 'divisions']) {
    if (element.attributes[key]) output.push({ kind: 'other', offsetQuarter, value: `${key}=${element.attributes[key]}`, ...context, attributes: element.attributes });
  }
  for (const direction of children(element, 'direction-type')) {
    const dynamics = child(direction, 'dynamics');
    if (dynamics) output.push({ kind: 'dynamic', offsetQuarter, value: localName(dynamics.children[0]?.name ?? '') });
  }
  return output;
}

function parseHarmony(element: XmlElement, onsetQuarter: number): ScoreHarmony | undefined {
  const harmonyPitch = (name: string): ScorePitch | undefined => {
    const node = child(element, name);
    const step = text(child(node, `${name}-step`)).toUpperCase();
    if (!(step in STEP_SEMITONES)) return undefined;
    const alter = number(child(node, `${name}-alter`));
    const octave = child(node, `${name}-octave`) ? number(child(node, `${name}-octave`)) : 4;
    return { step, alter, octave, midi: midiPitch(step, alter, octave) };
  };
  const root = harmonyPitch('root');
  if (!root) return undefined;
  const bass = harmonyPitch('bass');
  return {
    onsetQuarter,
    root,
    kind: text(child(element, 'kind'), 'other'),
    bass,
    degrees: children(element, 'degree').map((degree) => ({ value: number(child(degree, 'degree-value')), alter: number(child(degree, 'degree-alter')), type: text(child(degree, 'degree-type'), 'add') })),
  };
}

function parsePart(partElement: XmlElement, info: { name: string; abbreviation?: string; instruments: ScoreInstrument[] }, startTempo: number): ScorePart {
  const partId = partElement.attributes['id'] ?? 'P1';
  let divisions = 1;
  let timeSignature: ScoreTimeSignature = { beats: 4, beatType: 4 };
  let keySignature: ScoreKeySignature = { fifths: 0, mode: 'major' };
  let tuning = STANDARD_TUNING.map((item) => ({ ...item }));
  let staves = 1;
  let startQuarter = 0;
  const measures: ScoreMeasure[] = [];

  for (const measureElement of children(partElement, 'measure')) {
    let cursorTicks = 0;
    let maxTicks = 0;
    let previousNoteOnset = 0;
    const measureDivisions = divisions;
    const events: ScoreEvent[] = [];
    const directions: ScoreDirection[] = [];
    const harmonies: ScoreHarmony[] = [];
    let repeatStart = false;
    let repeatEndTimes: number | undefined;
    let ending: ScoreMeasure['ending'];
    let barline: ScoreMeasure['barline'];
    let clefs: ScoreClef[] = [];
    let transposition: ScoreTransposition | undefined;
    let eventIndex = 0;

    for (const item of measureElement.children) {
      const name = localName(item.name);
      if (name === 'attributes') {
        divisions = number(child(item, 'divisions'), divisions);
        if (!Number.isFinite(divisions) || divisions <= 0) divisions = 1;
        timeSignature = parseTimeSignature(child(item, 'time'), timeSignature) ?? timeSignature;
        keySignature = parseKey(child(item, 'key'), keySignature) ?? keySignature;
        staves = number(child(item, 'staves'), staves);
        for (const details of children(item, 'staff-details')) tuning = parseTuning(details);
        clefs = children(item, 'clef').map((clef) => ({ sign: text(child(clef, 'sign'), 'G'), line: number(child(clef, 'line'), 2), octaveChange: child(clef, 'clef-octave-change') ? number(child(clef, 'clef-octave-change')) : undefined, staff: Number(clef.attributes['number'] ?? 1) }));
        const transpose = child(item, 'transpose');
        if (transpose) transposition = {
          diatonic: child(transpose, 'diatonic') ? number(child(transpose, 'diatonic')) : undefined,
          chromatic: child(transpose, 'chromatic') ? number(child(transpose, 'chromatic')) : undefined,
          octaveChange: child(transpose, 'octave-change') ? number(child(transpose, 'octave-change')) : undefined,
        };
      } else if (name === 'backup') cursorTicks = Math.max(0, cursorTicks - number(child(item, 'duration')));
      else if (name === 'forward') { cursorTicks += number(child(item, 'duration')); maxTicks = Math.max(maxTicks, cursorTicks); }
      else if (name === 'direction') {
        const found = parseDirection(item, divisions);
        directions.push(...found);
      } else if (name === 'harmony') {
        const harmony = parseHarmony(item, startQuarter + cursorTicks / divisions);
        if (harmony) harmonies.push(harmony);
      } else if (name === 'note') {
        const durationTicks = number(child(item, 'duration'));
        const isChordTone = Boolean(child(item, 'chord'));
        const onsetTicks = isChordTone ? previousNoteOnset : cursorTicks;
        const onsetQuarter = startQuarter + onsetTicks / divisions;
        const durationQuarter = durationTicks / divisions;
        const notationsElement = child(item, 'notations');
        const ties: ScoreTie[] = [...children(item, 'tie'), ...children(notationsElement, 'tied')].map((tie) => ({ type: (tie.attributes['type'] ?? 'start') as ScoreTie['type'], number: tie.attributes['number'] }));
        const timeModificationElement = child(item, 'time-modification');
        const timeModification = timeModificationElement ? {
          actualNotes: number(child(timeModificationElement, 'actual-notes'), 1),
          normalNotes: number(child(timeModificationElement, 'normal-notes'), 1),
          normalType: text(child(timeModificationElement, 'normal-type')) || undefined,
        } : undefined;
        const common = {
          id: `${partId}-${measureElement.attributes['number'] ?? measures.length + 1}-${eventIndex++}`,
          onsetTicks,
          durationTicks,
          onsetQuarter,
          durationQuarter,
          onsetSeconds: 0,
          durationSeconds: 0,
          voice: text(child(item, 'voice'), '1'),
          staff: number(child(item, 'staff'), 1),
          noteType: text(child(item, 'type')) || undefined,
          dots: children(item, 'dot').length,
          timeModification,
          stem: text(child(item, 'stem')) || undefined,
          notehead: text(child(item, 'notehead')) || undefined,
          beams: children(item, 'beam').map((beam) => ({ number: number(undefined, Number(beam.attributes['number'] ?? 1)), value: text(beam) })),
          ties,
          notations: parseNotations(notationsElement),
          chord: isChordTone,
          grace: Boolean(child(item, 'grace')),
          cue: Boolean(child(item, 'cue')),
          lyrics: children(item, 'lyric').map((lyric) => ({ text: text(child(lyric, 'text')), syllabic: text(child(lyric, 'syllabic')) || undefined })),
          accidental: text(child(item, 'accidental')) || undefined,
          dynamics: children(notationsElement, 'dynamics').flatMap((dynamics) => collectNamed(dynamics)),
        };
        const pitch = parsePitch(child(item, 'pitch'));
        const rest = child(item, 'rest');
        if (pitch) {
          events.push({ ...common, kind: 'note', pitch, instrumentId: child(item, 'instrument')?.attributes['id'] });
        } else if (rest) {
          events.push({ ...common, kind: 'rest', measure: rest.attributes['measure'] === 'yes', displayStep: text(child(rest, 'display-step')) || undefined, displayOctave: child(rest, 'display-octave') ? number(child(rest, 'display-octave')) : undefined });
        } else {
          const unpitched = child(item, 'unpitched');
          const displayStep = text(child(unpitched, 'display-step')) || undefined;
          const displayOctave = child(unpitched, 'display-octave') ? number(child(unpitched, 'display-octave')) : undefined;
          if (unpitched) events.push({ ...common, kind: 'note', pitch: { step: displayStep ?? 'C', alter: 0, octave: displayOctave ?? 4, midi: midiPitch(displayStep ?? 'C', 0, displayOctave ?? 4) }, unpitched: { displayStep, displayOctave } });
        }
        if (!isChordTone) previousNoteOnset = cursorTicks;
        if (!child(item, 'grace')) cursorTicks += durationTicks;
        maxTicks = Math.max(maxTicks, cursorTicks, onsetTicks + durationTicks);
      } else if (name === 'barline') {
        barline = { location: item.attributes['location'], style: text(child(item, 'bar-style')) || undefined };
        const repeat = child(item, 'repeat');
        if (repeat?.attributes['direction'] === 'forward') repeatStart = true;
        if (repeat?.attributes['direction'] === 'backward') repeatEndTimes = Math.max(2, Number(repeat.attributes['times'] ?? 2));
        const endingElement = child(item, 'ending');
        if (endingElement) ending = { number: endingElement.attributes['number'] ?? '1', type: endingElement.attributes['type'] ?? 'start' };
      }
    }
    const expectedQuarter = timeSignature.beats * 4 / timeSignature.beatType;
    const actualQuarter = maxTicks / divisions;
    const durationQuarter = measureElement.attributes['implicit'] === 'yes' ? actualQuarter : Math.max(expectedQuarter, actualQuarter);
    const measure: ScoreMeasure = {
      number: measureElement.attributes['number'] ?? String(measures.length + 1),
      implicit: measureElement.attributes['implicit'] === 'yes',
      divisions: measureDivisions,
      startQuarter,
      durationQuarter,
      startSeconds: 0,
      durationSeconds: 0,
      timeSignature: child(measureElement, 'attributes') ? timeSignature : undefined,
      keySignature: child(measureElement, 'attributes') ? keySignature : undefined,
      clefs,
      transposition,
      repeatStart,
      repeatEndTimes,
      ending,
      barline,
      directions,
      events,
      harmonies,
    };
    measures.push(measure);
    startQuarter += durationQuarter;
  }

  return { id: partId, name: info.name, abbreviation: info.abbreviation, instruments: info.instruments, staves, tuning, measures };
}

function quarterToSeconds(quarter: number, tempos: { quarter: number; bpm: number }[]): number {
  let seconds = 0;
  let lastQuarter = 0;
  let bpm = tempos[0]?.bpm ?? 100;
  for (const change of tempos.slice(1)) {
    if (change.quarter >= quarter) break;
    seconds += (change.quarter - lastQuarter) * 60 / bpm;
    lastQuarter = change.quarter;
    bpm = change.bpm;
  }
  return seconds + (quarter - lastQuarter) * 60 / bpm;
}

export function parseMusicXml(source: string, sourceFileName?: string): ScoreDocument {
  const root = readXml(source);
  const partList = child(root, 'part-list');
  const partInfo = new Map<string, { name: string; abbreviation?: string; instruments: ScoreInstrument[] }>();
  for (const item of children(partList, 'score-part')) {
    const id = item.attributes['id'] ?? `P${partInfo.size + 1}`;
    partInfo.set(id, {
      name: text(child(item, 'part-name'), `Part ${partInfo.size + 1}`),
      abbreviation: text(child(item, 'part-abbreviation')) || undefined,
      instruments: children(item, 'score-instrument').map((instrument) => ({ id: instrument.attributes['id'] ?? id, name: text(child(instrument, 'instrument-name'), 'Instrument'), abbreviation: text(child(instrument, 'instrument-abbreviation')) || undefined, sound: text(child(instrument, 'instrument-sound')) || undefined })),
    });
  }
  const rawParts = children(root, 'part');
  if (!rawParts.length) throw new Error('The MusicXML file contains no score parts.');
  const defaultTempo = 100;
  const parts = rawParts.map((item) => parsePart(item, partInfo.get(item.attributes['id'] ?? '') ?? { name: 'Guitar', instruments: [] }, defaultTempo));
  const tempoChanges: { quarter: number; bpm: number }[] = [{ quarter: 0, bpm: defaultTempo }];
  for (const part of parts) for (const measure of part.measures) for (const direction of measure.directions) {
    if (direction.kind === 'tempo' && direction.tempoBpm && direction.tempoBpm > 0) tempoChanges.push({ quarter: measure.startQuarter + direction.offsetQuarter, bpm: direction.tempoBpm });
  }
  tempoChanges.sort((a, b) => a.quarter - b.quarter);
  const tempoByQuarter = new Map<number, number>([[0, defaultTempo]]);
  for (const change of tempoChanges.slice(1)) tempoByQuarter.set(change.quarter, change.bpm);
  const uniqueTempos = [...tempoByQuarter.entries()].map(([quarter, bpm]) => ({ quarter, bpm })).sort((a, b) => a.quarter - b.quarter);
  for (const part of parts) for (const measure of part.measures) {
    measure.startSeconds = quarterToSeconds(measure.startQuarter, uniqueTempos);
    measure.durationSeconds = quarterToSeconds(measure.startQuarter + measure.durationQuarter, uniqueTempos) - measure.startSeconds;
    for (const event of measure.events) {
      event.onsetSeconds = quarterToSeconds(event.onsetQuarter, uniqueTempos);
      event.durationSeconds = quarterToSeconds(event.onsetQuarter + event.durationQuarter, uniqueTempos) - event.onsetSeconds;
    }
  }
  const firstMeasure = parts[0]?.measures[0];
  const metadata = child(root, 'work');
  const identification = child(root, 'identification');
  const creator = (type: string) => children(identification, 'creator').find((item) => item.attributes['type'] === type);
  return {
    format: 'MusicXML',
    version: root.attributes['version'],
    title: text(child(metadata, 'work-title'), text(child(root, 'movement-title'), sourceFileName?.replace(/\.(musicxml|xml)$/i, '') || 'Imported score')),
    subtitle: text(child(metadata, 'opus')) || undefined,
    composer: text(creator('composer')) || undefined,
    lyricist: text(creator('lyricist')) || undefined,
    arranger: text(creator('arranger')) || undefined,
    rights: text(child(identification, 'rights')) || undefined,
    sourceFileName,
    defaultTempoBpm: tempoByQuarter.get(0) ?? defaultTempo,
    defaultTimeSignature: firstMeasure?.timeSignature ?? { beats: 4, beatType: 4 },
    defaultKeySignature: firstMeasure?.keySignature ?? { fifths: 0, mode: 'major' },
    parts,
    divisions: parts.flatMap((part) => part.measures.map((measure) => measure.divisions)),
  };
}

/** Expand standard forward/backward repeat barlines for the player's linear practice timeline. */
function expandedMeasures(part: ScorePart): { measure: ScoreMeasure; playbackStart: number }[] {
  const order: number[] = [];
  let repeatStart = 0;
  let repeatCount = 0;
  for (let index = 0; index < part.measures.length; index++) {
    const measure = part.measures[index];
    if (measure.repeatStart) { repeatStart = index; repeatCount = 0; }
    order.push(index);
    if (measure.repeatEndTimes && repeatCount < measure.repeatEndTimes - 1) {
      for (let repeated = repeatStart; repeated <= index; repeated++) order.push(repeated);
      repeatCount++;
    }
  }
  let playbackStart = 0;
  return order.map((index) => {
    const measure = part.measures[index];
    const current = { measure, playbackStart };
    playbackStart += measure.durationSeconds;
    return current;
  });
}

function guitarPosition(pitch: ScorePitch, tuning: ScoreTuningString[]): { stringIndex: number; fret: number } | undefined {
  const positions = tuning.map((string) => ({ stringIndex: 6 - string.line, fret: pitch.midi - string.midi }))
    .filter((position) => position.stringIndex >= 0 && position.stringIndex < 6 && position.fret >= 0 && position.fret <= 24)
    .sort((a, b) => a.fret - b.fret || b.stringIndex - a.stringIndex);
  return positions[0];
}

export function scoreToLesson(score: ScoreDocument, id = `musicxml-${Date.now()}`): Lesson {
  const guitarPart = score.parts.find((part) => /guitar|bass|ukulele/i.test(`${part.name} ${part.instruments.map((instrument) => instrument.name).join(' ')}`)) ?? score.parts[0];
  const notes: LessonNote[] = [];
  if (guitarPart) {
    const repeated = expandedMeasures(guitarPart);
    for (const occurrence of repeated) {
      const deltaSeconds = occurrence.playbackStart - occurrence.measure.startSeconds;
      for (const event of occurrence.measure.events) {
        // Keep chord members in the ScoreDocument, but the current microphone
        // scorer is monophonic, so only schedule the chord's lead note.
        if (event.kind !== 'note' || event.grace || event.chord) continue;
        const position = event.notations.technical.string && event.notations.technical.fret !== undefined
          ? { stringIndex: 6 - event.notations.technical.string, fret: event.notations.technical.fret }
          : guitarPosition(event.pitch, guitarPart.tuning);
        if (!position || position.fret < 0 || position.fret > 24) continue;
        const noteName = `${event.pitch.step}${event.pitch.alter === 1 ? '#' : event.pitch.alter === -1 ? 'b' : ''}${event.pitch.octave}`;
        const technical = event.notations.technical;
        const technique = technical.slideType ? 'slide' : technical.bendAlter ? 'normal' : 'normal';
        notes.push({
          time: Math.max(0, event.onsetSeconds + deltaSeconds),
          stringIndex: position.stringIndex,
          fret: position.fret,
          duration: Math.max(0.08, event.durationSeconds),
          noteName,
          technique,
        });
      }
    }
  }
  notes.sort((a, b) => a.time - b.time || a.stringIndex - b.stringIndex);
  if (!notes.length) throw new Error('No playable pitched guitar notes were found. Add guitar string/fret notation or notes within the guitar range.');
  return {
    id,
    tag: 'Imported · MusicXML',
    category: 'Basics',
    level: 6,
    title: score.title,
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    stars: 0,
    maxStars: 3,
    completedExercises: 0,
    totalExercises: 1,
    progressPercent: 0,
    description: `${score.parts.length} part${score.parts.length === 1 ? '' : 's'} · ${guitarPart?.measures.length ?? 0} measures · ${notes.length} playable notes`,
    difficulty: 'Intermediate',
    notes,
    score,
  };
}

export function parseMusicXmlLesson(source: string, sourceFileName?: string): Lesson {
  return scoreToLesson(parseMusicXml(source, sourceFileName));
}

