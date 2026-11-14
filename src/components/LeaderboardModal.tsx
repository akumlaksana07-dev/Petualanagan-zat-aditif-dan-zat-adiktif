import React from 'react';
import { Check, Crown, Trophy, X } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  currentPlayerId: string;
  localBest: LeaderboardEntry | null;
  playerName: string;
  syncStatus: string | null;
  syncError: string | null;
  onChangePlayerName: (name: string) => void;
  onSyncNow: () => void;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  currentPlayerId,
  localBest,
  playerName,
  syncStatus,
  syncError,
  onChangePlayerName,
  onSyncNow,
  onClose,
}) => {
  const userIndex = entries.findIndex((e) => e.playerId === currentPlayerId);

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
              <h2 className="text-xl font-bold text-white">Papan Peringkat Pemain Skor Terbanyak</h2>
              <p className="text-xs text-slate-400">
                Skor pemain otomatis tersimpan ke daftar peringkat setiap selesai level, mini-game, atau akhir permainan.
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

        {/* Nickname & Rank Strip */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end gap-2.5">
            <div className="flex-1">
              <label htmlFor="lb-nickname" className="block text-xs font-medium text-slate-400 mb-1">
                Nama Tampilan di Papan Peringkat
              </label>
              <input
                id="lb-nickname"
                type="text"
                maxLength={32}
                value={playerName}
                onChange={(e) => onChangePlayerName(e.target.value)}
                placeholder="Masukkan nama panggilan..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={onSyncNow}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Nama &amp; Skor</span>
            </button>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-xs font-semibold text-emerald-400">Status Peringkat</div>
            <div className="text-xs text-slate-300">
              {userIndex >= 0
                ? `Peringkat Kamu: #${userIndex + 1}`
                : 'Selesaikan level untuk masuk daftar'}
            </div>
          </div>
        </div>

        {syncStatus && (
          <div className="px-6 py-2 bg-emerald-950/70 border-b border-emerald-800 text-xs text-emerald-200">
            {syncStatus}
          </div>
        )}

        {syncError && (
          <div className="px-6 py-2.5 bg-rose-950/70 border-b border-rose-800 text-xs text-rose-200">
            {syncError}
          </div>
        )}

        {localBest && localBest.score > 0 && (
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-300">
              Skor Terbaikmu (<strong className="text-white">{localBest.playerName}</strong>): Level {localBest.highestLevel}
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
                Belum ada pemain di daftar skor terbanyak
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Mulai bermain atau tekan tombol Simpan Nama &amp; Skor di atas untuk menjadi peringkat pertama!
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
                    const isMe = entry.playerId === currentPlayerId;
                    return (
                      <tr
                        key={entry.id}
                        className={isMe ? 'bg-emerald-950/35' : 'hover:bg-slate-800/30'}
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
