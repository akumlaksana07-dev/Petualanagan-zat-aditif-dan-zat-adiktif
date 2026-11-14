import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { QuizQuestion } from '../types/game';
import { sound } from '../utils/sound';

interface QuizModalProps {
  question: QuizQuestion;
  onComplete: (correct: boolean) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ question, onComplete }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === question.correctIndex;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    if (idx === question.correctIndex) {
      sound.quizCorrect();
    } else {
      sound.quizWrong();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-2.5 text-amber-400 text-xs font-semibold mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Blok Tanda Tanya · Tantangan Kuis Kilat</span>
        </div>

        <h3 className="text-xl font-bold text-white leading-snug mb-5 [text-wrap:balance]">
          {question.question}
        </h3>

        <div className="space-y-2.5">
          {question.options.map((opt, idx) => {
            let btnClass =
              'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-800 hover:border-slate-500';
            if (answered) {
              if (idx === question.correctIndex) {
                btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
              } else if (idx === selected) {
                btnClass = 'bg-rose-950/80 border-rose-500 text-rose-200';
              } else {
                btnClass = 'bg-slate-900 border-slate-800 text-slate-500';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${btnClass}`}
              >
                <span>
                  <span className="font-mono-tabular text-slate-400 mr-2.5">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </span>
                {answered && idx === question.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {answered && idx === selected && idx !== question.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div
              className={`text-sm font-bold mb-1 ${
                isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isCorrect
                ? 'Jawaban Benar! +300 Poin, Perisai Vitamin & +2 Kapsul Anti-Adiksi'
                : 'Belum Tepat · Pelajari Penjelasannya:'}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {question.explanation}
            </p>
            <button
              onClick={() => onComplete(isCorrect)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
            >
              Lanjutkan Permainan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
