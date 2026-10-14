import React from 'react';
import { Play } from 'lucide-react';
import { Lesson } from '../types';
import { sound } from '../utils/audio';

interface LessonCardProps {
  lesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onSelectLesson }) => {
  const isCompleted = lesson.completedExercises === lesson.totalExercises;
  const hasStarted = lesson.completedExercises > 0;

  return (
    <div
      onClick={() => {
        sound.playClick();
        onSelectLesson(lesson);
      }}
      className="group relative flex-none w-[220px] sm:w-[240px] bg-[#23272e] rounded-2xl overflow-hidden border border-[#313642] shadow-xl hover:border-emerald-500/50 hover:shadow-emerald-500/10 cursor-pointer transition-all duration-200 active:scale-98 flex flex-col"
    >
      {/* Top Image Banner */}
      <div className="relative h-[115px] sm:h-[125px] w-full overflow-hidden bg-[#16181e]">
        <img
          src={lesson.image}
          alt={lesson.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Subtle gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#23272e] via-black/20 to-transparent" />

        {/* Hover / Active Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/40 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          {/* Category & Level Tag (e.g. Lead • 6) */}
          <div className="text-[13px] font-bold text-emerald-400 tracking-wide mb-1">
            {lesson.tag}
          </div>

          {/* Lesson Title */}
          <h3 className="text-base font-extrabold text-white leading-tight mb-3">
            {lesson.title}
          </h3>
        </div>

        {/* Bottom Ratings & Exercise Progress Pill */}
        <div className="flex items-center justify-between pt-1">
          {/* 3 Stars Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((starIndex) => {
              const isFilled = starIndex <= lesson.stars;
              return (
                <span
                  key={starIndex}
                  className={`text-sm leading-none ${
                    isFilled ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {isFilled ? '★' : '☆'}
                </span>
              );
            })}
          </div>

          {/* Progress Pill Badge */}
          <div
            className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-tight ${
              isCompleted
                ? 'bg-[#373c47] text-gray-200'
                : hasStarted
                ? 'bg-[#10b981] text-black font-extrabold shadow-sm shadow-emerald-500/20'
                : 'bg-[#2f343f] text-gray-400'
            }`}
          >
            {lesson.completedExercises}/{lesson.totalExercises}
          </div>
        </div>
      </div>

      {/* Bottom Green Progress Bar */}
      {lesson.progressPercent > 0 && (
        <div className="h-1.5 w-full bg-[#1b1e24] overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-500 rounded-r-full"
            style={{ width: `${lesson.progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
