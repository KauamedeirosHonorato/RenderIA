import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isMock } from '../firebase';

// Criação do Contexto Global de Autenticação
const AuthContext = createContext({ user: null, loading: true });

// Provedor de Autenticação Global para envelopar a aplicação em main.jsx
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isMock) {
            // Em modo Mock, escuta o mock auth diretamente do nosso simulador
            const unsubscribe = auth.onAuthStateChanged((mockUser) => {
                setUser(mockUser);
                setLoading(false);
            });
            return unsubscribe;
        } else {
            // Em modo Real, usa o listener nativo do Firebase Auth
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                setUser(firebaseUser);
                setLoading(false);
            });
            return unsubscribe;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook backward-compatible para todos os componentes do sistema
export function useAuthState() {
    return useContext(AuthContext);
}
