import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Crosshair,
  GraduationCap,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DeveloperProfileModal } from './components/DeveloperProfileModal';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { GameCanvas, TouchInputState } from './components/GameCanvas';
import { GoogleIcon } from './components/GoogleIcon';
import { LeaderboardModal } from './components/LeaderboardModal';
import { QuizModal } from './components/QuizModal';
import { StoryIntroModal } from './components/StoryIntroModal';
import { SummaryModal } from './components/SummaryModal';
import { TitleScreen } from './components/TitleScreen';
import { TransitionMiniGameModal } from './components/TransitionMiniGameModal';
import { createLevels } from './data/levels';
import { QUIZ_QUESTIONS } from './data/substances';
import {
  logoutUser,
  sanitizeNickname,
  signInWithGoogle,
  submitLeaderboardScore,
  subscribeAuth,
  subscribeLeaderboard,
  testFirestoreConnection,
} from './lib/firebase';
import {
  DiscoveryBanner,
  GameStatus,
  LeaderboardEntry,
  QuizQuestion,
  SessionStats,
} from './types/game';
import { sound } from './utils/sound';

const INITIAL_STATS: SessionStats = {
  score: 0,
  safeCollected: {},
  hazardsHit: 0,
  enemiesStomped: 0,
  quizCorrect: 0,
  quizTotal: 0,
  bossDefeated: false,
};

