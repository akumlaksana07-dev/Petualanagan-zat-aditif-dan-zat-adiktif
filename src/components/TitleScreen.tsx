import React from 'react';
import { BookOpen, BookText, GraduationCap, Play, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import { LeaderboardEntry, LevelConfig } from '../types/game';

interface TitleScreenProps {
  levels: LevelConfig[];
  selectedLevelIndex: number;
  highScore: number;
  topPlayers: LeaderboardEntry[];
  playerName: string;
  onChangePlayerName: (name: string) => void;
  onSelectLevel: (idx: number) => void;
  onStartGame: () => void;
  onOpenStoryIntro: () => void;
  onOpenEncyclopedia: () => void;
  onOpenLeaderboard: () => void;
  onOpenDeveloperProfile: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  levels,
  selectedLevelIndex,
  highScore,
  topPlayers,
  playerName,
  onChangePlayerName,
  onSelectLevel,
  onStartGame,
  onOpenStoryIntro,
  onOpenEncyclopedia,
  onOpenLeaderboard,
  onOpenDeveloperProfile,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-10">
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl">
        {/* Hero Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-emerald-400 mb-2">
              IPA Kelas 8 · Zat Aditif &amp; Zat Adiktif · Petualangan Mario di Kerajaan Nutrisi
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight [text-wrap:balance]">
              Petualangan Mario: Penyelamat Pangan Sehat
            </h1>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Bantu Mario menyelamatkan Kerajaan Nutrisi dari pasukan Raja Zat Adiktif! Kumpulkan zat aditif alami yang aman,
              hindari atau injak bahan beracun, selesaikan mini-game uji pangan antar-level, dan taklukkan Bos Akhir.
            </p>

            {/* Player Nickname Input */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label htmlFor="title-nickname" className="text-xs font-semibold text-slate-300">
                Nama Pemain:
              </label>
              <input
                id="title-nickname"
                type="text"
                maxLength={32}
                value={playerName}
                onChange={(e) => onChangePlayerName(e.target.value)}
                placeholder="Nama kamu untuk Papan Peringkat"
                className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white w-64 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400">
                Skor otomatis masuk ke daftar peringkat setelah bermain
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 shrink-0 min-w-[220px]">
            <button
              onClick={onStartGame}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Mulai Petualangan</span>
            </button>
            <button
              onClick={onOpenStoryIntro}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookText className="w-4 h-4 text-amber-400" />
              <span>Baca Prolog Kisah</span>
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onOpenLeaderboard}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trophy className="w-4 h-4" />
                <span>Peringkat</span>
              </button>
              <button
                onClick={onOpenEncyclopedia}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" />
                <span>Pustaka Zat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Level Selector */}
        <div className="py-7 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-white">Pilih Dunia Petualangan</h2>
            <div className="flex items-center gap-2 text-sm text-amber-300 font-mono-tabular">
              <Trophy className="w-4 h-4" />
              <span>Skor Tertinggi Lokal: {highScore.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {levels.map((lvl, idx) => {
              const active = idx === selectedLevelIndex;
              return (
                <button
                  key={lvl.id}
                  onClick={() => onSelectLevel(idx)}
                  className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-400 mb-1">
                    Dunia {lvl.id} · {lvl.subtitle}
                  </div>
                  <div className="text-base font-bold text-white mb-2">{lvl.title}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{lvl.topicFocus}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-5 Live Leaderboard Preview + Guide */}
        <div className="py-7 border-b border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Trophy className="w-4 h-4" />
                <span>Daftar Pemain Skor Terbanyak</span>
              </div>
              <button
                onClick={onOpenLeaderboard}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>
            {topPlayers.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                Belum ada skor tercatat. Masukkan nama pemain di atas dan selesaikan level untuk memuncaki papan peringkat!
              </p>
            ) : (
              <div className="space-y-2">
                {topPlayers.slice(0, 5).map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0"
                  >
                    <div className="text-slate-200 font-medium truncate">
                      <span className="font-mono-tabular text-slate-400 mr-2">#{idx + 1}</span>
                      {entry.playerName}
                    </div>
                    <div className="font-mono-tabular font-bold text-amber-400 shrink-0">
                      {entry.score.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Kumpulkan Zat Aman</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Ambil Kunyit, Daun Suji, Gula Aren, Stevia, Asam Sitrat, Garam, dan Bawang Putih untuk meraih poin dan perisai Vitamin.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 font-bold text-rose-400 mb-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Hindari Zat Berbahaya</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Hindari Rhodamin B, Methanil Yellow, Formalin, Boraks, Nikotin, dan Alkohol dari samping. Injak dari atas atau tembak dengan Kapsul Anti-Adiksi!
              </p>
            </div>
          </div>
        </div>

        {/* Developer Profile Strip */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <span className="text-sm font-extrabold text-emerald-400 font-display">AL</span>
            </div>
            <div>
              <div className="text-xs text-slate-400">Pengembang Media Pembelajaran</div>
              <div className="text-sm font-bold text-white">
                Akum Laksana, S.Pd., M.Pd. ·{' '}
                <span className="text-emerald-400 font-semibold">Guru IPA SMP Negeri Perisai</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenDeveloperProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Lihat Profil Pengembang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
