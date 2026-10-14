import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseMusicXml, scoreToLesson } from '../src/utils/musicXml.ts';

const songXml = await readFile(new URL('../public/examples/evening-lantern.musicxml', import.meta.url), 'utf8');
const song = parseMusicXml(songXml, 'evening-lantern.musicxml');
const songEvents = song.parts[0].measures.flatMap((measure) => measure.events);
const songLesson = scoreToLesson(song, 'test-song');
assert.equal(song.title, 'Evening Lantern');
assert.equal(song.defaultTempoBpm, 92);
assert.deepEqual(song.defaultTimeSignature, { beats: 4, beatType: 4, symbol: undefined });
assert.equal(song.defaultKeySignature.fifths, -1);
assert.ok(songEvents.some((event) => event.kind === 'rest'), 'song retains rests');
assert.ok(songEvents.some((event) => event.kind === 'note' && event.chord), 'song retains chord tone markers');
assert.equal(song.parts[0].measures[0].harmonies[0].kind, 'minor', 'song retains chord symbols');
assert.ok(songEvents.some((event) => event.ties.some((tie) => tie.type === 'start')));
assert.ok(song.parts[0].measures[1].directions.some((direction) => direction.tempoBpm === 104));
assert.equal(songLesson.notes.length, 14, 'two measures with a two-pass repeat expand to four measures; simultaneous chord tones are not double-scored');
assert.ok(songLesson.notes[4].time > songLesson.notes[0].time);

const scaleXml = await readFile(new URL('../public/examples/c-major-scale.musicxml', import.meta.url), 'utf8');
const scale = parseMusicXml(scaleXml, 'c-major-scale.musicxml');
const scaleLesson = scoreToLesson(scale, 'test-scale');
assert.equal(scale.title, 'C Major Scale');
assert.equal(scaleLesson.notes.length, 8);
assert.deepEqual(scale.parts[0].measures[0].events.map((event) => event.kind === 'note' ? event.pitch.midi : null), [48, 50, 52, 53, 55, 57, 59, 60]);
assert.deepEqual(scaleLesson.notes.map((note) => [note.stringIndex, note.fret]), [[0,8],[1,5],[1,7],[2,3],[2,5],[3,2],[3,4],[4,1]]);

assert.throws(() => scoreToLesson(parseMusicXml('<score-partwise><part id="P1"><measure><note/></measure></part></score-partwise>')), /no playable pitched/i);
assert.throws(() => parseMusicXml('<!DOCTYPE x [<!ENTITY e "x">]><score-partwise/>'), /custom entities/i);
console.log('MusicXML checks passed: Evening Lantern song (repeats, rests, chord, ties, tempo changes) and C Major Scale (8 notes, expected guitar positions).');
