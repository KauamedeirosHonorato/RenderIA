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

// Suporte a Estado de Autenticação Interativo no Modo Mock (Persistido no localStorage)
let mockUser = null;
try {
    const saved = localStorage.getItem('nexa_mock_user');
    if (saved) mockUser = JSON.parse(saved);
} catch (e) {}

const mockListeners = new Set();
const notifyMockListeners = () => {
    mockListeners.forEach(cb => cb(mockUser));
};

export const auth = !isMock ? getAuth(app) : {
    get currentUser() {
        return mockUser;
    },
    onAuthStateChanged: (callback) => {
        mockListeners.add(callback);
        // Notifica o estado atual de forma assíncrona para simular comportamento real
        setTimeout(() => callback(mockUser), 50);
        return () => {
            mockListeners.delete(callback);
        };
    },
    signOut: () => {
        mockUser = null;
        localStorage.removeItem('nexa_mock_user');
        notifyMockListeners();
        return Promise.resolve();
    },
    // Helper customizado para simular login no modo Mock
    signInMock: (email, displayName = 'Usuário Mock') => {
        mockUser = {
            uid: 'mock-user-123',
            displayName: displayName,
            email: email,
            photoURL: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=60',
        };
        localStorage.setItem('nexa_mock_user', JSON.stringify(mockUser));
        notifyMockListeners();
        return Promise.resolve({ user: mockUser });
    }
};

export const googleProvider = new GoogleAuthProvider();
export const db = !isMock ? getFirestore(app) : null;
export const rtdb = !isMock ? getDatabase(app) : null;

export { isMock };
export default app;
