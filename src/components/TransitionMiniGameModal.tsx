import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  EFFECT_MATCH_MINIGAME_ROUNDS,
  LEVEL_TRANSITION_STORIES,
  SORTING_MINIGAME_ITEMS,
} from '../data/storyAndMinigames';
import { sound } from '../utils/sound';

interface MiniGameRewards {
  bonusPoints: number;
  grantShield: boolean;
  bonusAmmo: number;
  healHeart: boolean;
  correctCount: number;
  totalCount: number;
}

interface TransitionMiniGameModalProps {
  completedLevelNumber: number; // 1 or 2
  onContinueToNextLevel: (rewards: MiniGameRewards) => void;
}

export const TransitionMiniGameModal: React.FC<TransitionMiniGameModalProps> = ({
  completedLevelNumber,
  onContinueToNextLevel,
}) => {
  const transition = LEVEL_TRANSITION_STORIES[completedLevelNumber] ?? LEVEL_TRANSITION_STORIES[1];
  const [stage, setStage] = useState<'STORY' | 'PLAYING' | 'RESULT'>('STORY');
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(
    null
  );

  const isSorting = transition.miniGameType === 'sorting';
  const totalCount = isSorting
    ? SORTING_MINIGAME_ITEMS.length
    : EFFECT_MATCH_MINIGAME_ROUNDS.length;

  const currentSortItem = SORTING_MINIGAME_ITEMS[index];
  const currentEffectRound = EFFECT_MATCH_MINIGAME_ROUNDS[index];

  const handleSortAnswer = (chooseSafe: boolean) => {
    if (feedback) return;
    const ok = chooseSafe === currentSortItem.isSafe;
    if (ok) {
      sound.quizCorrect();
      setCorrectCount((c) => c + 1);
    } else {
      sound.quizWrong();
    }
    setFeedback({ isCorrect: ok, explanation: currentSortItem.explanation });
  };

  const handleEffectAnswer = (optIdx: number) => {
    if (feedback) return;
    const ok = optIdx === currentEffectRound.correctIndex;
    if (ok) {
      sound.quizCorrect();
      setCorrectCount((c) => c + 1);
    } else {
      sound.quizWrong();
    }
    setFeedback({ isCorrect: ok, explanation: currentEffectRound.explanation });
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    if (index + 1 < totalCount) {
      setIndex((i) => i + 1);
    } else {
      sound.powerUp();
      setStage('RESULT');
    }
  };

  // Calculate earned power-ups & points
  const computeRewards = (): MiniGameRewards => {
    if (isSorting) {
      const high = correctCount >= 4;
      return {
        bonusPoints: correctCount * 60 + (high ? 100 : 0),
        grantShield: high,
        bonusAmmo: high ? 2 : 1,
        healHeart: false,
        correctCount,
        totalCount,
      };
    }
    const high = correctCount >= 3;
    return {
      bonusPoints: correctCount * 80 + (high ? 120 : 0),
      grantShield: high,
      bonusAmmo: high ? 4 : 2,
      healHeart: correctCount >= 4,
      correctCount,
      totalCount,
    };
  };

  const rewards = computeRewards();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="text-xs font-semibold text-amber-400 mb-1.5">
          {transition.chapterLabel}
        </div>

        {stage === 'STORY' && (
          <div>
            <h2 className="text-2xl font-extrabold text-white mb-3 [text-wrap:balance]">
              {transition.title}
            </h2>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed mb-6">
              {transition.story}
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-1">
                <FlaskConical className="w-4 h-4" />
                <span>{transition.miniGameTitle}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {transition.miniGameSubtitle} Selesaikan tantangan ini untuk memperoleh{' '}
                <strong className="text-white">
                  Bonus Poin, Perisai Vitamin, dan Kapsul Anti-Adiksi
                </strong>
                !
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStage('PLAYING')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Mulai Mini-Game</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {stage === 'PLAYING' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-white">{transition.miniGameTitle}</h2>
              <span className="text-xs font-mono-tabular text-slate-300">
                Tantangan {index + 1}/{totalCount} · Benar: {correctCount}
              </span>
            </div>

            {isSorting ? (
              <div>
                <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center mb-5">
                  <div className="text-xs text-slate-400 mb-1">
                    {currentSortItem.categoryHint}
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {currentSortItem.name}
                  </div>
                </div>

                {!feedback ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSortAnswer(true)}
                      className="py-4 px-4 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-600 text-emerald-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Zat Aman (Masuk Keranjang)</span>
                    </button>
                    <button
                      onClick={() => handleSortAnswer(false)}
                      className="py-4 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-600 text-rose-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Zat Berbahaya (Tolak!)</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                  <div className="text-xs font-semibold text-cyan-400 mb-1">
                    {currentEffectRound.substanceTag}
                  </div>
                  <div className="text-base font-bold text-white leading-snug">
                    {currentEffectRound.prompt}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {currentEffectRound.options.map((opt, idx) => {
                    let cls =
                      'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-800';
                    if (feedback) {
                      if (idx === currentEffectRound.correctIndex) {
                        cls = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                      } else {
                        cls = 'bg-slate-900 border-slate-800 text-slate-500';
                      }
                    }
                    return (
                      <button
                        key={idx}
                        disabled={!!feedback}
                        onClick={() => handleEffectAnswer(idx)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${cls}`}
                      >
                        <span className="font-mono-tabular text-slate-400 mr-2">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {feedback && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div
                  className={`flex items-center gap-2 text-sm font-bold mb-1 ${
                    feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>{feedback.isCorrect ? 'Tepat Sekali!' : 'Kurang Tepat'}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {feedback.explanation}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                >
                  {index + 1 < totalCount ? 'Tantangan Berikutnya' : 'Lihat Hadiah Power-Up'}
                </button>
              </div>
            )}
          </div>
        )}

        {stage === 'RESULT' && (
          <div>
            <h2 className="text-2xl font-extrabold text-white mb-2">
              Persiapan Selesai! Mario Siap Melanjutkan
            </h2>
            <p className="text-sm text-slate-300 mb-5">
              Kamu menjawab benar{' '}
              <strong className="text-emerald-400 font-mono-tabular">
                {rewards.correctCount}/{rewards.totalCount}
              </strong>{' '}
              tantangan edukasi. Berikut hadiah yang dibawa ke Level {completedLevelNumber + 1}:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Bonus Poin</div>
                <div className="text-xl font-bold text-amber-400 font-mono-tabular mt-0.5">
                  +{rewards.bonusPoints}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Kapsul Anti-Adiksi</div>
                <div className="text-xl font-bold text-cyan-400 font-mono-tabular mt-0.5">
                  +{rewards.bonusAmmo} Kapsul
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Perlindungan Tubuh</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {rewards.grantShield ? 'Perisai Vitamin Aktif' : 'Siap Bertarung'}
                  {rewards.healHeart ? ' · +1 Hati' : ''}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => onContinueToNextLevel(rewards)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Masuk ke Level {completedLevelNumber + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
