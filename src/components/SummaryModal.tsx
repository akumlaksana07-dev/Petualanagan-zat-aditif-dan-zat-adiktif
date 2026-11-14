import React from 'react';
import { User } from 'firebase/auth';
import { ArrowRight, Home, RotateCcw, Trophy } from 'lucide-react';
import { SUBSTANCES } from '../data/substances';
import { SessionStats } from '../types/game';
import { GoogleIcon } from './GoogleIcon';

interface SummaryModalProps {
  mode: 'LEVEL_COMPLETE' | 'GAME_OVER' | 'VICTORY';
  levelTitle: string;
  stats: SessionStats;
  rankPosition: number | null;
  currentUser: User | null;
  authLoading: boolean;
  hasNextLevel: boolean;
  onSignInGoogle: () => void;
  onNextLevel?: () => void;
  onRetryLevel: () => void;
  onOpenLeaderboard: () => void;
  onBackToMenu: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  mode,
  levelTitle,
  stats,
  rankPosition,
  currentUser,
  authLoading,
  hasNextLevel,
  onSignInGoogle,
  onNextLevel,
  onRetryLevel,
  onOpenLeaderboard,
  onBackToMenu,
}) => {
  const collectedEntries = Object.entries(stats.safeCollected);

  const heading =
    mode === 'VICTORY'
      ? 'Selamat! Raja Zat Adiktif Berhasil Dikalahkan'
      : mode === 'LEVEL_COMPLETE'
      ? 'Level Selesai! Pangan Sehat Terjaga'
      : 'Petualangan Terhenti';

  const subheading =
    mode === 'VICTORY'
      ? 'Mario berhasil membebaskan Kerajaan Nutrisi dari cengkeraman zat aditif beracun dan zat adiktif.'
      : mode === 'LEVEL_COMPLETE'
      ? `${levelTitle} berhasil diselesaikan! Bersiaplah menghadapi mini-game uji pangan sebelum dunia berikutnya.`
      : 'Tubuh terkena terlalu banyak zat berbahaya. Tetap semangat, periksa lagi zat yang aman dan coba kembali!';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Trophy
              className={`w-4 h-4 ${mode === 'GAME_OVER' ? 'text-rose-400' : 'text-amber-400'}`}
            />
            <span className={mode === 'GAME_OVER' ? 'text-rose-400' : 'text-amber-400'}>
              {mode === 'VICTORY'
                ? 'Misi Utama Tuntas'
                : mode === 'LEVEL_COMPLETE'
                ? 'Laporan Level'
                : 'Evaluasi Misi'}
            </span>
          </div>

          {rankPosition !== null && (
            <span className="text-xs font-mono-tabular font-bold text-emerald-400">
              Peringkat Global: #{rankPosition}
            </span>
          )}
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white [text-wrap:balance]">
          {heading}
        </h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">{subheading}</p>

        {/* Google Sign-In prompt if not yet authenticated */}
        {!currentUser && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              Masuk dengan Google untuk menyimpan skormu ke daftar pemain skor terbanyak!
            </div>
            <button
              onClick={onSignInGoogle}
              disabled={authLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>{authLoading ? 'Menghubungkan...' : 'Sign In pakai Google'}</span>
            </button>
          </div>
        )}

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Total Skor</div>
            <div className="text-xl font-bold text-amber-400 font-mono-tabular mt-0.5">
              {stats.score.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Zat Aman</div>
            <div className="text-xl font-bold text-emerald-400 font-mono-tabular mt-0.5">
              {Object.values(stats.safeCollected).reduce((a, b) => a + b, 0)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Zat Disingkirkan</div>
            <div className="text-xl font-bold text-cyan-400 font-mono-tabular mt-0.5">
              {stats.enemiesStomped}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Kuis Benar</div>
            <div className="text-xl font-bold text-white font-mono-tabular mt-0.5">
              {stats.quizCorrect}/{stats.quizTotal}
            </div>
          </div>
        </div>

        {/* Collected Safe Substances Summary */}
        {collectedEntries.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-semibold text-slate-400 mb-2">
              Rangkuman Zat Aman yang Berhasil Dikumpulkan
            </div>
            <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
              {collectedEntries.map(([id, count]) => {
                const sub = SUBSTANCES[id];
                if (!sub) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">{sub.name}</span>
                      <span className="text-slate-400"> · {sub.role}</span>
                    </div>
                    <span className="font-mono-tabular text-emerald-400 font-bold">×{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToMenu}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Home className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <button
              onClick={onOpenLeaderboard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4" />
              <span>Papan Peringkat</span>
            </button>
          </div>

          {mode === 'GAME_OVER' || mode === 'VICTORY' ? (
            <button
              onClick={onRetryLevel}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{mode === 'VICTORY' ? 'Main Lagi' : 'Coba Lagi'}</span>
            </button>
          ) : (
            onNextLevel && (
              <button
                onClick={onNextLevel}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{hasNextLevel ? 'Mini-Game & Level Berikutnya' : 'Lihat Hasil Akhir'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
