import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocsFromServer,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LeaderboardEntry } from '../types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const PLAYER_ID_STORAGE_KEY = 'petualangan_zat_player_id';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getOrCreatePlayerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_ID_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,128}$/.test(existing)) {
      return existing;
    }
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '')
        : `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const generated = `mario_${randomPart}`.slice(0, 48);
    localStorage.setItem(PLAYER_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `mario_${Date.now()}`;
  }
}

// Validate connection to Firestore on boot using permitted leaderboard query
export async function testFirestoreConnection(): Promise<void> {
  try {
    const q = query(collection(db, 'leaderboard'), where('score', '>=', 0), limit(1));
    await getDocsFromServer(q);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function sanitizeNickname(raw: string): string {
  const cleaned = raw.trim().slice(0, 36);
  return cleaned.length > 0 ? cleaned : 'Mario Peneliti';
}

export function subscribeLeaderboard(
  onData: (entries: LeaderboardEntry[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('score', '>=', 0),
    orderBy('score', 'desc'),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : '';
        return {
          id: d.id,
          playerId: String(data.playerId ?? data.uid ?? d.id),
          playerName: String(data.playerName ?? 'Pemain'),
          score: Number(data.score ?? 0),
          highestLevel: Number(data.highestLevel ?? 1),
          bossDefeated: Boolean(data.bossDefeated),
          quizCorrect: Number(data.quizCorrect ?? 0),
          quizTotal: Number(data.quizTotal ?? 0),
          updatedAt: ts,
        };
      });
      onData(entries);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

export async function submitLeaderboardScore(params: {
  playerId: string;
  playerName: string;
  score: number;
  highestLevel: number;
  bossDefeated: boolean;
  quizCorrect: number;
  quizTotal: number;
}): Promise<void> {
  const safeId = /^[a-zA-Z0-9_-]{8,128}$/.test(params.playerId)
    ? params.playerId
    : getOrCreatePlayerId();
  const docPath = `leaderboard/${safeId}`;
  const docRef = doc(db, 'leaderboard', safeId);

  const safeScore = Math.max(0, Math.min(1000000, Math.floor(params.score)));
  const safeLevel = Math.max(1, Math.min(3, Math.floor(params.highestLevel)));
  const safeQuizTotal = Math.max(0, Math.min(500, Math.floor(params.quizTotal)));
  const safeQuizCorrect = Math.max(0, Math.min(safeQuizTotal, Math.floor(params.quizCorrect)));
  const safeName = sanitizeNickname(params.playerName);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        playerId: safeId,
        playerName: safeName,
        score: safeScore,
        highestLevel: safeLevel,
        bossDefeated: Boolean(params.bossDefeated),
        quizCorrect: safeQuizCorrect,
        quizTotal: safeQuizTotal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = snap.data();
      const prevScore = Number(existingData.score ?? 0);
      const prevLevel = Number(existingData.highestLevel ?? 1);
      const prevBoss = Boolean(existingData.bossDefeated);
      const prevQuizCorrect = Number(existingData.quizCorrect ?? 0);
      const prevQuizTotal = Number(existingData.quizTotal ?? 0);

      const bestScore = Math.max(prevScore, safeScore);
      const bestLevel = Math.max(prevLevel, safeLevel);
      const bestBoss = prevBoss || Boolean(params.bossDefeated);
      const bestQuizCorrect = safeScore >= prevScore ? safeQuizCorrect : prevQuizCorrect;
      const bestQuizTotal = Math.max(
        bestQuizCorrect,
        safeScore >= prevScore ? safeQuizTotal : prevQuizTotal
      );

      await updateDoc(docRef, {
        playerName: safeName,
        score: bestScore,
        highestLevel: bestLevel,
        bossDefeated: bestBoss,
        quizCorrect: bestQuizCorrect,
        quizTotal: bestQuizTotal,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
