import React from 'react';
import { ArrowRight, Clock3, Dumbbell, Flame, RotateCcw, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import type { LearningEvidence, StarterWorkoutBlueprint } from '../data/starterLearning';
import { STARTER_WORKOUTS } from '../data/starterLearning';

interface WorkoutsTabProps {
  evidence: LearningEvidence;
  onStartWorkout: (workoutId: string) => void;
}

function getWorkoutPriority(workout: StarterWorkoutBlueprint, evidence: LearningEvidence, now: number) {
  let score = 0;
  let dueCount = 0;
  let missedCount = 0;
  let unseenCount = 0;
  for (const activityId of workout.activityIds) {
    const record = evidence[activityId];
    if (!record) {
      score += 1;
      unseenCount += 1;
      continue;
    }
    if (record.lastResult === false) {
      score += 5;
      missedCount += 1;
    } else if (record.nextReviewAt <= now) {
      score += 3;
      dueCount += 1;
    } else if (record.attempts > 0) {
      score += Math.max(0, 1 - record.correct / record.attempts) * 2;
    }
  }
  return { score, dueCount, missedCount, unseenCount };
}

function priorityReason(result: ReturnType<typeof getWorkoutPriority>) {
  if (result.missedCount) return `${result.missedCount} recent item${result.missedCount === 1 ? '' : 's'} need another pass`;
  if (result.dueCount) return `${result.dueCount} item${result.dueCount === 1 ? '' : 's'} ready for spaced review`;
  if (result.unseenCount) return 'Build a baseline in a new core skill';
  return 'Revisit this skill in a fresh musical context';
}

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({ evidence, onStartWorkout }) => {
  const now = Date.now();
  const ranked = STARTER_WORKOUTS
    .map((workout) => ({ workout, priority: getWorkoutPriority(workout, evidence, now) }))
    .sort((a, b) => b.priority.score - a.priority.score || a.workout.priorityOrder - b.workout.priorityOrder);
  const priorityWorkout = ranked[0];

  const startWorkout = (id: string) => {
    sound.playClick();
    onStartWorkout(id);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-[#121418] text-white overflow-y-auto">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">Practice lab</span>
        </div>
        <h2 className="text-xl font-black">Workouts</h2>
        <p className="text-xs text-gray-400 mt-1">Focused practice from concepts you have already met in your lessons.</p>
      </div>

      {priorityWorkout && <section className="mb-5 rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-emerald-300"><Sparkles className="w-3.5 h-3.5" /> Today's priority</div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-black truncate">{priorityWorkout.workout.title}</h3>
            <p className="text-xs text-gray-300 mt-1">{priorityReason(priorityWorkout.priority)}</p>
          </div>
          <button onClick={() => startWorkout(priorityWorkout.workout.id)} className="shrink-0 h-10 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs flex items-center gap-1.5">Start <ArrowRight className="w-4 h-4" /></button>
        </div>
      </section>}

      <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest font-black text-gray-500"><Flame className="w-3.5 h-3.5 text-amber-400" /> First five focused workouts</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ranked.map(({ workout, priority }) => {
          const isPriority = workout.id === priorityWorkout?.workout.id;
          return <article key={workout.id} className={`rounded-2xl border p-4 flex flex-col ${isPriority ? 'border-emerald-400/30 bg-[#1a2023]' : 'border-white/[0.08] bg-[#1a1d26]'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full">{workout.category}</span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock3 className="w-3 h-3" />{workout.durationMinutes} min</span>
            </div>
            <h3 className="text-sm font-extrabold mt-3">{workout.title}</h3>
            <p className="text-xs text-gray-400 mt-1 flex-1">{workout.description}</p>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-400">Focus: <b className="text-amber-300">{workout.targetSkill}</b></span>
              <button onClick={() => startWorkout(workout.id)} className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" />{isPriority ? 'Priority' : 'Start'}</button>
            </div>
          </article>;
        })}
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-gray-500">A workout reinforces a lesson; it will not introduce or grade a concept you have not learned yet. Self-checks and microphone checks are labeled separately.</p>
    </div>
  );
};
