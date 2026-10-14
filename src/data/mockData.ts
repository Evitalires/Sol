import { Lesson, LevelInfo, Song, Workout } from '../types';

export const INITIAL_LESSONS_LEVEL_6: Lesson[] = [
  {
    id: 'lesson-slides',
    tag: 'Lead • 6',
    category: 'Lead',
    level: 6,
    title: 'Slides',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    stars: 2,
    maxStars: 3,
    completedExercises: 7,
    totalExercises: 7,
    progressPercent: 100,
    difficulty: 'Intermediate',
    description: 'Master smooth position shifts, grace notes, and fingerboard navigation through expressive guitar slides.',
    notes: [
      { time: 1.0, stringIndex: 2, fret: 5, duration: 0.5, noteName: 'G', technique: 'normal' },
      { time: 2.0, stringIndex: 2, fret: 7, duration: 0.8, noteName: 'A', technique: 'slide' },
      { time: 3.2, stringIndex: 3, fret: 7, duration: 0.5, noteName: 'D', technique: 'normal' },
      { time: 4.2, stringIndex: 3, fret: 9, duration: 1.0, noteName: 'E', technique: 'slide' },
      { time: 5.5, stringIndex: 4, fret: 8, duration: 0.6, noteName: 'G', technique: 'normal' },
      { time: 6.5, stringIndex: 4, fret: 10, duration: 1.2, noteName: 'A', technique: 'slide' },
      { time: 8.0, stringIndex: 5, fret: 10, duration: 1.5, noteName: 'D', technique: 'normal' },
    ]
  },
  {
    id: 'lesson-fretting',
    tag: 'Lead • 6',
    category: 'Lead',
    level: 6,
    title: 'Fretting Skills',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    stars: 0,
    maxStars: 3,
    completedExercises: 3,
    totalExercises: 7,
    progressPercent: 43,
    difficulty: 'Intermediate',
    description: 'Develop finger independence, pressure control, hammer-ons, and clean articulation on high frets.',
    notes: [
      { time: 1.0, stringIndex: 1, fret: 5, duration: 0.4, noteName: 'D', technique: 'normal' },
      { time: 1.8, stringIndex: 1, fret: 7, duration: 0.6, noteName: 'E', technique: 'hammer' },
      { time: 2.8, stringIndex: 2, fret: 5, duration: 0.4, noteName: 'G', technique: 'normal' },
      { time: 3.6, stringIndex: 2, fret: 7, duration: 0.6, noteName: 'A', technique: 'hammer' },
      { time: 4.6, stringIndex: 3, fret: 5, duration: 0.5, noteName: 'C', technique: 'normal' },
      { time: 5.6, stringIndex: 3, fret: 8, duration: 0.8, noteName: 'D#', technique: 'pull' },
      { time: 7.0, stringIndex: 4, fret: 5, duration: 1.2, noteName: 'E', technique: 'normal' },
    ]
  },
  {
    id: 'lesson-fancy-chords',
    tag: 'Chords • 6',
    category: 'Chords',
    level: 6,
    title: 'Fancy Chords',
    image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=800&q=80',
    stars: 0,
    maxStars: 3,
    completedExercises: 7,
    totalExercises: 11,
    progressPercent: 64,
    difficulty: 'Intermediate',
    description: 'Explore major 7ths, suspended chords, add9 voicings, and smooth voice leading across acoustic grooves.',
    notes: [
      { time: 1.0, stringIndex: 0, fret: 3, duration: 0.6, noteName: 'Gmaj7', technique: 'normal' },
      { time: 2.2, stringIndex: 1, fret: 2, duration: 0.6, noteName: 'Cadd9', technique: 'normal' },
      { time: 3.4, stringIndex: 2, fret: 0, duration: 0.6, noteName: 'Dsus4', technique: 'normal' },
      { time: 4.8, stringIndex: 1, fret: 3, duration: 0.8, noteName: 'Em7', technique: 'normal' },
      { time: 6.0, stringIndex: 0, fret: 0, duration: 1.0, noteName: 'Asus2', technique: 'normal' },
    ]
  },
  {
    id: 'lesson-big-riffing',
    tag: 'Riffs • 6',
    category: 'Riffs',
    level: 6,
    title: 'Big Riffing',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    stars: 0,
    maxStars: 3,
    completedExercises: 0,
    totalExercises: 8,
    progressPercent: 0,
    difficulty: 'Advanced',
    description: 'Heavy rock riffs, palm muting, syncopation, and driving electric rhythm tone inspired by stadium rock.',
    notes: [
      { time: 1.0, stringIndex: 0, fret: 0, duration: 0.3, noteName: 'E', technique: 'normal' },
      { time: 1.5, stringIndex: 0, fret: 0, duration: 0.3, noteName: 'E', technique: 'normal' },
      { time: 2.2, stringIndex: 0, fret: 3, duration: 0.4, noteName: 'G', technique: 'normal' },
      { time: 2.8, stringIndex: 0, fret: 5, duration: 0.5, noteName: 'A', technique: 'normal' },
      { time: 3.8, stringIndex: 1, fret: 5, duration: 0.6, noteName: 'D', technique: 'slide' },
      { time: 5.0, stringIndex: 0, fret: 0, duration: 0.4, noteName: 'E', technique: 'normal' },
      { time: 6.0, stringIndex: 1, fret: 7, duration: 1.0, noteName: 'E power', technique: 'normal' },
    ]
  },
  {
    id: 'lesson-syncopation',
    tag: 'Rhythm • 6',
    category: 'Rhythm',
    level: 6,
    title: 'Funky Grooves',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    stars: 0,
    maxStars: 3,
    completedExercises: 0,
    totalExercises: 6,
    progressPercent: 0,
    difficulty: 'Intermediate',
    description: 'Tight 16th-note strumming, percussive left-hand muting (ghost notes), and upbeat syncopation.',
    notes: [
      { time: 1.0, stringIndex: 3, fret: 7, duration: 0.3, noteName: 'D', technique: 'normal' },
      { time: 1.6, stringIndex: 4, fret: 6, duration: 0.3, noteName: 'F', technique: 'normal' },
      { time: 2.4, stringIndex: 4, fret: 8, duration: 0.5, noteName: 'G', technique: 'slide' },
      { time: 3.5, stringIndex: 3, fret: 9, duration: 0.8, noteName: 'E9', technique: 'normal' },
    ]
  }
];

