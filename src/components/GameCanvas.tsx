import React, { useEffect, useRef } from 'react';
import { SUBSTANCES } from '../data/substances';
import { renderGame, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from '../game/renderer';
import {
  BossState,
  CollectibleItem,
  DiscoveryBanner,
  EnemyEntity,
  FloatingText,
  GameStatus,
  LevelConfig,
  Particle,
  PlayerState,
  Projectile,
  QuestionBlock,
} from '../types/game';
import { sound } from '../utils/sound';

export interface TouchInputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
}

interface GameCanvasProps {
  level: LevelConfig;
  status: GameStatus;
  initialHp: number;
  initialShield: boolean;
  initialAmmo: number;
  touchInputRef: React.MutableRefObject<TouchInputState>;
  onHudUpdate: (hud: {
    hp: number;
    maxHp: number;
    hasShield: boolean;
    ammo: number;
    boss: { active: boolean; hp: number; maxHp: number; phase: number; defeated: boolean } | null;
  }) => void;
  onScoreDelta: (delta: number) => void;
  onCollectSafe: (substanceId: string) => void;
  onHitHazard: () => void;
  onStompEnemy: () => void;
  onTriggerQuiz: () => void;
  onDiscovery: (banner: DiscoveryBanner) => void;
  onLevelComplete: (remainingHp: number, hasShield: boolean, ammo: number) => void;
  onBossDefeated: (remainingHp: number, hasShield: boolean, ammo: number) => void;
  onGameOver: () => void;
  onTogglePause: () => void;
}

