import type { Lesson, LevelInfo } from '../types';

export const CURRICULUM_TITLES = [
  'The 6 Main Areas of Music','4 Ways To Know Your Pitch Patterns','The Dumb Machine','Basic Chords','More About Chords','Still More About Chords','Music By The Numbers','Caveman Music Theory','Notation And Rhythm','More About Notation','Silence and The Note','Intervals','More About Intervals','The Must Know Scales','More About Scales','Still More About Scales','Diatonic Harmony a la Music Theory','More About Modes','The Mode Jam Tracks','Other Scales and Modes','Pentatonic Modes','Music In Minor Keys','Modal Music',"Playin’ The Blues",'Blues Jam With Dan Lawson','Triads','Chords','Chord Voicing','More About Chord Voicing','Chord Progressions','Modulation and Substitution','And In The End',
];

const classify = (title: string): Lesson['category'] => {
  if (/chord|triad|harmony|progression|voicing|substitution/i.test(title)) return 'Chords';
  if (/scale|mode|blues|pentatonic|minor key/i.test(title)) return 'Lead';
  if (/notation|rhythm|silence|pitch pattern/i.test(title)) return 'Rhythm';
  return 'Basics';
};
export const CURRICULUM_LESSONS: Lesson[] = CURRICULUM_TITLES.map((title, index) => {
  const level = index + 1;
  const category = classify(title);
  return {
    id: `curriculum-${level}`, tag: `${category} · ${level}`, category, level, title,
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    stars: 0, maxStars: 3, completedExercises: 0, totalExercises: 1, progressPercent: 0,
    difficulty: level < 10 ? 'Beginner' : level < 22 ? 'Intermediate' : 'Advanced',
    description: '',
    notes: [],
  };
});

export const CURRICULUM_LEVELS: LevelInfo[] = CURRICULUM_TITLES.map((title, index) => ({
  levelNumber: index + 1,
  name: title,
  unlocked: true,
  completed: false,
  totalLessons: 1,
  completedLessons: 0,
}));
