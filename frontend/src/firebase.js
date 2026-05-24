import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

let app;
let isMock = !import.meta.env.VITE_FIREBASE_API_KEY;

if (!isMock) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    } catch (e) {
        console.warn("Falha ao inicializar o Firebase. Ativando Mock Mode.", e);
        isMock = true;
    }
}

export const auth = !isMock ? getAuth(app) : {
    currentUser: null,
    onAuthStateChanged: (callback) => {
        // Automatically provide a mock logged-in user in development if mock mode is on
        setTimeout(() => {
            callback({
                uid: 'mock-user-123',
                displayName: 'Usuário Local (Mock)',
                email: 'mock@nexa3d.local',
                photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            });
        }, 100);
        return () => {};
    },
    signOut: () => Promise.resolve(),
};

export const googleProvider = new GoogleAuthProvider();
export const db = !isMock ? getFirestore(app) : null;
export const rtdb = !isMock ? getDatabase(app) : null;

export { isMock };
export default app;
