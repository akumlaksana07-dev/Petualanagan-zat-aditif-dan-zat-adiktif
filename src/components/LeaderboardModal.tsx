import React from 'react';
import { Crown, LogIn, LogOut, Trophy, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  localBest: LeaderboardEntry | null;
  currentUser: User | null;
  playerName: string;
  onChangePlayerName: (name: string) => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onClose: () => void;
  authError: string | null;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  localBest,
  currentUser,
  playerName,
  onChangePlayerName,
  onSignInGoogle,
  onSignOut,
  onClose,
  authError,
}) => {
  const userIndex = currentUser ? entries.findIndex((e) => e.uid === currentUser.uid) : -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Papan Peringkat Pemain</h2>
              <p className="text-xs text-slate-400">
                Skor diperbarui otomatis setiap selesai level, mini-game, atau mengalahkan Bos Akhir.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Papan Peringkat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account & Nickname Strip */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="lb-nickname" className="block text-xs font-medium text-slate-400 mb-1">
              Nama Tampilan Peringkat
            </label>
            <input
              id="lb-nickname"
              type="text"
              maxLength={32}
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              placeholder="Masukkan nama panggilan..."
              className="w-full sm:max-w-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-emerald-400">Terhubung ke Peringkat Global</div>
                  <div className="text-xs text-slate-300">
                    {userIndex >= 0 ? `Peringkat Kamu: #${userIndex + 1}` : 'Mainkan level untuk masuk peringkat'}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInGoogle}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Google untuk Simpan Skor Global</span>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div className="px-6 py-2.5 bg-rose-950/70 border-b border-rose-800 text-xs text-rose-200">
            {authError}
          </div>
        )}

        {/* Local Best Fallback Banner when not signed in */}
        {!currentUser && localBest && localBest.score > 0 && (
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-300">
              Skor Lokal Terbaikmu (<strong className="text-white">{localBest.playerName}</strong>): Level {localBest.highestLevel}
              {localBest.bossDefeated ? ' · Menang Bos' : ''}
            </span>
            <span className="font-mono-tabular font-bold text-amber-400 text-sm">
              {localBest.score.toLocaleString('id-ID')} poin
            </span>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {entries.length === 0 ? (
            <div className="py-12 text-center">
              <Crown className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-300">
                Belum ada skor di papan peringkat global
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Masuk dengan Google dan selesaikan Level 1 untuk menjadi peringkat pertama!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Peringkat</th>
                    <th className="py-2.5 pr-4 font-semibold">Pemain</th>
                    <th className="py-2.5 pr-4 font-semibold">Progres</th>
                    <th className="py-2.5 pr-4 font-semibold">Kuis</th>
                    <th className="py-2.5 text-right font-semibold">Skor Tertinggi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {entries.map((entry, idx) => {
                    const isMe = currentUser && entry.uid === currentUser.uid;
                    return (
                      <tr
                        key={entry.id}
                        className={isMe ? 'bg-emerald-950/30' : 'hover:bg-slate-800/30'}
                      >
                        <td className="py-3 pr-4 font-mono-tabular font-bold text-slate-200">
                          #{idx + 1}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-white">
                          {entry.playerName}
                          {isMe && (
                            <span className="ml-2 text-xs font-medium text-emerald-400">(Kamu)</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-300">
                          Level {entry.highestLevel}/3
                          {entry.bossDefeated ? ' · Bos Dikalahkan' : ''}
                        </td>
                        <td className="py-3 pr-4 text-xs font-mono-tabular text-slate-300">
                          {entry.quizCorrect}/{entry.quizTotal}
                        </td>
                        <td className="py-3 text-right font-mono-tabular font-bold text-amber-400">
                          {entry.score.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
