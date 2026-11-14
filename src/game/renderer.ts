import { SUBSTANCES } from '../data/substances';
import {
  BossState,
  CollectibleItem,
  EnemyEntity,
  FloatingText,
  LevelConfig,
  Particle,
  PlayerState,
  Projectile,
  QuestionBlock,
  TilePlatform,
} from '../types/game';

export const VIEWPORT_WIDTH = 960;
export const VIEWPORT_HEIGHT = 540;

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  level: LevelConfig;
  player: PlayerState;
  cameraX: number;
  time: number;
  shakeX?: number;
  shakeY?: number;
  questionBlocks: QuestionBlock[];
  collectibles: CollectibleItem[];
  enemies: EnemyEntity[];
  boss: BossState | null;
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
}

export function renderGame(rc: RenderContext) {
  const { ctx, level, cameraX, time, shakeX = 0, shakeY = 0 } = rc;
  ctx.save();
  ctx.fillStyle = '#090D16';
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  // Screen shake transform
  if (shakeX !== 0 || shakeY !== 0) {
    ctx.translate(shakeX, shakeY);
  }

  // 1. Sky & Parallax Background
  drawBackground(ctx, level, cameraX, time);

  // World space transform
  ctx.translate(-Math.floor(cameraX), 0);

  // 2. Boss Arena Lock Gate (if Level 3)
  if (level.bossArenaX) {
    drawArenaGate(ctx, level.bossArenaX, rc.boss?.active ?? false);
  }

  // 3. Goal Flagpole (Levels 1 & 2)
  if (level.goalX !== null) {
    drawGoalFlagpole(ctx, level.goalX, 468, time);
  }

  // 4. Platforms
  for (const plat of level.platforms) {
    if (plat.x + plat.w < cameraX - 60 || plat.x > cameraX + VIEWPORT_WIDTH + 60) continue;
    drawPlatform(ctx, plat, level.theme);
  }

  // 5. Question Blocks
  for (const qb of rc.questionBlocks) {
    if (qb.x + qb.w < cameraX - 60 || qb.x > cameraX + VIEWPORT_WIDTH + 60) continue;
    drawQuestionBlock(ctx, qb, time);
  }

  // 6. Safe Collectibles
  for (const item of rc.collectibles) {
    if (item.collected) continue;
    if (item.x + item.w < cameraX - 60 || item.x > cameraX + VIEWPORT_WIDTH + 60) continue;
    drawCollectible(ctx, item, time);
  }

  // 7. Harmful Enemies
  for (const enemy of rc.enemies) {
    if (enemy.defeated) continue;
    if (enemy.x + enemy.w < cameraX - 80 || enemy.x > cameraX + VIEWPORT_WIDTH + 80) continue;
    drawEnemy(ctx, enemy, time);
  }

  // 8. Final Boss
  if (rc.boss && !rc.boss.defeated) {
    drawBoss(ctx, rc.boss, time);
  }

  // 9. Player
  drawPlayer(ctx, rc.player, time);

  // 10. Projectiles
  for (const proj of rc.projectiles) {
    drawProjectile(ctx, proj);
  }

  // 11. Particles (squares, starbursts, light sparkles, expanding halo rings)
  for (const p of rc.particles) {
    const progress = 1 - Math.max(0, p.life / p.maxLife);
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.shape === 'ring') {
      const radius = p.size + progress * 26;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, 3 * (1 - progress));
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'star') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0);
      const outer = p.size;
      const inner = p.size * 0.44;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      // Bright star center
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, outer * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'sparkle') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0);
      const flare = p.size * (0.75 + Math.sin(progress * Math.PI * 3) * 0.25);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -flare);
      ctx.quadraticCurveTo(flare * 0.2, -flare * 0.2, flare, 0);
      ctx.quadraticCurveTo(flare * 0.2, flare * 0.2, 0, flare);
      ctx.quadraticCurveTo(-flare * 0.2, flare * 0.2, -flare, 0);
      ctx.quadraticCurveTo(-flare * 0.2, -flare * 0.2, 0, -flare);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, flare * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 12. Floating Educational Texts
  for (const ft of rc.floatingTexts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
    ctx.globalAlpha = alpha;
    ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    if (ft.subtext) {
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(ft.subtext, ft.x, ft.y + 16);
    }
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig,
  cameraX: number,
  time: number
) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT);

  if (level.theme === 'meadow') {
    grad.addColorStop(0, '#0EA5E9');
    grad.addColorStop(0.7, '#7DD3FC');
    grad.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Sun
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(820, 86, 38, 0, Math.PI * 2);
    ctx.fill();

    // Parallax Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 260 - cameraX * 0.25 + time * 8) % (VIEWPORT_WIDTH + 220)) - 110;
      const cy = 70 + (i % 3) * 42;
      drawCloud(ctx, cx, cy);
    }

    // Distant Hills
    ctx.fillStyle = '#22C55E';
    for (let i = -1; i < 6; i++) {
      const hx = i * 280 - ((cameraX * 0.4) % 280);
      ctx.beginPath();
      ctx.arc(hx + 140, 470, 155, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#16A34A';
    for (let i = -1; i < 6; i++) {
      const hx = i * 340 - ((cameraX * 0.55) % 340) + 80;
      ctx.beginPath();
      ctx.arc(hx + 110, 470, 105, Math.PI, 0);
      ctx.fill();
    }
  } else if (level.theme === 'city') {
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(0.55, '#C2410C');
    grad.addColorStop(1, '#FDBA74');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // City / Lab skyline parallax
    ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
    for (let i = 0; i < 10; i++) {
      const bx = i * 140 - ((cameraX * 0.35) % 140);
      const bh = 110 + ((i * 53) % 130);
      ctx.fillRect(bx, 468 - bh, 96, bh);
      // Lit lab windows
      ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
      for (let wy = 468 - bh + 18; wy < 450; wy += 26) {
        ctx.fillRect(bx + 16, wy, 14, 14);
        ctx.fillRect(bx + 54, wy, 14, 14);
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
    }
  } else {
    // Castle theme
    grad.addColorStop(0, '#090D16');
    grad.addColorStop(0.65, '#1E1B4B');
    grad.addColorStop(1, '#4C0519');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Castle pillars & toxic glow
    ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
    for (let i = 0; i < 8; i++) {
      const px = i * 180 - ((cameraX * 0.3) % 180);
      ctx.fillRect(px, 110, 52, 360);
      // Gothic arch window
      ctx.fillStyle = 'rgba(225, 29, 72, 0.22)';
      ctx.beginPath();
      ctx.arc(px + 26, 200, 14, Math.PI, 0);
      ctx.lineTo(px + 40, 240);
      ctx.lineTo(px + 12, 240);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
    }
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.arc(x + 22, y - 8, 24, 0, Math.PI * 2);
  ctx.arc(x + 46, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawArenaGate(ctx: CanvasRenderingContext2D, arenaX: number, locked: boolean) {
  ctx.save();
  ctx.strokeStyle = locked ? '#EF4444' : '#F59E0B';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(arenaX, 90);
  ctx.lineTo(arenaX, 468);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = locked ? '#DC2626' : '#D97706';
  ctx.fillRect(arenaX - 58, 56, 116, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(locked ? 'ARENA BOS TERKUNCI' : 'ARENA BOS AKHIR', arenaX, 72);
  ctx.restore();
}

function drawGoalFlagpole(ctx: CanvasRenderingContext2D, x: number, groundY: number, time: number) {
  // Base block
  ctx.fillStyle = '#475569';
  ctx.fillRect(x - 16, groundY - 24, 32, 24);

  // Pole
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(x - 3, groundY - 240, 6, 216);

  // Gold orb top
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(x, groundY - 244, 10, 0, Math.PI * 2);
  ctx.fill();

  // Waving Green Safe Flag
  const wave = Math.sin(time * 5) * 4;
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.moveTo(x + 3, groundY - 234);
  ctx.lineTo(x + 68, groundY - 214 + wave);
  ctx.lineTo(x + 3, groundY - 190);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('AMAN!', x + 10, groundY - 208 + wave * 0.4);
}

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  plat: TilePlatform,
  theme: LevelConfig['theme']
) {
  const { x, y, w, h, kind } = plat;

  if (kind === 'ground') {
    const soilColor = theme === 'meadow' ? '#92400E' : '#475569';
    const topColor = theme === 'meadow' ? '#16A34A' : '#334155';
    ctx.fillStyle = soilColor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = topColor;
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, y, w, 3);
    // Tile seams
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let tx = x; tx < x + w; tx += 36) {
      ctx.beginPath();
      ctx.moveTo(tx, y + 14);
      ctx.lineTo(tx, y + h);
      ctx.stroke();
    }
  } else if (kind === 'brick') {
    ctx.fillStyle = theme === 'meadow' ? '#B45309' : '#9A3412';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    for (let bx = x + 32; bx < x + w; bx += 32) {
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx, y + h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 2, y + 2, w - 4, 4);
  } else if (kind === 'pipe') {
    const pipeMain = theme === 'meadow' ? '#16A34A' : '#0D9488';
    const pipeLight = theme === 'meadow' ? '#4ADE80' : '#5EEAD4';
    const pipeDark = theme === 'meadow' ? '#14532D' : '#134E4A';
    // Body
    ctx.fillStyle = pipeMain;
    ctx.fillRect(x + 4, y + 18, w - 8, h - 18);
    ctx.fillStyle = pipeLight;
    ctx.fillRect(x + 10, y + 18, 8, h - 18);
    ctx.strokeStyle = pipeDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 18, w - 8, h - 18);
    // Rim
    ctx.fillStyle = pipeMain;
    ctx.fillRect(x, y, w, 20);
    ctx.fillStyle = pipeLight;
    ctx.fillRect(x + 6, y + 2, 10, 16);
    ctx.strokeRect(x, y, w, 20);
  } else if (kind === 'stone') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 2, y + 2, w - 4, 6);
  } else if (kind === 'bridge') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x, y, w, 5);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawQuestionBlock(ctx: CanvasRenderingContext2D, qb: QuestionBlock, time: number) {
  const y = qb.y - qb.bumpOffset;
  ctx.save();
  if (qb.used) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(qb.x, y, qb.w, qb.h);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.strokeRect(qb.x, y, qb.w, qb.h);
    // Four rivets
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(qb.x + 4, y + 4, 4, 4);
    ctx.fillRect(qb.x + qb.w - 8, y + 4, 4, 4);
    ctx.fillRect(qb.x + 4, y + qb.h - 8, 4, 4);
    ctx.fillRect(qb.x + qb.w - 8, y + qb.h - 8, 4, 4);
  } else {
    const pulse = Math.sin(time * 5) * 0.5 + 0.5;
    ctx.fillStyle = qb.reward === 'ammo' ? '#06B6D4' : '#F59E0B';
    ctx.fillRect(qb.x, y, qb.w, qb.h);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + pulse * 0.2})`;
    ctx.fillRect(qb.x + 3, y + 3, qb.w - 6, 8);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(qb.x, y, qb.w, qb.h);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbol = qb.reward === 'ammo' ? '★' : '?';
    ctx.fillText(symbol, qb.x + qb.w / 2, y + qb.h / 2 + 1);
  }
  ctx.restore();
}

function drawCollectible(ctx: CanvasRenderingContext2D, item: CollectibleItem, time: number) {
  const sub = SUBSTANCES[item.substanceId];
  if (!sub) return;
  const bob = Math.sin(time * 4 + item.bobPhase) * 4;
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2 + bob;

  ctx.save();
  // Soft glow aura
  ctx.fillStyle = `${sub.color}33`;
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  // Badge circle
  ctx.fillStyle = sub.accentColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = sub.color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Custom Icon inside
  ctx.fillStyle = sub.color;
  switch (sub.iconType) {
    case 'kunyit':
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'suji':
    case 'stevia':
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy, 6, 3.5, -0.5, 0, Math.PI * 2);
      ctx.ellipse(cx + 3, cy + 1, 5, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'jeruk':
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 1, cy - 5, 2, 10);
      break;
    case 'garam':
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      break;
    case 'vitamin':
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('V+', cx, cy + 1);
      break;
    case 'kapsul':
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(cx - 7, cy - 4, 7, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx, cy - 4, 7, 8);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - 7, cy - 4, 14, 8);
      break;
    default:
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
  }

  // Crisp readable label below item
  const label = sub.shortLabel;
  ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(label).width + 8;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fillRect(cx - tw / 2, cy + 16, tw, 14);
  ctx.fillStyle = '#ECFDF5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 23);

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity, time: number) {
  const sub = SUBSTANCES[enemy.substanceId];
  const color = sub?.color ?? '#DC2626';
  const label = sub?.shortLabel ?? 'Zat Berbahaya';
  const cx = enemy.x + enemy.w / 2;
  const cy = enemy.y + enemy.h / 2;
  const wobble = Math.sin(time * 8 + enemy.animPhase) * 2;

  ctx.save();

  // Hazard body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(enemy.x, enemy.y + wobble * 0.5, enemy.w, enemy.h - 4, 10);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Spiky warning horns / fumes
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(enemy.x + 6, enemy.y + 4);
  ctx.lineTo(enemy.x + 12, enemy.y - 6);
  ctx.lineTo(enemy.x + 18, enemy.y + 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(enemy.x + enemy.w - 18, enemy.y + 4);
  ctx.lineTo(enemy.x + enemy.w - 12, enemy.y - 6);
  ctx.lineTo(enemy.x + enemy.w - 6, enemy.y + 4);
  ctx.fill();

  // Angry Eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx - 10, cy - 6, 7, 7);
  ctx.fillRect(cx + 3, cy - 6, 7, 7);
  ctx.fillStyle = '#0F172A';
  const eyeDir = enemy.vx >= 0 ? 2 : 0;
  ctx.fillRect(cx - 9 + eyeDir, cy - 4, 4, 4);
  ctx.fillRect(cx + 4 + eyeDir, cy - 4, 4, 4);

  // Frown
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy + 8);
  ctx.lineTo(cx, cy + 4);
  ctx.lineTo(cx + 7, cy + 8);
  ctx.stroke();

  // Feet animation
  ctx.fillStyle = '#0F172A';
  const step = Math.sin(time * 12 + enemy.animPhase) * 3;
  ctx.fillRect(enemy.x + 5, enemy.y + enemy.h - 6 + step * 0.5, 10, 6);
  ctx.fillRect(enemy.x + enemy.w - 15, enemy.y + enemy.h - 6 - step * 0.5, 10, 6);

  // Clear warning label above enemy (non-hue-only affordance)
  const tagText = `⚠ ${label}`;
  ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(tagText).width + 10;
  ctx.fillStyle = 'rgba(127, 29, 29, 0.92)';
  ctx.fillRect(cx - tw / 2, enemy.y - 22, tw, 15);
  ctx.fillStyle = '#FEE2E2';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, cx, enemy.y - 14.5);

  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: BossState, time: number) {
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;
  const pulse = Math.sin(time * 6) * 3;

  ctx.save();
  // Toxic Aura
  const auraColor =
    boss.state === 'VULNERABLE'
      ? 'rgba(250, 204, 21, 0.32)'
      : boss.phase === 3
      ? 'rgba(220, 38, 38, 0.35)'
      : 'rgba(126, 34, 206, 0.32)';
  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 56 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Hit flash
  const bodyColor =
    boss.hitFlash > 0
      ? '#FFFFFF'
      : boss.state === 'VULNERABLE'
      ? '#CA8A04'
      : boss.phase === 3
      ? '#7F1D1D'
      : '#3B0764';

  // Main Monster Torso
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(boss.x, boss.y + 12, boss.w, boss.h - 16, 18);
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Crown of Toxic Tar & Smoke Spikes
  ctx.fillStyle = boss.state === 'VULNERABLE' ? '#FACC15' : '#DC2626';
  for (let i = 0; i < 4; i++) {
    const sx = boss.x + 12 + i * 18;
    ctx.beginPath();
    ctx.moveTo(sx, boss.y + 14);
    ctx.lineTo(sx + 9, boss.y - 6);
    ctx.lineTo(sx + 18, boss.y + 14);
    ctx.closePath();
    ctx.fill();
  }

  // Glowing Eyes
  ctx.fillStyle = boss.state === 'VULNERABLE' ? '#FEF08A' : '#EF4444';
  ctx.fillRect(cx - 22, cy - 12, 14, 12);
  ctx.fillRect(cx + 8, cy - 12, 14, 12);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(cx - 18, cy - 8, 6, 6);
  ctx.fillRect(cx + 12, cy - 8, 6, 6);

  // Hazard Symbol on Chest
  ctx.fillStyle = '#FCA5A5';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ADIKTIF', cx, cy + 20);

  // Label above boss
  const bannerText =
    boss.state === 'VULNERABLE'
      ? 'KELELAHAN! INJAK / TEMBAK SEKARANG!'
      : `RAJA ZAT ADIKTIF · HP ${boss.hp}/${boss.maxHp}`;
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(bannerText).width + 14;
  ctx.fillStyle = boss.state === 'VULNERABLE' ? '#B45309' : '#7F1D1D';
  ctx.fillRect(cx - tw / 2, boss.y - 30, tw, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(bannerText, cx, boss.y - 17);

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number) {
  // Blink when invincible
  if (player.invincibleTimer > 0 && Math.floor(time * 16) % 2 === 0) {
    return;
  }

  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;

  ctx.save();

  // Shield Aura
  if (player.hasShield) {
    ctx.strokeStyle = '#38BDF8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 29 + Math.sin(time * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Flip according to facing direction
  ctx.translate(cx, cy);
  ctx.scale(player.facing, 1);

  const walkSwing = player.onGround && Math.abs(player.vx) > 10 ? Math.sin(player.walkFrame * 14) * 5 : 0;

  // Legs (Blue overalls)
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(-10 + walkSwing * 0.5, 8, 8, 12);
  ctx.fillRect(2 - walkSwing * 0.5, 8, 8, 12);

  // Shoes
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-11 + walkSwing * 0.5, 17, 10, 5);
  ctx.fillRect(1 - walkSwing * 0.5, 17, 10, 5);

  // Torso (White Lab Coat + Blue Overalls)
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(-12, -4, 24, 14);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-13, -6, 26, 6);

  // Arm
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(7, -3 - walkSwing * 0.3, 6, 8);

  // Head
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.roundRect(-11, -19, 22, 16, 6);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(3, -14, 3.5, 5);

  // Classic Red Mario-style Cap + Visor
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.roundRect(-13, -24, 26, 9, 4);
  ctx.fill();
  ctx.fillStyle = '#B91C1C';
  ctx.fillRect(4, -19, 12, 4);

  // Badge on cap
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, -20, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  ctx.save();
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!proj.fromPlayer) {
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FEE2E2';
    ctx.textAlign = 'center';
    ctx.fillText(proj.label, proj.x, proj.y - proj.r - 4);
  }
  ctx.restore();
}
