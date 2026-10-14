import React, { useEffect, useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { Header } from './components/Header';
import { SubHeader } from './components/SubHeader';
import { LevelSelector } from './components/LevelSelector';
import { PathView, ToolsView } from './components/PathView';
import { LessonPlayerModal } from './components/LessonPlayerModal';
import { CoursePracticeModal } from './components/CoursePracticeModal';
import { TunerTab } from './components/TunerTab';
import { SongsTab } from './components/SongsTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { BottomNav } from './components/BottomNav';
import { LevelStatsModal, StreakModal } from './components/StatsModals';
import { CURRICULUM_LESSONS, CURRICULUM_LEVELS } from './data/curriculum';
import { STARTER_LESSON_BY_LEVEL, STARTER_WORKOUTS } from './data/starterLearning';
import type { LearningEvidence, LearningEvidenceEntry } from './data/starterLearning';
import { MicProvider, useMic } from './context/MicContext';
import { Lesson, MainTab, SubTab } from './types';

type StructuredSession =
  | { kind: 'lesson'; level: number }
  | { kind: 'workout'; id: string };
type EvidenceSource = 'mic' | 'self-report' | 'answer';

const LEARNING_EVIDENCE_KEY = 'sol-learning-evidence-v1';

function removeLessonContent(lesson: Lesson): Lesson {
  return { ...lesson, description: '', notes: [], score: undefined, jamSettings: undefined };
}

function loadLearningEvidence(): LearningEvidence {
  try {
    const stored = localStorage.getItem(LEARNING_EVIDENCE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as LearningEvidence;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function App() {
  return (
    <MicProvider>
      <MainApp />
    </MicProvider>
  );
}

function MainApp() {
  // Navigation states
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('Learn');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Path');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const mic = useMic();

  // Game data states
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    try {
      const saved = localStorage.getItem('sol-guitar-lessons-v1');
      const importedSaved = localStorage.getItem('sol-guitar-imported-musicxml-v1');
      const importedLessons = importedSaved ? (JSON.parse(importedSaved) as Lesson[]).filter((item) => item.id.startsWith('musicxml-')).map(removeLessonContent) : [];
      const baseLessons = [...CURRICULUM_LESSONS.map(removeLessonContent), ...importedLessons];
      if (!saved) return baseLessons;
      const savedLessons = JSON.parse(saved) as Partial<Lesson>[];
      return baseLessons.map((lesson) => {
        const progress = savedLessons.find((item) => item.id === lesson.id);
        if (!progress) return lesson;
        const stars = Number(progress.stars);
        const completedExercises = Number(progress.completedExercises);
        return {
          ...lesson,
          stars: Number.isFinite(stars) ? Math.max(lesson.stars, Math.min(3, stars)) : lesson.stars,
          completedExercises: Number.isFinite(completedExercises)
            ? Math.max(lesson.completedExercises, Math.min(lesson.totalExercises, completedExercises))
            : lesson.completedExercises,
          progressPercent: Number.isFinite(completedExercises)
            ? Math.max(lesson.progressPercent, Math.min(100, Math.round(completedExercises / lesson.totalExercises * 100)))
            : lesson.progressPercent,
        };
      });
    } catch {
      return CURRICULUM_LESSONS.map(removeLessonContent);
    }
  });
  const [starsCount, setStarsCount] = useState<number>(() => {
    try {
      const savedStars = Number(localStorage.getItem('sol-guitar-stars-v1'));
      return Number.isFinite(savedStars) && savedStars >= 46 ? savedStars : 46;
    } catch {
      return 46;
    }
  }); // 46 stars from initial profile data
  const [streakCount, setStreakCount] = useState<number>(0); // 0 streak from screenshot
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeStructuredSession, setActiveStructuredSession] = useState<StructuredSession | null>(null);
  const [learningEvidence, setLearningEvidence] = useState<LearningEvidence>(loadLearningEvidence);

  // Modals
  const [isLevelStatsOpen, setIsLevelStatsOpen] = useState<boolean>(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('sol-guitar-lessons-v1', JSON.stringify(lessons.map(({ id, stars, completedExercises }) => ({ id, stars, completedExercises }))));
    } catch {
      // Progress remains available in this session when storage is disabled.
    }
  }, [lessons]);

  useEffect(() => {
    try {
      localStorage.setItem('sol-guitar-imported-musicxml-v1', JSON.stringify(lessons.filter((lesson) => lesson.id.startsWith('musicxml-')).map(removeLessonContent)));
    } catch {
      // Imported scores stay in memory for this session when storage is full or disabled.
    }
  }, [lessons]);

  useEffect(() => {
    try {
      localStorage.setItem('sol-guitar-stars-v1', String(starsCount));
    } catch {
      // Keep the star total in memory for this session when storage is disabled.
    }
  }, [starsCount]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARNING_EVIDENCE_KEY, JSON.stringify(learningEvidence));
    } catch {
      // Evidence remains available in this session when storage is disabled or full.
    }
  }, [learningEvidence]);

  const openLesson = (lesson: Lesson) => {
    const structured = STARTER_LESSON_BY_LEVEL[lesson.level];
    if (lesson.id.startsWith('curriculum-') && structured?.activityIds.length && lesson.level <= 5) {
      setActiveLesson(null);
      setActiveStructuredSession({ kind: 'lesson', level: lesson.level });
      return;
    }
    setActiveStructuredSession(null);
    setActiveLesson(lesson);
  };

  const recordLearningEvidence = (activityId: string, correct: boolean, source: EvidenceSource, firstTry: boolean) => {
    const now = Date.now();
    setLearningEvidence((current) => {
      const previous = current[activityId];
      const successfulReviews = correct ? (previous?.successfulReviews ?? 0) + 1 : 0;
      const reviewDays = [1, 3, 7, 14, 30];
      const nextReviewAt = correct
        ? now + reviewDays[Math.min(successfulReviews - 1, reviewDays.length - 1)] * 24 * 60 * 60 * 1000
        : now + 10 * 60 * 1000;
      const entry: LearningEvidenceEntry = {
        attempts: (previous?.attempts ?? 0) + 1,
        correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
        firstTryCorrect: (previous?.firstTryCorrect ?? 0) + (correct && firstTry ? 1 : 0),
        successfulReviews,
        lastResult: correct,
        lastAttemptAt: now,
        nextReviewAt,
        source,
      };
      return { ...current, [activityId]: entry };
    });
  };

  // Handle completing a lesson in player
  const handleCompleteLesson = (lessonId: string, earnedStars: number) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === lessonId) {
          const newStars = Math.max(l.stars, earnedStars);
          const starsDiff = newStars - l.stars;
          if (starsDiff > 0) {
            setStarsCount((s) => s + starsDiff);
          }
          return {
            ...l,
            stars: newStars,
            completedExercises: l.totalExercises,
            progressPercent: 100,
          };
        }
        return l;
      })
    );
  };

  const renderMainContent = () => {
    // If user is on Tuner tab
    if (activeMainTab === 'Tuner') {
      return <TunerTab />;
    }

    // If user is on Songs tab
    if (activeMainTab === 'Songs') {
      return <SongsTab onImport={(lesson) => setLessons((previous) => [...previous, removeLessonContent(lesson)])} />;
    }

    // If user is on Home tab
    if (activeMainTab === 'Home') {
      return (
        <div className="flex-1 p-5 bg-[#121418] select-none text-white overflow-y-auto">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-2xl text-black shadow-xl shadow-emerald-500/20 mb-3">
              Y
            </div>
            <h2 className="text-xl font-black">Welcome Back, Guitarist!</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              You are currently on <span className="text-emerald-400 font-bold">Level 6</span>. Keep up your daily practice routine!
            </p>
          </div>

          <div className="p-4 bg-[#1b1e27] border border-[#2b3142] rounded-3xl mb-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2">
              Today's Recommendation
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-white">Fretting Skills & Slides</div>
                <div className="text-xs text-gray-400">10 mins practice routine</div>
              </div>
              <button
                onClick={() => {
                  setActiveMainTab('Learn');
                  if (lessons[1]) openLesson(lessons[1]);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If user is on Profile tab
    if (activeMainTab === 'Profile') {
      return (
        <div className="flex-1 p-5 bg-[#121418] select-none text-white overflow-y-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-black text-xl text-white shadow-lg">
              🎸
            </div>
            <div>
              <h2 className="text-base font-black">Jair</h2>
              <p className="text-xs text-emerald-400 font-bold">Level 5 Guitarist • 46 Stars</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 bg-[#1a1d26] border border-[#292e3c] rounded-2xl">
              <span className="text-xs text-gray-400">Total Stars</span>
              <div className="text-xl font-black text-amber-400 mt-1">★ {starsCount}</div>
            </div>
            <div className="p-3.5 bg-[#1a1d26] border border-[#292e3c] rounded-2xl">
              <span className="text-xs text-gray-400">Daily Streak</span>
              <div className="text-xl font-black text-orange-500 mt-1">🔥 {streakCount} Days</div>
            </div>
          </div>
        </div>
      );
    }

    // Default: 'Learn' Tab
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-Header: "Get Offer" + [Path, Workouts, Metallica, Song Courses] */}
        <SubHeader
          activeSubTab={activeSubTab}
          onSelectSubTab={setActiveSubTab}
          upNextLesson={lessons.find((lesson) => lesson.id.startsWith('musicxml-') || lesson.level === selectedLevel) ?? lessons[0]}
          onContinueLesson={openLesson}
        />

        {/* Learn Sub-Views */}
        {activeSubTab === 'Workouts' && <WorkoutsTab evidence={learningEvidence} onStartWorkout={(id) => {
          setActiveLesson(null);
          setActiveStructuredSession({ kind: 'workout', id });
        }} />}
        {activeSubTab === 'Tools' && <ToolsView onStartJam={(lesson) => {
          setActiveStructuredSession(null);
          setActiveLesson(lesson);
        }} />}

        {/* Path View (The core screenshot screen) */}
        {activeSubTab === 'Path' && (
          <>
            <LevelSelector
              levels={CURRICULUM_LEVELS}
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
            />
            <PathView
              lessons={lessons.filter((lesson) => lesson.id.startsWith('musicxml-') || lesson.level === selectedLevel)}
              currentLevel={selectedLevel}
              onSelectLesson={openLesson}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <PhoneFrame>
      {/* Top Mobile App Header */}
      <Header
        currentLevel={selectedLevel}
        starsCount={starsCount}
        streakCount={streakCount}
        onOpenLevelStats={() => setIsLevelStatsOpen(true)}
        onOpenStarsModal={() => setIsLevelStatsOpen(true)}
        onOpenStreakModal={() => setIsStreakModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => {
          setActiveMainTab('Songs');
        }}
        isMuted={mic.isMuted}
        toggleMute={mic.toggleMute}
        isMicActive={mic.isMicActive}
        toggleMic={mic.toggleMic}
      />

      {/* Dynamic View Body */}
      {renderMainContent()}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav activeTab={activeMainTab} onSelectTab={setActiveMainTab} />

      {/* Interactive Lesson Tab Gameplay Engine */}
      {activeLesson && (
        <LessonPlayerModal
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onCompleteLesson={handleCompleteLesson}
        />
      )}

      {activeStructuredSession && (() => {
        const session = activeStructuredSession.kind === 'lesson'
          ? (() => {
              const blueprint = STARTER_LESSON_BY_LEVEL[activeStructuredSession.level];
              const lesson = lessons.find((item) => item.id === `curriculum-${activeStructuredSession.level}`);
              return blueprint && lesson ? { kind: 'lesson' as const, blueprint, lesson } : null;
            })()
          : (() => {
              const blueprint = STARTER_WORKOUTS.find((item) => item.id === activeStructuredSession.id);
              return blueprint ? { kind: 'workout' as const, blueprint } : null;
            })();
        return session ? <CoursePracticeModal
          session={session}
          evidence={learningEvidence}
          onClose={() => setActiveStructuredSession(null)}
          onRecordEvidence={recordLearningEvidence}
          onCompleteLesson={handleCompleteLesson}
        /> : null;
      })()}

      {/* Modals */}
      <LevelStatsModal
        isOpen={isLevelStatsOpen}
        onClose={() => setIsLevelStatsOpen(false)}
        level={selectedLevel}
      />
      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streak={streakCount}
      />
      {isSettingsOpen && <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4" onClick={()=>setIsSettingsOpen(false)}><section role="dialog" aria-modal="true" aria-label="App settings" onClick={event=>event.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-[#1b1e24] border border-white/10 p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-black">Settings</h2><button onClick={()=>setIsSettingsOpen(false)} className="w-9 h-9 rounded-xl bg-white/5">×</button></div><p className="text-xs text-gray-400 mt-1">App-wide controls</p><div className="mt-4 flex items-center justify-between rounded-xl bg-black/20 p-3"><span className="text-sm">Microphone</span><button onClick={()=>void mic.toggleMic()} className="px-3 py-2 rounded-lg bg-white/10 text-xs font-bold">{mic.isMicActive?'On':'Off'}</button></div><div className="mt-2 flex items-center justify-between rounded-xl bg-black/20 p-3"><span className="text-sm">Sound effects</span><button onClick={mic.toggleMute} className="px-3 py-2 rounded-lg bg-white/10 text-xs font-bold">{mic.isMuted?'Muted':'On'}</button></div></section></div>}
    </PhoneFrame>
  );
}
