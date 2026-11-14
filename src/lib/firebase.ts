import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LeaderboardEntry } from '../types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

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
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function sanitizeNickname(raw: string): string {
  const cleaned = raw.trim().slice(0, 36);
  return cleaned.length > 0 ? cleaned : 'Peneliti Mario';
}

export function subscribeLeaderboard(
  onData: (entries: LeaderboardEntry[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'leaderboard';
  const q = query(collection(db, path), orderBy('score', 'desc'), limit(20));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : '';
        return {
          id: d.id,
          uid: String(data.uid ?? d.id),
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
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function submitLeaderboardScore(params: {
  playerName: string;
  score: number;
  highestLevel: number;
  bossDefeated: boolean;
  quizCorrect: number;
  quizTotal: number;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const docPath = `leaderboard/${user.uid}`;
  const docRef = doc(db, 'leaderboard', user.uid);
  const safeScore = Math.max(0, Math.min(1000000, Math.floor(params.score)));
  const safeLevel = Math.max(1, Math.min(3, Math.floor(params.highestLevel)));
  const safeQuizTotal = Math.max(0, Math.min(500, Math.floor(params.quizTotal)));
  const safeQuizCorrect = Math.max(0, Math.min(safeQuizTotal, Math.floor(params.quizCorrect)));
  const safeName = sanitizeNickname(params.playerName || user.displayName || 'Pemain Mario');

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        uid: user.uid,
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
      const bestQuizTotal = Math.max(bestQuizCorrect, safeScore >= prevScore ? safeQuizTotal : prevQuizTotal);

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
