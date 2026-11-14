import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Play, ShieldAlert, Skull, Sparkles } from 'lucide-react';
import { STORY_PROLOGUE } from '../data/storyAndMinigames';

interface StoryIntroModalProps {
  onStartLevel1: () => void;
  onCloseToMenu: () => void;
}

export const StoryIntroModal: React.FC<StoryIntroModalProps> = ({
  onStartLevel1,
  onCloseToMenu,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const beat = STORY_PROLOGUE[stepIndex];
  const isLast = stepIndex === STORY_PROLOGUE.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Visual Story Banner */}
        <div
          className={`px-6 py-6 border-b border-slate-800 ${
            beat.theme === 'threat'
              ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/50'
              : beat.theme === 'safe_vs_danger'
              ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/50'
              : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-purple-950/70'
          }`}
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs font-semibold text-amber-300">{beat.chapterLabel}</span>
            <button
              onClick={onStartLevel1}
              className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
            >
              Lewati Prolog
            </button>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-center shrink-0">
              {beat.theme === 'threat' && <ShieldAlert className="w-6 h-6 text-amber-400" />}
              {beat.theme === 'safe_vs_danger' && <Sparkles className="w-6 h-6 text-emerald-400" />}
              {beat.theme === 'boss' && <Skull className="w-6 h-6 text-rose-400" />}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white leading-tight [text-wrap:balance]">
                {beat.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Story Body */}
        <div className="p-6 space-y-5">
          <p className="text-base text-slate-200 leading-relaxed">{beat.narrative}</p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-emerald-400 mb-1">{beat.highlightLabel}</div>
            <p className="text-sm text-slate-300 leading-relaxed">{beat.highlightText}</p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-4">
            <div className="flex items-center gap-2">
              {STORY_PROLOGUE.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setStepIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === stepIndex ? 'w-7 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Bab ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              {stepIndex > 0 ? (
                <button
                  onClick={() => setStepIndex((s) => s - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
              ) : (
                <button
                  onClick={onCloseToMenu}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Menu
                </button>
              )}

              {!isLast ? (
                <button
                  onClick={() => setStepIndex((s) => s + 1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Lanjut Kisah</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onStartLevel1}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Mulai Level 1</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