export const LEVELS_LIST: LevelInfo[] = [
  { levelNumber: 0, name: 'Basics', unlocked: true, completed: true, totalLessons: 5, completedLessons: 5, icon: 'pick' },
  { levelNumber: 1, name: 'First Notes', unlocked: true, completed: true, totalLessons: 6, completedLessons: 6 },
  { levelNumber: 2, name: 'First Chords', unlocked: true, completed: true, totalLessons: 7, completedLessons: 7 },
  { levelNumber: 3, name: 'Strumming', unlocked: true, completed: true, totalLessons: 8, completedLessons: 8 },
  { levelNumber: 4, name: 'Power Chords', unlocked: true, completed: true, totalLessons: 8, completedLessons: 8 },
  { levelNumber: 5, name: 'Pentatonics', unlocked: true, completed: true, totalLessons: 9, completedLessons: 9 },
  { levelNumber: 6, name: 'Intermediate', unlocked: true, completed: false, totalLessons: 5, completedLessons: 1 },
  { levelNumber: 7, name: 'Barre Chords', unlocked: false, completed: false, totalLessons: 8, completedLessons: 0 },
  { levelNumber: 8, name: 'Speed Picking', unlocked: false, completed: false, totalLessons: 8, completedLessons: 0 },
  { levelNumber: 9, name: 'Modal Soloing', unlocked: false, completed: false, totalLessons: 10, completedLessons: 0 },
  { levelNumber: 10, name: 'Master Virtuoso', unlocked: false, completed: false, totalLessons: 12, completedLessons: 0 },
];

