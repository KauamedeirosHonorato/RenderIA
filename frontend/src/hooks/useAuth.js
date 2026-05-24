import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isMock } from '../firebase';

export function useAuthState() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isMock) {
            // Em modo Mock, escuta o mock auth diretamente
            const unsubscribe = auth.onAuthStateChanged((mockUser) => {
                setUser(mockUser);
                setLoading(false);
            });
            return unsubscribe;
        } else {
            // Caso contrário, usa o listener nativo do Firebase
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                setUser(firebaseUser);
                setLoading(false);
            });
            return unsubscribe;
        }
    }, []);

    return { user, loading };
}

