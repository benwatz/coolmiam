import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import type { Meal } from '../domain/types';
import type { AccessRequest, AdminService, AuthService, Backend, Store } from './types';

// Configuration web Firebase : destinée à être embarquée dans le code client, ce n'est pas un secret.
// La vraie barrière d'accès, ce sont les règles de sécurité Firestore (`firestore.rules`).
const firebaseConfig = {
  apiKey: 'AIzaSyBVArOmGIvYYEac6tjx7U_lAOG-9vjqsjo',
  authDomain: 'coolmiam.firebaseapp.com',
  projectId: 'coolmiam',
  storageBucket: 'coolmiam.firebasestorage.app',
  messagingSenderId: '855090989578',
  appId: '1:855090989578:web:e5fa0c80633b4f166fedf3',
};

function logError(error: unknown) {
  console.error(error);
}

function mealsFrom(snapshot: QuerySnapshot): Meal[] {
  return snapshot.docs.map((d) => d.data() as Meal);
}

function createStore(db: Firestore, uid: string): Store {
  const meals = collection(db, 'users', uid, 'meals');
  const settings = collection(db, 'users', uid, 'settings');
  // Intervalle sur le seul champ "date" : pas d'index composite à créer.
  const range = (start: string, end: string) => query(meals, where('date', '>=', start), where('date', '<=', end));

  return {
    watchMeals: (start, end, callback) => onSnapshot(range(start, end), (s) => callback(mealsFrom(s)), logError),
    async getMeals(start, end) {
      return mealsFrom(await getDocs(range(start, end)));
    },
    async getMeal(id) {
      const snap = await getDoc(doc(meals, id));
      return snap.exists() ? (snap.data() as Meal) : undefined;
    },
    // Pas d'await sur la promesse de Firestore : hors ligne, elle ne se résout qu'à la reconnexion,
    // alors que l'écriture locale (cache persistant) est déjà visible par les écoutes en cours.
    async putMeal(meal) {
      setDoc(doc(meals, meal.id), meal).catch(logError);
    },
    async deleteMeal(id) {
      deleteDoc(doc(meals, id)).catch(logError);
    },
    watchSetting: (key, callback) =>
      onSnapshot(doc(settings, key), (s) => callback(s.exists() ? s.data().value : undefined), logError),
    async setSetting(key, value) {
      setDoc(doc(settings, key), { value }).catch(logError);
    },
  };
}

function createAuth(db: Firestore): AuthService {
  const auth = getAuth();
  return {
    onUser: (callback) =>
      onAuthStateChanged(auth, (u) =>
        callback(u ? { uid: u.uid, email: u.email ?? '', name: u.displayName ?? '' } : null),
      ),
    async signIn() {
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    signOut: () => signOut(auth),
    watchAccess(user, callback) {
      let requested = false;
      return onSnapshot(
        doc(db, 'allowedUsers', user.uid),
        (snap) => {
          if (snap.exists()) return callback('allowed');
          // Un document absent du cache local n'est pas une réponse : on attend celle du serveur.
          if (snap.metadata.fromCache) return callback('checking');
          callback('pending');
          if (!requested) {
            requested = true;
            setDoc(doc(db, 'accessRequests', user.uid), {
              email: user.email,
              name: user.name,
              requestedAt: serverTimestamp(),
            }).catch(logError);
          }
        },
        // Règles refusant la lecture : compte non approuvé.
        () => callback('pending'),
      );
    },
  };
}

function createAdmin(db: Firestore): AdminService {
  const requests = collection(db, 'accessRequests');
  const allowed = collection(db, 'allowedUsers');
  return {
    // Règles refusant la lecture (compte non admin) : pas administrateur.
    watchIsAdmin: (uid, callback) =>
      onSnapshot(doc(db, 'admins', uid), (s) => callback(s.exists()), () => callback(false)),

    watchAccessList(callback) {
      let requestDocs: QueryDocumentSnapshot[] | null = null;
      let allowedDocs: QueryDocumentSnapshot[] | null = null;
      const emit = () => {
        // Attend les deux collections avant d'afficher, pour ne pas montrer d'approuvé comme "en attente".
        if (!requestDocs || !allowedDocs) return;
        const approvedIds = new Set(allowedDocs.map((d) => d.id));
        const items = new Map<string, AccessRequest>();
        for (const d of requestDocs) {
          const data = d.data();
          const at = data.requestedAt instanceof Timestamp ? data.requestedAt.toDate().toISOString() : null;
          items.set(d.id, {
            uid: d.id,
            email: String(data.email ?? ''),
            name: String(data.name ?? ''),
            requestedAt: at,
            approved: approvedIds.has(d.id),
          });
        }
        // Compte approuvé à la main dans la console, sans demande enregistrée.
        for (const d of allowedDocs) {
          if (!items.has(d.id)) {
            const data = d.data();
            items.set(d.id, {
              uid: d.id,
              email: String(data.email ?? ''),
              name: String(data.name ?? ''),
              requestedAt: null,
              approved: true,
            });
          }
        }
        callback([...items.values()]);
      };
      const stopRequests = onSnapshot(requests, (s) => ((requestDocs = s.docs), emit()), logError);
      const stopAllowed = onSnapshot(allowed, (s) => ((allowedDocs = s.docs), emit()), logError);
      return () => {
        stopRequests();
        stopAllowed();
      };
    },

    async approve(request) {
      await setDoc(doc(allowed, request.uid), {
        email: request.email,
        name: request.name,
        approvedAt: serverTimestamp(),
      });
    },
    revoke: (uid) => deleteDoc(doc(allowed, uid)),
    reject: (uid) => deleteDoc(doc(requests, uid)),
  };
}

export function createFirebaseBackend(): Backend {
  const app = initializeApp(firebaseConfig);
  // Cache persistant (IndexedDB) : lecture et saisie hors ligne, synchronisées à la reconnexion.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return { auth: createAuth(db), admin: createAdmin(db), createStore: (uid) => createStore(db, uid) };
}