export const MOCK_SONGS: Song[] = [
  {
    id: 'song-sandman',
    title: 'Enter Sandman',
    artist: 'Metallica',
    level: 6,
    category: 'Metal',
    coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
    chords: ['E5', 'F#5', 'G5', 'Bb5'],
    duration: '5:32',
    stars: 3,
    isPopular: true,
  },
  {
    id: 'song-matters',
    title: 'Nothing Else Matters',
    artist: 'Metallica',
    level: 5,
    category: 'Metal / Ballad',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    chords: ['Em', 'D', 'C', 'G', 'B7'],
    duration: '6:28',
    stars: 2,
    isPopular: true,
  },
  {
    id: 'song-puppets',
    title: 'Master of Puppets',
    artist: 'Metallica',
    level: 8,
    category: 'Thrash Metal',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    chords: ['E5', 'F5', 'F#5', 'G5'],
    duration: '8:35',
    stars: 1,
    isPopular: true,
  },
  {
    id: 'song-stairway',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    level: 6,
    category: 'Classic Rock',
    coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80',
    chords: ['Am', 'G#aug', 'C/G', 'D/F#', 'Fmaj7', 'G'],
    duration: '8:02',
    stars: 2,
  },
  {
    id: 'song-teen-spirit',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    level: 4,
    category: 'Grunge',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    chords: ['F5', 'Bb5', 'Ab5', 'Db5'],
    duration: '5:01',
    stars: 3,
    isPopular: true,
  },
  {
    id: 'song-wonderwall',
    title: 'Wonderwall',
    artist: 'Oasis',
    level: 3,
    category: 'Britpop',
    coverImage: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=400&q=80',
    chords: ['Em7', 'G', 'Dsus4', 'A7sus4'],
    duration: '4:18',
    stars: 3,
  },
  {
    id: 'song-california',
    title: 'Hotel California',
    artist: 'Eagles',
    level: 6,
    category: 'Rock',
    coverImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=400&q=80',
    chords: ['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em'],
    duration: '6:30',
    stars: 0,
    isNew: true,
  }
];

export const MOCK_WORKOUTS: Workout[] = [
  {
    id: 'w-spider',
    title: 'Spider Dexterity Warmup',
    category: 'Finger Gym',
    durationMinutes: 5,
    level: 6,
    exercisesCount: 4,
    description: '1-2-3-4 chromatic coordination on all 6 strings with alternate picking.',
    targetSkill: 'Finger Independence'
  },
  {
    id: 'w-slide-speed',
    title: 'Precision Slide Drill',
    category: 'Lead Technique',
    durationMinutes: 8,
    level: 6,
    exercisesCount: 5,
    description: 'Fast fretting jumps between 5th, 7th, 9th, and 12th positions with zero fret buzz.',
    targetSkill: 'Intonation & Target Frets'
  },
  {
    id: 'w-chord-switch',
    title: 'Lightning Chord Changes',
    category: 'Chords',
    durationMinutes: 10,
    level: 6,
    exercisesCount: 6,
    description: 'Switch between maj7, add9, and suspended chords in less than 200 milliseconds.',
    targetSkill: 'Muscle Memory'
  },
  {
    id: 'w-palm-mute',
    title: 'Heavy Metal Palm Muting',
    category: 'Rhythm',
    durationMinutes: 12,
    level: 6,
    exercisesCount: 5,
    description: 'Chug rhythm endurance on the low E and A strings at 140 BPM.',
    targetSkill: 'Right Hand Control'
  }
];

export const TUNER_STRINGS = [
  { name: 'E', octave: 2, note: 'E2', freq: 82.41, color: '#ef4444' },    // 6th string (red)
  { name: 'A', octave: 2, note: 'A2', freq: 110.00, color: '#facc15' },   // 5th string (yellow)
  { name: 'D', octave: 3, note: 'D3', freq: 146.83, color: '#ffffff' },   // 4th string (white)
  { name: 'G', octave: 3, note: 'G3', freq: 196.00, color: '#f97316' },   // 3rd string (orange)
  { name: 'B', octave: 3, note: 'B3', freq: 246.94, color: '#38bdf8' },   // 2nd string (cyan)
  { name: 'e', octave: 4, note: 'E4', freq: 329.63, color: '#a855f7' },   // 1st string (purple)
];