export default function App() {
  const [status, setStatus] = useState<GameStatus>('TITLE_MENU');
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [levelInstanceKey, setLevelInstanceKey] = useState(0);
  const [levels, setLevels] = useState(() => createLevels());

  const [carryHp, setCarryHp] = useState(3);
  const [carryShield, setCarryShield] = useState(false);
  const [carryAmmo, setCarryAmmo] = useState(0);

  const [hud, setHud] = useState<{
    hp: number;
    maxHp: number;
    hasShield: boolean;
    ammo: number;
    boss: { active: boolean; hp: number; maxHp: number; phase: number; defeated: boolean } | null;
  }>({
    hp: 3,
    maxHp: 3,
    hasShield: false,
    ammo: 0,
    boss: null,
  });

  const [stats, setStats] = useState<SessionStats>(INITIAL_STATS);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('petualangan_zat_highscore') || '0');
    } catch {
      return 0;
    }
  });
  const [localBest, setLocalBest] = useState<LeaderboardEntry | null>(() => {
    try {
      const raw = localStorage.getItem('petualangan_zat_local_best');
      return raw ? (JSON.parse(raw) as LeaderboardEntry) : null;
    } catch {
      return null;
    }
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('petualangan_zat_nickname') || 'Mario Peneliti';
    } catch {
      return 'Mario Peneliti';
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDeveloperProfile, setShowDeveloperProfile] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [discovery, setDiscovery] = useState<DiscoveryBanner | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [usedQuizIds, setUsedQuizIds] = useState<Set<string>>(new Set());
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [muted, setMuted] = useState(false);

  const touchInputRef = useRef<TouchInputState>({
    left: false,
    right: false,
    jump: false,
    shoot: false,
  });

  const currentLevel = levels[selectedLevelIndex];

  // Initialize Firebase connection, auth listener, and live leaderboard listener
  useEffect(() => {
    testFirestoreConnection();
    const unsubAuth = subscribeAuth((user) => {
      setCurrentUser(user);
      if (user?.displayName) {
        setPlayerName((prev) => {
          if (!prev || prev === 'Mario Peneliti') {
            const nextName = sanitizeNickname(user.displayName || 'Mario Peneliti');
            try {
              localStorage.setItem('petualangan_zat_nickname', nextName);
            } catch {
              // Ignore
            }
            return nextName;
          }
          return prev;
        });
      }
    });
    const unsubLb = subscribeLeaderboard(
      (entries) => setLeaderboardEntries(entries),
      (err) => {
        console.error('Leaderboard subscription error:', err);
      }
    );
    return () => {
      unsubAuth();
      unsubLb();
    };
  }, []);

  const handleNicknameChange = (val: string) => {
    setPlayerName(val);
    try {
      localStorage.setItem('petualangan_zat_nickname', val);
    } catch {
      // Ignore
    }
  };

  const syncScoreToLeaderboards = useCallback(
    (snapshotStats: SessionStats, reachedLevelNumber: number) => {
      const cleanName = sanitizeNickname(playerName);
      // Update local best record
      setLocalBest((prev) => {
        const nextBest: LeaderboardEntry = {
          id: 'local-best',
          playerName: cleanName,
          score: Math.max(prev?.score ?? 0, snapshotStats.score),
          highestLevel: Math.max(prev?.highestLevel ?? 1, reachedLevelNumber),
          bossDefeated: Boolean(prev?.bossDefeated || snapshotStats.bossDefeated),
          quizCorrect:
            snapshotStats.score >= (prev?.score ?? 0)
              ? snapshotStats.quizCorrect
              : prev?.quizCorrect ?? snapshotStats.quizCorrect,
          quizTotal:
            snapshotStats.score >= (prev?.score ?? 0)
              ? snapshotStats.quizTotal
              : prev?.quizTotal ?? snapshotStats.quizTotal,
          updatedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem('petualangan_zat_local_best', JSON.stringify(nextBest));
        } catch {
          // Ignore
        }
        return nextBest;
      });

      // Update Global Firestore Leaderboard if authenticated
      if (currentUser) {
        submitLeaderboardScore({
          playerName: cleanName,
          score: snapshotStats.score,
          highestLevel: reachedLevelNumber,
          bossDefeated: snapshotStats.bossDefeated,
          quizCorrect: snapshotStats.quizCorrect,
          quizTotal: snapshotStats.quizTotal,
        }).catch((err) => {
          setAuthError(
            err instanceof Error ? err.message : 'Gagal menyimpan skor ke papan peringkat.'
          );
        });
      }
    },
    [currentUser, playerName]
  );

  const updateHighScore = useCallback((newScore: number) => {
    setHighScore((prev) => {
      const next = Math.max(prev, newScore);
      try {
        localStorage.setItem('petualangan_zat_highscore', String(next));
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  }, []);

  const handleScoreDelta = useCallback(
    (delta: number) => {
      setStats((prev) => {
        const nextScore = Math.max(0, prev.score + delta);
        updateHighScore(nextScore);
        return { ...prev, score: nextScore };
      });
    },
    [updateHighScore]
  );

  const handleCollectSafe = useCallback((substanceId: string) => {
    setStats((prev) => ({
      ...prev,
      safeCollected: {
        ...prev.safeCollected,
        [substanceId]: (prev.safeCollected[substanceId] || 0) + 1,
      },
    }));
  }, []);

  const handleHitHazard = useCallback(() => {
    setStats((prev) => ({ ...prev, hazardsHit: prev.hazardsHit + 1 }));
  }, []);

  const handleStompEnemy = useCallback(() => {
    setStats((prev) => ({ ...prev, enemiesStomped: prev.enemiesStomped + 1 }));
  }, []);

  const launchLevel = (levelIdx: number, resetStats: boolean) => {
    const freshLevels = createLevels();
    setLevels(freshLevels);
    setSelectedLevelIndex(levelIdx);
    if (resetStats) {
      setCarryHp(3);
      setCarryShield(false);
      setCarryAmmo(levelIdx === 2 ? 3 : 0);
      setStats(INITIAL_STATS);
      setUsedQuizIds(new Set());
    }
    setDiscovery({
      id: `start-${levelIdx}-${Date.now()}`,
      title: freshLevels[levelIdx].title,
      categoryLabel: 'Misi Dimulai',
      description: freshLevels[levelIdx].topicFocus,
      isSafe: true,
      pointsDelta: 0,
    });
    setLevelInstanceKey((k) => k + 1);
    setStatus('PLAYING');
  };

  const handleStartFromTitle = () => {
    if (selectedLevelIndex === 0) {
      setStatus('STORY_INTRO');
    } else {
      launchLevel(selectedLevelIndex, true);
    }
  };

  const retryCurrentLevel = () => {
    if (status === 'VICTORY') {
      launchLevel(0, true);
    } else {
      setCarryHp(3);
      setCarryShield(false);
      setCarryAmmo(selectedLevelIndex === 2 ? 3 : 0);
      launchLevel(selectedLevelIndex, false);
    }
  };

  const handleAfterLevelComplete = () => {
    if (selectedLevelIndex < levels.length - 1) {
      setStatus('BETWEEN_LEVEL_MINIGAME');
    } else {
      setStatus('VICTORY');
    }
  };

  const handleMiniGameFinished = (rewards: {
    bonusPoints: number;
    grantShield: boolean;
    bonusAmmo: number;
    healHeart: boolean;
    correctCount: number;
    totalCount: number;
  }) => {
    const nextIdx = selectedLevelIndex + 1;
    const updatedScore = stats.score + rewards.bonusPoints;
    const updatedStats: SessionStats = {
      ...stats,
      score: updatedScore,
      quizCorrect: stats.quizCorrect + rewards.correctCount,
      quizTotal: stats.quizTotal + rewards.totalCount,
    };
    setStats(updatedStats);
    updateHighScore(updatedScore);
    syncScoreToLeaderboards(updatedStats, nextIdx + 1);

    if (rewards.grantShield) setCarryShield(true);
    setCarryAmmo((a) => a + rewards.bonusAmmo);
    if (rewards.healHeart) setCarryHp((h) => Math.min(3, h + 1));

    launchLevel(nextIdx, false);
  };

  const handleTriggerQuiz = useCallback(() => {
    const levelNumber = selectedLevelIndex + 1;
    const pool = QUIZ_QUESTIONS.filter(
      (q) => !usedQuizIds.has(q.id) && (q.levelHint === levelNumber || !q.levelHint)
    );
    const fallbackPool = QUIZ_QUESTIONS.filter((q) => !usedQuizIds.has(q.id));
    const candidates =
      pool.length > 0 ? pool : fallbackPool.length > 0 ? fallbackPool : QUIZ_QUESTIONS;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    setUsedQuizIds((prev) => new Set(prev).add(chosen.id));
    setActiveQuiz(chosen);
    setStatus('QUIZ_MODAL');
  }, [selectedLevelIndex, usedQuizIds]);

  const handleQuizComplete = (correct: boolean) => {
    setActiveQuiz(null);
    setStats((prev) => {
      const nextScore = prev.score + (correct ? 300 : 0);
      updateHighScore(nextScore);
      return {
        ...prev,
        score: nextScore,
        quizCorrect: prev.quizCorrect + (correct ? 1 : 0),
        quizTotal: prev.quizTotal + 1,
      };
    });
    window.dispatchEvent(new CustomEvent('quiz-resolved', { detail: { correct } }));
    setStatus('PLAYING');
  };

  const handleSignInGoogle = async () => {
    setAuthError(null);
    setSyncStatus(null);
    setAuthLoading(true);
    try {
      const user = await signInWithGoogle();
      const chosenName = sanitizeNickname(
        playerName && playerName !== 'Mario Peneliti'
          ? playerName
          : user.displayName || 'Mario Peneliti'
      );
      setPlayerName(chosenName);
      try {
        localStorage.setItem('petualangan_zat_nickname', chosenName);
      } catch {
        // Ignore
      }

      // Immediately register or update player's entry in Firestore Leaderboard
      const scoreToSave = Math.max(stats.score, localBest?.score ?? 0);
      await submitLeaderboardScore({
        playerName: chosenName,
        score: scoreToSave,
        highestLevel: Math.max(selectedLevelIndex + 1, localBest?.highestLevel ?? 1),
        bossDefeated: Boolean(stats.bossDefeated || localBest?.bossDefeated),
        quizCorrect: Math.max(stats.quizCorrect, localBest?.quizCorrect ?? 0),
        quizTotal: Math.max(stats.quizTotal, localBest?.quizTotal ?? 0),
      });
      setSyncStatus(`Berhasil masuk sebagai ${chosenName} dan terdaftar di papan peringkat!`);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Gagal masuk dengan Google. Silakan coba kembali.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSyncNow = async () => {
    if (!currentUser) return;
    setAuthError(null);
    setSyncStatus(null);
    const chosenName = sanitizeNickname(playerName);
    const scoreToSave = Math.max(stats.score, localBest?.score ?? 0);
    try {
      await submitLeaderboardScore({
        playerName: chosenName,
        score: scoreToSave,
        highestLevel: Math.max(selectedLevelIndex + 1, localBest?.highestLevel ?? 1),
        bossDefeated: Boolean(stats.bossDefeated || localBest?.bossDefeated),
        quizCorrect: Math.max(stats.quizCorrect, localBest?.quizCorrect ?? 0),
        quizTotal: Math.max(stats.quizTotal, localBest?.quizTotal ?? 0),
      });
      setSyncStatus('Nama dan skor berhasil diperbarui di daftar pemain skor terbanyak.');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Gagal memperbarui skor ke papan peringkat.'
      );
    }
  };

  const handleSignOut = async () => {
    setSyncStatus(null);
    setAuthError(null);
    await logoutUser();
  };

  const handleToggleMute = () => {
    sound.muted = !muted;
    setMuted(!muted);
  };

  const handleTogglePause = useCallback(() => {
    setStatus((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
  }, []);

  const setTouchKey = (key: keyof TouchInputState, val: boolean) => {
    touchInputRef.current[key] = val;
  };

  const hearts = useMemo(() => Array.from({ length: hud.maxHp }, (_, i) => i < hud.hp), [hud.hp, hud.maxHp]);

  const currentRankPosition = useMemo(() => {
    if (!currentUser) return null;
    const idx = leaderboardEntries.findIndex((e) => e.uid === currentUser.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [currentUser, leaderboardEntries]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract: Brand — Status/Links — Actions */}
      <header className="w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => setStatus('TITLE_MENU')}
            className="text-lg font-extrabold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Petualangan Mario
          </button>

          {status !== 'TITLE_MENU' && status !== 'STORY_INTRO' ? (
            <div className="hidden lg:flex items-center gap-4 text-xs text-slate-300 font-medium whitespace-nowrap">
              <span className="text-white font-semibold">{currentLevel.title}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-amber-400 font-bold">
                Skor: {stats.score.toLocaleString('id-ID')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                Nyawa: {hud.hp}/{hud.maxHp}
              </span>
              {hud.hasShield && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-400 font-semibold">Perisai Aktif</span>
                </>
              )}
              {hud.ammo > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-400 font-mono-tabular font-semibold">
                    Kapsul: {hud.ammo}
                  </span>
                </>
              )}
            </div>
          ) : (
            <nav className="hidden lg:flex items-center gap-6 text-sm text-slate-300">
              <span className="whitespace-nowrap shrink-0">Materi: Zat Aditif &amp; Adiktif</span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0">SMP Negeri Perisai</span>
            </nav>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              aria-label={muted ? 'Nyalakan Suara' : 'Matikan Suara'}
              title={muted ? 'Nyalakan Suara' : 'Matikan Suara'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (status === 'PLAYING') setStatus('PAUSED');
                setShowDeveloperProfile(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Profil Pengembang</span>
            </button>

            <button
              onClick={() => {
                if (status === 'PLAYING') setStatus('PAUSED');
                setShowLeaderboard(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4" />
              <span>Peringkat</span>
            </button>

            <button
              onClick={() => {
                if (status === 'PLAYING') setStatus('PAUSED');
                setShowEncyclopedia(true);
              }}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Pustaka Zat</span>
            </button>

            {!currentUser ? (
              <button
                onClick={handleSignInGoogle}
                disabled={authLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>{authLoading ? 'Masuk...' : 'Sign In Google'}</span>
              </button>
            ) : (
              status !== 'PLAYING' &&
              status !== 'PAUSED' && (
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{sanitizeNickname(playerName)}</span>
                </button>
              )
            )}

            {(status === 'PLAYING' || status === 'PAUSED') && (
              <button
                onClick={handleTogglePause}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {status === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{status === 'PAUSED' ? 'Lanjut' : 'Jeda'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center">
        {status === 'TITLE_MENU' ? (
          <TitleScreen
            levels={levels}
            selectedLevelIndex={selectedLevelIndex}
            highScore={highScore}
            topPlayers={leaderboardEntries}
            playerName={playerName}
            currentUser={currentUser}
            authLoading={authLoading}
            authError={authError}
            onChangePlayerName={handleNicknameChange}
            onSignInGoogle={handleSignInGoogle}
            onSelectLevel={setSelectedLevelIndex}
            onStartGame={handleStartFromTitle}
            onOpenStoryIntro={() => setStatus('STORY_INTRO')}
            onOpenEncyclopedia={() => setShowEncyclopedia(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenDeveloperProfile={() => setShowDeveloperProfile(true)}
          />
        ) : (
          <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 flex flex-col gap-3">
            {/* Compact Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5" aria-label={`Nyawa ${hud.hp} dari ${hud.maxHp}`}>
                  {hearts.map((alive, idx) => (
                    <Heart
                      key={idx}
                      className={`w-5 h-5 ${
                        alive ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-mono-tabular text-slate-300">
                    {hud.hp}/{hud.maxHp}
                  </span>
                </div>

                {hud.hasShield && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-sky-400">
                    <Shield className="w-4 h-4" />
                    <span>Perisai Vitamin</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400">
                  <Crosshair className="w-4 h-4" />
                  <span className="font-mono-tabular">Kapsul Anti-Adiksi: {hud.ammo}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="font-mono-tabular font-bold text-amber-400">
                  Skor: {stats.score.toLocaleString('id-ID')}
                </span>
                <span className="hidden sm:inline text-slate-400">
                  Kuis: {stats.quizCorrect}/{stats.quizTotal}
                </span>
              </div>
            </div>

            {/* Boss HP Bar */}
            {hud.boss && hud.boss.active && !hud.boss.defeated && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-950/70 border border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-bold text-rose-200">
                  BOS AKHIR: RAJA ZAT ADIKTIF (NIKOTIN, TAR &amp; NARKOTIKA) · FASE {hud.boss.phase}
                </div>
                <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
                  <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden border border-rose-700">
                    <div
                      className="h-full bg-rose-500 transition-all duration-200"
                      style={{ width: `${(hud.boss.hp / hud.boss.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono-tabular font-bold text-rose-100">
                    {hud.boss.hp}/{hud.boss.maxHp}
                  </span>
                </div>
              </div>
            )}

            {/* Game Canvas */}
            <div className="relative">
              <GameCanvas
                key={`${currentLevel.id}-${levelInstanceKey}`}
                level={currentLevel}
                status={status}
                initialHp={carryHp}
                initialShield={carryShield}
                initialAmmo={carryAmmo}
                touchInputRef={touchInputRef}
                onHudUpdate={setHud}
                onScoreDelta={handleScoreDelta}
                onCollectSafe={handleCollectSafe}
                onHitHazard={handleHitHazard}
                onStompEnemy={handleStompEnemy}
                onTriggerQuiz={handleTriggerQuiz}
                onDiscovery={setDiscovery}
                onLevelComplete={(hp, shield, ammo) => {
                  setCarryHp(hp);
                  setCarryShield(shield);
                  setCarryAmmo(ammo);
                  const completedScore = stats.score + 300;
                  syncScoreToLeaderboards(
                    { ...stats, score: completedScore },
                    selectedLevelIndex + 1
                  );
                  setStatus('LEVEL_COMPLETE');
                }}
                onBossDefeated={() => {
                  const victoryStats: SessionStats = {
                    ...stats,
                    score: stats.score + 250,
                    bossDefeated: true,
                  };
                  setStats((prev) => ({ ...prev, bossDefeated: true }));
                  syncScoreToLeaderboards(victoryStats, 3);
                  setStatus('VICTORY');
                }}
                onGameOver={() => {
                  syncScoreToLeaderboards(stats, selectedLevelIndex + 1);
                  setStatus('GAME_OVER');
                }}
                onTogglePause={handleTogglePause}
              />

              {/* Pause Overlay */}
              {status === 'PAUSED' &&
                !showEncyclopedia &&
                !showLeaderboard &&
                !showDeveloperProfile && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-xl flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
                      <h2 className="text-2xl font-extrabold text-white mb-1">Permainan Dijeda</h2>
                      <p className="text-xs text-slate-400 mb-5">{currentLevel.title}</p>
                      <div className="flex flex-col gap-2.5">
                        <button
                          onClick={() => setStatus('PLAYING')}
                          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
                        >
                          Lanjutkan
                        </button>
                        <button
                          onClick={retryCurrentLevel}
                          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Ulangi Level</span>
                        </button>
                        <button
                          onClick={() => setStatus('TITLE_MENU')}
                          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm cursor-pointer"
                        >
                          Kembali ke Menu Utama
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Educational Discovery Strip + Touch/Keyboard Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              <div
                className={`lg:col-span-7 px-4 py-3 rounded-xl border ${
                  discovery
                    ? discovery.isSafe
                      ? 'bg-emerald-950/35 border-emerald-800/70'
                      : 'bg-rose-950/40 border-rose-800/70'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {discovery ? (
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
                      <span
                        className={`font-bold ${
                          discovery.isSafe ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {discovery.title}
                      </span>
                      <span className="text-slate-400 font-mono-tabular">
                        {discovery.categoryLabel}
                        {discovery.pointsDelta !== 0 &&
                          ` · ${discovery.pointsDelta > 0 ? '+' : ''}${discovery.pointsDelta} poin`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{discovery.description}</p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-white">Tujuan Misi: </span>
                    {currentLevel.topicFocus}
                  </div>
                )}
              </div>

              {/* Touch / On-screen Action Controls */}
              <div className="lg:col-span-5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onPointerDown={() => setTouchKey('left', true)}
                    onPointerUp={() => setTouchKey('left', false)}
                    onPointerLeave={() => setTouchKey('left', false)}
                    className="w-12 h-11 rounded-lg bg-slate-800 active:bg-slate-700 border border-slate-700 flex items-center justify-center text-white cursor-pointer touch-none"
                    aria-label="Gerak Kiri"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setTouchKey('right', true)}
                    onPointerUp={() => setTouchKey('right', false)}
                    onPointerLeave={() => setTouchKey('right', false)}
                    className="w-12 h-11 rounded-lg bg-slate-800 active:bg-slate-700 border border-slate-700 flex items-center justify-center text-white cursor-pointer touch-none"
                    aria-label="Gerak Kanan"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="hidden sm:block text-[11px] text-slate-400 text-center leading-tight">
                  <div>A/D · Spasi · F (Tembak)</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onPointerDown={() => setTouchKey('shoot', true)}
                    onPointerUp={() => setTouchKey('shoot', false)}
                    onPointerLeave={() => setTouchKey('shoot', false)}
                    className="px-3 h-11 rounded-lg bg-cyan-600 active:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer touch-none"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span>Tembak</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setTouchKey('jump', true)}
                    onPointerUp={() => setTouchKey('jump', false)}
                    onPointerLeave={() => setTouchKey('jump', false)}
                    className="px-4 h-11 rounded-lg bg-emerald-500 active:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer touch-none"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Lompat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Story Prologue Modal */}
      {status === 'STORY_INTRO' && (
        <StoryIntroModal
          onStartLevel1={() => launchLevel(0, true)}
          onCloseToMenu={() => setStatus('TITLE_MENU')}
        />
      )}

      {/* Between-Level Story Transition + Educational Mini-Game */}
      {status === 'BETWEEN_LEVEL_MINIGAME' && (
        <TransitionMiniGameModal
          completedLevelNumber={selectedLevelIndex + 1}
          onContinueToNextLevel={handleMiniGameFinished}
        />
      )}

      {/* Question Block Quiz Modal */}
      {status === 'QUIZ_MODAL' && activeQuiz && (
        <QuizModal question={activeQuiz} onComplete={handleQuizComplete} />
      )}

      {/* Level Complete / Game Over / Victory Summary */}
      {(status === 'LEVEL_COMPLETE' || status === 'GAME_OVER' || status === 'VICTORY') && (
        <SummaryModal
          mode={status}
          levelTitle={currentLevel.title}
          stats={stats}
          rankPosition={currentRankPosition}
          currentUser={currentUser}
          authLoading={authLoading}
          hasNextLevel={selectedLevelIndex < levels.length - 1}
          onSignInGoogle={handleSignInGoogle}
          onNextLevel={handleAfterLevelComplete}
          onRetryLevel={retryCurrentLevel}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onBackToMenu={() => setStatus('TITLE_MENU')}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          entries={leaderboardEntries}
          localBest={localBest}
          currentUser={currentUser}
          playerName={playerName}
          authLoading={authLoading}
          syncStatus={syncStatus}
          onChangePlayerName={handleNicknameChange}
          onSignInGoogle={handleSignInGoogle}
          onSyncNow={handleSyncNow}
          onSignOut={handleSignOut}
          onClose={() => setShowLeaderboard(false)}
          authError={authError}
        />
      )}

      {/* Developer Profile Modal */}
      {showDeveloperProfile && (
        <DeveloperProfileModal onClose={() => setShowDeveloperProfile(false)} />
      )}

      {/* Substance Encyclopedia Modal */}
      {showEncyclopedia && <EncyclopediaModal onClose={() => setShowEncyclopedia(false)} />}
    </div>
  );
}