const GRAVITY = 1850;
const MOVE_SPEED = 280;
const JUMP_VEL = -685;
const MAX_FALL = 900;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  status,
  initialHp,
  initialShield,
  initialAmmo,
  touchInputRef,
  onHudUpdate,
  onScoreDelta,
  onCollectSafe,
  onHitHazard,
  onStompEnemy,
  onTriggerQuiz,
  onDiscovery,
  onLevelComplete,
  onBossDefeated,
  onGameOver,
  onTogglePause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Mutable simulation state stored in ref for smooth 60fps loop
  const simRef = useRef<{
    player: PlayerState;
    questionBlocks: QuestionBlock[];
    collectibles: CollectibleItem[];
    enemies: EnemyEntity[];
    boss: BossState | null;
    projectiles: Projectile[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    cameraX: number;
    time: number;
    shootCooldown: number;
    shakeTimer: number;
    shakeDuration: number;
    shakeIntensity: number;
    levelEnded: boolean;
    arenaLocked: boolean;
  } | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const prevJumpPressedRef = useRef(false);
  const prevShootPressedRef = useRef(false);
  const bossVictoryTimeoutRef = useRef<number | null>(null);

  const callbacksRef = useRef({
    onHudUpdate,
    onScoreDelta,
    onCollectSafe,
    onHitHazard,
    onStompEnemy,
    onTriggerQuiz,
    onDiscovery,
    onLevelComplete,
    onBossDefeated,
    onGameOver,
    onTogglePause,
  });
  callbacksRef.current = {
    onHudUpdate,
    onScoreDelta,
    onCollectSafe,
    onHitHazard,
    onStompEnemy,
    onTriggerQuiz,
    onDiscovery,
    onLevelComplete,
    onBossDefeated,
    onGameOver,
    onTogglePause,
  };

  const syncHud = () => {
    const sim = simRef.current;
    if (!sim) return;
    callbacksRef.current.onHudUpdate({
      hp: sim.player.hp,
      maxHp: sim.player.maxHp,
      hasShield: sim.player.hasShield,
      ammo: sim.player.ammo,
      boss: sim.boss
        ? {
            active: sim.boss.active,
            hp: sim.boss.hp,
            maxHp: sim.boss.maxHp,
            phase: sim.boss.phase,
            defeated: sim.boss.defeated,
          }
        : null,
    });
  };

  // Initialize or reset simulation when level changes
  useEffect(() => {
    const clonedBlocks: QuestionBlock[] = level.questionBlocks.map((b) => ({ ...b }));
    const clonedCollectibles: CollectibleItem[] = level.collectibles.map((c) => ({ ...c }));
    const clonedEnemies: EnemyEntity[] = level.enemies.map((e) => ({ ...e }));
    const clonedBoss: BossState | null = level.bossTemplate
      ? { ...level.bossTemplate, active: false, defeated: false }
      : null;

    simRef.current = {
      player: {
        x: 64,
        y: 380,
        w: 34,
        h: 44,
        vx: 0,
        vy: 0,
        facing: 1,
        onGround: false,
        hp: initialHp,
        maxHp: 3,
        hasShield: initialShield,
        ammo: Math.max(initialAmmo, level.id === 3 ? 3 : initialAmmo),
        invincibleTimer: 0,
        walkFrame: 0,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
      },
      questionBlocks: clonedBlocks,
      collectibles: clonedCollectibles,
      enemies: clonedEnemies,
      boss: clonedBoss,
      projectiles: [],
      particles: [],
      floatingTexts: [],
      cameraX: 0,
      time: 0,
      shootCooldown: 0,
      shakeTimer: 0,
      shakeDuration: 0.1,
      shakeIntensity: 0,
      levelEnded: false,
      arenaLocked: false,
    };

    if (bossVictoryTimeoutRef.current !== null) {
      window.clearTimeout(bossVictoryTimeoutRef.current);
      bossVictoryTimeoutRef.current = null;
    }

    callbacksRef.current.onHudUpdate({
      hp: initialHp,
      maxHp: 3,
      hasShield: initialShield,
      ammo: Math.max(initialAmmo, level.id === 3 ? 3 : initialAmmo),
      boss: clonedBoss
        ? {
            active: false,
            hp: clonedBoss.hp,
            maxHp: clonedBoss.maxHp,
            phase: clonedBoss.phase,
            defeated: false,
          }
        : null,
    });
  }, [level, initialHp, initialShield, initialAmmo]);

  // Listen to custom quiz reward events dispatched by parent App
  useEffect(() => {
    const handleQuizReward = (e: Event) => {
      const custom = e as CustomEvent<{ correct: boolean }>;
      const sim = simRef.current;
      if (!sim) return;
      if (custom.detail.correct) {
        sim.player.hasShield = true;
        sim.player.ammo += 2;
        if (sim.player.hp < sim.player.maxHp) {
          sim.player.hp += 1;
        }
        sim.floatingTexts.push({
          x: sim.player.x + sim.player.w / 2,
          y: sim.player.y - 16,
          text: '+300 Kuis Benar! Perisai & Kapsul',
          color: '#34D399',
          life: 1.5,
          maxLife: 1.5,
        });
        syncHud();
      }
    };
    window.addEventListener('quiz-resolved', handleQuizReward);
    return () => window.removeEventListener('quiz-resolved', handleQuizReward);
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        if (statusRef.current === 'PLAYING') {
          e.preventDefault();
        }
      }
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
        if (statusRef.current === 'PLAYING' || statusRef.current === 'PAUSED') {
          callbacksRef.current.onTogglePause();
        }
      }
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const onBlur = () => {
      keysRef.current = {};
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const spawnParticles = (x: number, y: number, color: string, count = 10) => {
      const sim = simRef.current;
      if (!sim) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 170;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          life: 0.45 + Math.random() * 0.25,
          maxLife: 0.7,
          color,
          size: 4 + Math.random() * 4,
          shape: 'square',
        });
      }
    };

    const spawnSafeCollectParticles = (x: number, y: number, substanceColor: string) => {
      const sim = simRef.current;
      if (!sim) return;

      // 1. Expanding halo ring
      sim.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.38,
        maxLife: 0.38,
        color: '#4ADE80',
        size: 10,
        shape: 'ring',
        gravityScale: 0,
      });

      // 2. Burst of spinning golden & tinted stars
      const starColors = ['#FACC15', '#4ADE80', substanceColor, '#FEF08A'];
      for (let i = 0; i < 9; i++) {
        const angle = (Math.PI * 2 * i) / 9 + (Math.random() * 0.35 - 0.17);
        const speed = 95 + Math.random() * 115;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 75,
          life: 0.55 + Math.random() * 0.25,
          maxLife: 0.8,
          color: starColors[i % starColors.length],
          size: 5.5 + Math.random() * 3.5,
          shape: 'star',
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 5),
          gravityScale: 0.35,
        });
      }

      // 3. Rising light sparkles
      for (let i = 0; i < 10; i++) {
        const ox = (Math.random() - 0.5) * 28;
        const oy = (Math.random() - 0.5) * 22;
        sim.particles.push({
          x: x + ox,
          y: y + oy,
          vx: (Math.random() - 0.5) * 55,
          vy: -65 - Math.random() * 90,
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8,
          color: i % 2 === 0 ? '#FFFFFF' : '#A7F3D0',
          size: 5 + Math.random() * 4,
          shape: 'sparkle',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 3,
          gravityScale: -0.1,
        });
      }
    };

    const triggerShake = (intensity: number, duration: number) => {
      const sim = simRef.current;
      if (!sim) return;
      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;
      if (intensity >= sim.shakeIntensity || sim.shakeTimer <= 0) {
        sim.shakeIntensity = intensity;
      }
      sim.shakeDuration = Math.max(duration, 0.08);
      sim.shakeTimer = Math.max(sim.shakeTimer, duration);
    };

    const damagePlayer = (reasonLabel: string, detailText: string) => {
      const sim = simRef.current;
      if (!sim || sim.player.invincibleTimer > 0 || sim.levelEnded) return;

      if (sim.player.hasShield) {
        sim.player.hasShield = false;
        sim.player.invincibleTimer = 1.4;
        sound.bumpBlock();
        spawnParticles(sim.player.x + 17, sim.player.y + 22, '#38BDF8', 14);
        sim.floatingTexts.push({
          x: sim.player.x + 17,
          y: sim.player.y - 10,
          text: 'Perisai Vitamin Pecah!',
          color: '#38BDF8',
          life: 1.2,
          maxLife: 1.2,
        });
        syncHud();
        return;
      }

      sound.hurt();
      sim.player.hp = Math.max(0, sim.player.hp - 1);
      sim.player.invincibleTimer = 1.6;
      sim.player.vy = -380;
      callbacksRef.current.onHitHazard();
      callbacksRef.current.onScoreDelta(-50);

      spawnParticles(sim.player.x + 17, sim.player.y + 22, '#EF4444', 16);
      sim.floatingTexts.push({
        x: sim.player.x + 17,
        y: sim.player.y - 14,
        text: `-1 Hati · ${reasonLabel}`,
        color: '#FCA5A5',
        life: 1.3,
        maxLife: 1.3,
      });
      callbacksRef.current.onDiscovery({
        id: `${Date.now()}`,
        title: `Waspada: ${reasonLabel}`,
        categoryLabel: 'Zat Berbahaya',
        description: detailText,
        isSafe: false,
        pointsDelta: -50,
      });

      syncHud();

      if (sim.player.hp <= 0) {
        sim.levelEnded = true;
        callbacksRef.current.onGameOver();
      }
    };

    const hitBoss = (sim: NonNullable<typeof simRef.current>, source: 'stomp' | 'ammo') => {
      const boss = sim.boss;
      if (!boss || boss.defeated || boss.hitFlash > 0) return;

      boss.hp = Math.max(0, boss.hp - 1);
      boss.hitFlash = 0.35;
      sound.bossHit();
      callbacksRef.current.onScoreDelta(250);
      const bx = boss.x + boss.w / 2;
      const by = boss.y + boss.h / 2;
      spawnParticles(bx, by, '#FACC15', 18);
      spawnParticles(bx, by, source === 'ammo' ? '#22D3EE' : '#FFFFFF', 12);
      triggerShake(source === 'ammo' ? 9.5 : 8, 0.25);

      const bossFacts = [
        'Nikotin memicu kecanduan dopamin semu!',
        'Tar mengendap merusak jaringan paru-paru!',
        'Alkohol menekan kerja sistem saraf pusat!',
        'Narkotika merusak organ tubuh & masa depan!',
        'Olahraga & ilmu pengetahuan melawan adiksi!',
        'Zat Adiktif berhasil ditaklukkan!',
      ];
      const fact = bossFacts[Math.min(bossFacts.length - 1, boss.maxHp - boss.hp - 1)];

      sim.floatingTexts.push({
        x: boss.x + boss.w / 2,
        y: boss.y - 24,
        text: source === 'stomp' ? 'Injakan Tepat! -1 HP Bos' : 'Kapsul Edukasi! -1 HP Bos',
        subtext: fact,
        color: '#FDE047',
        life: 1.6,
        maxLife: 1.6,
      });

      callbacksRef.current.onDiscovery({
        id: `boss-${Date.now()}`,
        title: 'Serangan Tepat pada Raja Zat Adiktif!',
        categoryLabel: `HP Bos Tersisa ${boss.hp}/${boss.maxHp}`,
        description: fact,
        isSafe: true,
        pointsDelta: 250,
      });

      if (boss.hp <= 4 && boss.hp > 2) boss.phase = 2;
      if (boss.hp <= 2) boss.phase = 3;

      if (boss.hp <= 0) {
        boss.defeated = true;
        sim.levelEnded = true;
        sim.projectiles = [];
        sound.victory();
        triggerShake(14, 0.48);
        spawnParticles(bx, by, '#10B981', 28);
        spawnParticles(bx, by - 16, '#FACC15', 22);
        spawnParticles(bx, by + 16, '#38BDF8', 16);
        syncHud();
        bossVictoryTimeoutRef.current = window.setTimeout(() => {
          bossVictoryTimeoutRef.current = null;
          callbacksRef.current.onBossDefeated(sim.player.hp, sim.player.hasShield, sim.player.ammo);
        }, 650);
      } else {
        boss.state = 'HURT';
        boss.stateTimer = 0.6;
        syncHud();
      }
    };

    const step = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.033);

      const sim = simRef.current;
      const canvas = canvasRef.current;

      if (sim && canvas) {
        if (statusRef.current === 'PLAYING' && !sim.levelEnded) {
          sim.time += dt;
          const p = sim.player;
          const keys = keysRef.current;
          const touch = touchInputRef.current;

          const moveLeft = keys['ArrowLeft'] || keys['KeyA'] || touch.left;
          const moveRight = keys['ArrowRight'] || keys['KeyD'] || touch.right;
          const jumpHeld = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || touch.jump;
          const shootHeld = keys['KeyF'] || keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyZ'] || touch.shoot;

          const jumpJustPressed = jumpHeld && !prevJumpPressedRef.current;
          const shootJustPressed = shootHeld && !prevShootPressedRef.current;
          prevJumpPressedRef.current = jumpHeld;
          prevShootPressedRef.current = shootHeld;

          if (p.invincibleTimer > 0) p.invincibleTimer = Math.max(0, p.invincibleTimer - dt);
          if (sim.shootCooldown > 0) sim.shootCooldown = Math.max(0, sim.shootCooldown - dt);

          // Horizontal Movement
          if (moveLeft && !moveRight) {
            p.vx = -MOVE_SPEED;
            p.facing = -1;
            p.walkFrame += dt;
          } else if (moveRight && !moveLeft) {
            p.vx = MOVE_SPEED;
            p.facing = 1;
            p.walkFrame += dt;
          } else {
            p.vx *= 0.72;
            if (Math.abs(p.vx) < 8) p.vx = 0;
          }

          // Coyote & Jump Buffer
          if (p.onGround) {
            p.coyoteTimer = 0.1;
          } else {
            p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
          }
          if (jumpJustPressed) {
            p.jumpBufferTimer = 0.11;
          } else {
            p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
          }

          if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
            p.vy = JUMP_VEL;
            p.onGround = false;
            p.coyoteTimer = 0;
            p.jumpBufferTimer = 0;
            sound.jump();
          }

          // Variable jump height
          if (!jumpHeld && p.vy < -240) {
            p.vy += GRAVITY * dt * 1.4;
          }

          // Shoot Anti-Addiction Capsule
          if (shootJustPressed && p.ammo > 0 && sim.shootCooldown <= 0) {
            p.ammo -= 1;
            sim.shootCooldown = 0.28;
            sound.shoot();
            sim.projectiles.push({
              id: `p-${Date.now()}-${Math.random()}`,
              x: p.x + (p.facing === 1 ? p.w + 4 : -4),
              y: p.y + 18,
              vx: p.facing * 520,
              vy: 0,
              r: 8,
              fromPlayer: true,
              label: 'Edukasi',
              color: '#06B6D4',
            });
            syncHud();
          }

          // Gravity
          p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);

          // Solid colliders (platforms + question blocks)
          const solids: Array<{
            x: number;
            y: number;
            w: number;
            h: number;
            qbRef?: QuestionBlock;
          }> = [
            ...level.platforms,
            ...sim.questionBlocks.map((qb) => ({
              x: qb.x,
              y: qb.y,
              w: qb.w,
              h: qb.h,
              qbRef: qb,
            })),
          ];

          // Move X
          p.x += p.vx * dt;
          const minWorldX = sim.arenaLocked && level.bossArenaX ? level.bossArenaX + 6 : 0;
          if (p.x < minWorldX) {
            p.x = minWorldX;
            p.vx = 0;
          }
          if (p.x + p.w > level.worldWidth - 10) {
            p.x = level.worldWidth - 10 - p.w;
            p.vx = 0;
          }

          for (const s of solids) {
            if (
              p.x < s.x + s.w &&
              p.x + p.w > s.x &&
              p.y + 4 < s.y + s.h &&
              p.y + p.h - 4 > s.y
            ) {
              if (p.vx > 0) p.x = s.x - p.w;
              else if (p.vx < 0) p.x = s.x + s.w;
            }
          }

          // Move Y
          p.y += p.vy * dt;
          p.onGround = false;

          for (const s of solids) {
            if (
              p.x + 3 < s.x + s.w &&
              p.x + p.w - 3 > s.x &&
              p.y < s.y + s.h &&
              p.y + p.h > s.y
            ) {
              if (p.vy > 0) {
                p.y = s.y - p.h;
                p.vy = 0;
                p.onGround = true;
              } else if (p.vy < 0) {
                p.y = s.y + s.h;
                p.vy = 40;
                // Check if Question Block was bumped from below!
                if (s.qbRef) {
                  const qb = s.qbRef;
                  qb.bumpOffset = 9;
                  sound.bumpBlock();
                  if (!qb.used) {
                    qb.used = true;
                    if (qb.reward === 'quiz') {
                      callbacksRef.current.onTriggerQuiz();
                    } else if (qb.reward === 'vitamin') {
                      p.hasShield = true;
                      sound.powerUp();
                      callbacksRef.current.onScoreDelta(150);
                      spawnSafeCollectParticles(qb.x + 19, qb.y - 6, '#38BDF8');
                      sim.floatingTexts.push({
                        x: qb.x + 19,
                        y: qb.y - 14,
                        text: '+Perisai Vitamin E!',
                        color: '#38BDF8',
                        life: 1.3,
                        maxLife: 1.3,
                      });
                      callbacksRef.current.onDiscovery({
                        id: `qb-${Date.now()}`,
                        title: 'Perisai Vitamin & Antioksidan',
                        categoryLabel: 'Pelindung Alami',
                        description: 'Vitamin E & C melindungi sel tubuh dan menahan 1x serangan zat berbahaya.',
                        isSafe: true,
                        pointsDelta: 150,
                      });
                      syncHud();
                    } else if (qb.reward === 'ammo') {
                      p.ammo += 3;
                      sound.powerUp();
                      callbacksRef.current.onScoreDelta(100);
                      spawnSafeCollectParticles(qb.x + 19, qb.y - 6, '#22D3EE');
                      if (level.id === 3) {
                        qb.respawnTimer = 6.5; // Regenerates in Boss Arena!
                      }
                      sim.floatingTexts.push({
                        x: qb.x + 19,
                        y: qb.y - 14,
                        text: '+3 Kapsul Anti-Adiksi!',
                        color: '#22D3EE',
                        life: 1.2,
                        maxLife: 1.2,
                      });
                      syncHud();
                    }
                  }
                }
              }
            }
          }

          // Question block bounce & boss respawn timers
          for (const qb of sim.questionBlocks) {
            if (qb.bumpOffset > 0) qb.bumpOffset = Math.max(0, qb.bumpOffset - dt * 45);
            if (qb.used && qb.respawnTimer !== undefined) {
              qb.respawnTimer -= dt;
              if (qb.respawnTimer <= 0) {
                qb.used = false;
                qb.respawnTimer = undefined;
              }
            }
          }

          // Pit fall check
          if (p.y > VIEWPORT_HEIGHT + 40) {
            if (p.hp > 1) {
              p.hp -= 1;
              p.hasShield = false;
              p.invincibleTimer = 1.6;
              // Respawn safely on nearest previous ground
              const safeGround =
                level.platforms.find((pl) => pl.kind === 'ground' || pl.kind === 'stone') ??
                level.platforms[0];
              const fallbackPlat =
                [...level.platforms]
                  .reverse()
                  .find((pl) => (pl.kind === 'ground' || pl.kind === 'stone') && pl.x < p.x) ??
                safeGround;
              p.x = Math.max(sim.arenaLocked && level.bossArenaX ? level.bossArenaX + 40 : 60, fallbackPlat.x + 40);
              p.y = fallbackPlat.y - p.h - 20;
              p.vx = 0;
              p.vy = 0;
              sound.hurt();
              callbacksRef.current.onHitHazard();
              syncHud();
            } else {
              p.hp = 0;
              sim.levelEnded = true;
              sound.hurt();
              syncHud();
              callbacksRef.current.onGameOver();
            }
          }

          // Collect safe items
          for (const item of sim.collectibles) {
            if (item.collected) continue;
            if (
              p.x < item.x + item.w &&
              p.x + p.w > item.x &&
              p.y < item.y + item.h &&
              p.y + p.h > item.y
            ) {
              item.collected = true;
              const sub = SUBSTANCES[item.substanceId];
              if (sub) {
                if (item.substanceId === 'vitamin_pelindung') {
                  p.hasShield = true;
                  sound.powerUp();
                } else if (item.isAmmo || item.substanceId === 'kapsul_edukasi') {
                  p.ammo += 2;
                  sound.powerUp();
                } else {
                  sound.collectSafe();
                }
                callbacksRef.current.onScoreDelta(sub.points);
                callbacksRef.current.onCollectSafe(sub.id);
                spawnSafeCollectParticles(item.x + 16, item.y + 16, sub.color);
                sim.floatingTexts.push({
                  x: item.x + 16,
                  y: item.y - 8,
                  text: `+${sub.points} ${sub.shortLabel}`,
                  subtext: sub.role,
                  color: '#4ADE80',
                  life: 1.2,
                  maxLife: 1.2,
                });
                callbacksRef.current.onDiscovery({
                  id: `${item.id}-${Date.now()}`,
                  title: sub.name,
                  categoryLabel: `${sub.role} · Aman`,
                  description: sub.impact,
                  isSafe: true,
                  pointsDelta: sub.points,
                });
                syncHud();
              }
            }
          }

          // Update & collide with harmful enemies
          for (const enemy of sim.enemies) {
            if (enemy.defeated) continue;
            if (enemy.patrolType === 'float') {
              enemy.y = enemy.baseY + Math.sin(sim.time * 3 + enemy.animPhase) * 28;
            } else {
              enemy.x += enemy.vx * dt;
              if (enemy.x <= enemy.minX) {
                enemy.x = enemy.minX;
                enemy.vx = Math.abs(enemy.vx);
              } else if (enemy.x + enemy.w >= enemy.maxX) {
                enemy.x = enemy.maxX - enemy.w;
                enemy.vx = -Math.abs(enemy.vx);
              }
            }

            if (
              p.x + 4 < enemy.x + enemy.w &&
              p.x + p.w - 4 > enemy.x &&
              p.y + 4 < enemy.y + enemy.h &&
              p.y + p.h > enemy.y
            ) {
              // Stomp check: player is falling and feet were near top of enemy
              const isStomp = p.vy > 0 && p.y + p.h - p.vy * dt <= enemy.y + 16;
              if (isStomp && enemy.canStomp) {
                enemy.defeated = true;
                p.vy = -440;
                sound.stomp();
                callbacksRef.current.onScoreDelta(120);
                callbacksRef.current.onStompEnemy();
                const sub = SUBSTANCES[enemy.substanceId];
                spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#F43F5E', 14);
                sim.floatingTexts.push({
                  x: enemy.x + enemy.w / 2,
                  y: enemy.y - 10,
                  text: `+120 Singkirkan ${sub?.shortLabel ?? 'Zat Berbahaya'}!`,
                  color: '#FDE047',
                  life: 1.2,
                  maxLife: 1.2,
                });
              } else {
                const sub = SUBSTANCES[enemy.substanceId];
                damagePlayer(
                  sub?.name ?? 'Zat Berbahaya',
                  sub?.impact ?? 'Zat berbahaya merusak organ tubuh!'
                );
              }
            }
          }

          // Boss Arena Activation & AI
          if (sim.boss && !sim.boss.defeated && level.bossArenaX) {
            const boss = sim.boss;
            if (!boss.active && p.x >= level.bossArenaX + 20) {
              boss.active = true;
              sim.arenaLocked = true;
              sound.bossHit();
              triggerShake(6.5, 0.28);
              spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#A855F7', 20);
              callbacksRef.current.onDiscovery({
                id: 'boss-intro',
                title: 'Bos Akhir: Raja Zat Adiktif (Nikotin, Tar & Narkotika)',
                categoryLabel: 'Pertarungan Terakhir',
                description:
                  'Lompati serangan asapnya! Injak kepalanya saat kelelahan atau tembak dengan Kapsul Anti-Adiksi (F / Shift).',
                isSafe: false,
                pointsDelta: 0,
              });
              syncHud();
            }

            if (boss.active) {
              if (boss.hitFlash > 0) boss.hitFlash = Math.max(0, boss.hitFlash - dt);
              boss.stateTimer -= dt;
              boss.attackCooldown -= dt;

              const speedMult = boss.phase === 3 ? 1.45 : boss.phase === 2 ? 1.22 : 1.0;

              if (boss.state === 'PATROL') {
                boss.x += boss.vx * speedMult * dt;
                if (boss.x < level.bossArenaX + 70) {
                  boss.x = level.bossArenaX + 70;
                  boss.vx = Math.abs(boss.vx);
                } else if (boss.x + boss.w > level.worldWidth - 70) {
                  boss.x = level.worldWidth - 70 - boss.w;
                  boss.vx = -Math.abs(boss.vx);
                }

                // Shoot toxic projectiles toward player
                if (boss.attackCooldown <= 0) {
                  boss.attackCooldown = boss.phase === 3 ? 1.35 : 1.9;
                  const dir = p.x < boss.x ? -1 : 1;
                  const hazards = ['Nikotin', 'Tar', 'Alkohol'];
                  const label = hazards[Math.floor(Math.random() * hazards.length)];
                  const muzzleX = boss.x + boss.w / 2;
                  const muzzleY = boss.y + 38;
                  sim.projectiles.push({
                    id: `bp-${Date.now()}-${Math.random()}`,
                    x: muzzleX,
                    y: muzzleY,
                    vx: dir * (220 * speedMult),
                    vy: -40,
                    r: 11,
                    fromPlayer: false,
                    label,
                    color: '#DC2626',
                  });
                  spawnParticles(muzzleX, muzzleY, '#EF4444', 10);
                  spawnParticles(muzzleX, muzzleY, '#A855F7', 6);
                  triggerShake(4.5, 0.14);

                  if (boss.phase >= 2) {
                    // Rain an extra hazard droplet from above
                    const rainX = level.bossArenaX + 120 + Math.random() * 720;
                    sim.projectiles.push({
                      id: `bp-rain-${Date.now()}-${Math.random()}`,
                      x: rainX,
                      y: 40,
                      vx: 0,
                      vy: 210,
                      r: 10,
                      fromPlayer: false,
                      label: 'Formalin',
                      color: '#A855F7',
                    });
                    spawnParticles(rainX, 44, '#C084FC', 8);
                  }
                }

                if (boss.stateTimer <= 0) {
                  boss.state = 'JUMPING';
                  boss.vy = -560;
                  boss.vx = (p.x < boss.x ? -1 : 1) * 165 * speedMult;
                  boss.stateTimer = 1.8;
                }
              } else if (boss.state === 'JUMPING') {
                boss.vy += GRAVITY * 0.75 * dt;
                boss.x += boss.vx * dt;
                boss.y += boss.vy * dt;
                if (boss.x < level.bossArenaX + 70) boss.x = level.bossArenaX + 70;
                if (boss.x + boss.w > level.worldWidth - 70) {
                  boss.x = level.worldWidth - 70 - boss.w;
                }
                if (boss.y + boss.h >= 468) {
                  boss.y = 468 - boss.h;
                  boss.vy = 0;
                  boss.state = 'VULNERABLE';
                  boss.stateTimer = 2.4; // Window for player to stomp!
                  // Ground slam impact particles & screen shake
                  triggerShake(8.5, 0.25);
                  spawnParticles(boss.x + 14, 464, '#DC2626', 12);
                  spawnParticles(boss.x + boss.w - 14, 464, '#94A3B8', 12);
                }
              } else if (boss.state === 'VULNERABLE') {
                // Rests briefly so player can safely jump-stomp
                if (boss.stateTimer <= 0) {
                  boss.state = 'PATROL';
                  boss.vx = (p.x < boss.x ? -1 : 1) * 115;
                  boss.stateTimer = 3.2;
                }
              } else if (boss.state === 'HURT') {
                if (boss.stateTimer <= 0) {
                  boss.state = 'PATROL';
                  boss.vx = (p.x < boss.x ? -1 : 1) * 125;
                  boss.stateTimer = 2.6;
                }
              }

              // Boss collision with Player
              if (
                p.x + 6 < boss.x + boss.w &&
                p.x + p.w - 6 > boss.x &&
                p.y + 4 < boss.y + boss.h &&
                p.y + p.h > boss.y
              ) {
                const isStomp = p.vy > 0 && p.y + p.h - p.vy * dt <= boss.y + 24;
                if (isStomp) {
                  p.vy = -520;
                  hitBoss(sim, 'stomp');
                } else {
                  damagePlayer(
                    'Raja Zat Adiktif',
                    'Tar, Nikotin, dan Narkotika menyebabkan kecanduan fatal serta kerusakan organ!'
                  );
                }
              }
            }
          }

          // Update Projectiles
          const survivingProjectiles: Projectile[] = [];
          for (const proj of sim.projectiles) {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;

            // Out of bounds check
            if (
              proj.x < sim.cameraX - 100 ||
              proj.x > sim.cameraX + VIEWPORT_WIDTH + 120 ||
              proj.y > VIEWPORT_HEIGHT + 40
            ) {
              continue;
            }

            if (proj.fromPlayer) {
              let consumed = false;
              // Hit regular enemies
              for (const enemy of sim.enemies) {
                if (enemy.defeated) continue;
                if (
                  proj.x + proj.r > enemy.x &&
                  proj.x - proj.r < enemy.x + enemy.w &&
                  proj.y + proj.r > enemy.y &&
                  proj.y - proj.r < enemy.y + enemy.h
                ) {
                  enemy.defeated = true;
                  consumed = true;
                  sound.stomp();
                  callbacksRef.current.onScoreDelta(120);
                  callbacksRef.current.onStompEnemy();
                  spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#06B6D4', 12);
                  break;
                }
              }
              // Hit Boss
              if (!consumed && sim.boss && sim.boss.active && !sim.boss.defeated) {
                const b = sim.boss;
                if (
                  proj.x + proj.r > b.x &&
                  proj.x - proj.r < b.x + b.w &&
                  proj.y + proj.r > b.y &&
                  proj.y - proj.r < b.y + b.h
                ) {
                  consumed = true;
                  hitBoss(sim, 'ammo');
                }
              }
              if (!consumed) survivingProjectiles.push(proj);
            } else {
              // Enemy/Boss projectile hitting player
              if (
                proj.x + proj.r > p.x + 4 &&
                proj.x - proj.r < p.x + p.w - 4 &&
                proj.y + proj.r > p.y + 4 &&
                proj.y - proj.r < p.y + p.h - 4
              ) {
                damagePlayer(
                  proj.label,
                  `${proj.label} adalah zat berbahaya yang harus dihindari agar tubuh tetap sehat!`
                );
                continue;
              }
              survivingProjectiles.push(proj);
            }
          }
          sim.projectiles = survivingProjectiles;

          // Goal Flagpole check (Levels 1 & 2)
          if (level.goalX !== null && p.x + p.w >= level.goalX - 10) {
            sim.levelEnded = true;
            sound.levelClear();
            callbacksRef.current.onScoreDelta(300);
            callbacksRef.current.onLevelComplete(p.hp, p.hasShield, p.ammo);
          }

          // Camera tracking
          const targetCamX = sim.arenaLocked && level.bossArenaX
            ? level.bossArenaX
            : Math.max(0, Math.min(level.worldWidth - VIEWPORT_WIDTH, p.x - VIEWPORT_WIDTH * 0.36));
          sim.cameraX += (targetCamX - sim.cameraX) * Math.min(1, dt * 8);
        }

        // Always update particles, floating text, and screen shake even during boss defeat celebration
        if (statusRef.current === 'PLAYING') {
          if (sim.shakeTimer > 0) {
            sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
          }
          sim.particles = sim.particles.filter((pt) => {
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vy += 420 * (pt.gravityScale ?? 1) * dt;
            if (pt.vRot && pt.rotation !== undefined) {
              pt.rotation += pt.vRot * dt;
            }
            pt.life -= dt;
            return pt.life > 0;
          });
          sim.floatingTexts = sim.floatingTexts.filter((ft) => {
            ft.y -= 28 * dt;
            ft.life -= dt;
            return ft.life > 0;
          });
        }

        const shakeProgress =
          sim.shakeTimer > 0 && sim.shakeDuration > 0 ? sim.shakeTimer / sim.shakeDuration : 0;
        const currentAmp = sim.shakeIntensity * shakeProgress;
        const shakeX = currentAmp > 0.2 ? (Math.random() * 2 - 1) * currentAmp : 0;
        const shakeY = currentAmp > 0.2 ? (Math.random() * 2 - 1) * currentAmp : 0;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGame({
            ctx,
            level,
            player: sim.player,
            cameraX: sim.cameraX,
            time: sim.time,
            shakeX,
            shakeY,
            questionBlocks: sim.questionBlocks,
            collectibles: sim.collectibles,
            enemies: sim.enemies,
            boss: sim.boss,
            projectiles: sim.projectiles,
            particles: sim.particles,
            floatingTexts: sim.floatingTexts,
          });
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      if (bossVictoryTimeoutRef.current !== null) {
        window.clearTimeout(bossVictoryTimeoutRef.current);
        bossVictoryTimeoutRef.current = null;
      }
    };
  }, [level]);

  return (
    <canvas
      ref={canvasRef}
      width={VIEWPORT_WIDTH}
      height={VIEWPORT_HEIGHT}
      className="w-full h-auto block rounded-xl bg-slate-950 shadow-2xl border border-slate-800"
      style={{ aspectRatio: `${VIEWPORT_WIDTH} / ${VIEWPORT_HEIGHT}` }}
    />
  );
};
