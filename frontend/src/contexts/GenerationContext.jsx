import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const GenerationContext = createContext(null);

const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

export function GenerationProvider({ children }) {
    const [activeTasks, setActiveTasks] = useState([]);
    const [history, setHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeModel, setActiveModel] = useState(null);
    const historyLoaded = useRef(false);
    const intervalsRef = useRef({});   // { taskId: intervalId }
    const timersRef = useRef({});      // { taskId: { intervalId, secondsRef } }

    // Load history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('nexa_history');
        if (saved) {
            try { setHistory(JSON.parse(saved)); } catch (e) { /* ignore */ }
        }
        historyLoaded.current = true;
    }, []);

    // Save history to localStorage
    useEffect(() => {
        if (!historyLoaded.current) return;
        localStorage.setItem('nexa_history', JSON.stringify(history));
    }, [history]);

    // Request Notification Permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Helper to send notification
    const notifyUser = useCallback((title, body) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/vite.svg' });
        }
    }, []);

    // Start polling for a task
    const startPolling = useCallback((taskId) => {
        if (intervalsRef.current[taskId]) return; // Already polling

        // Start timer
        const timerState = { seconds: 0 };
        const timerInterval = setInterval(() => { timerState.seconds += 1; }, 1000);
        timersRef.current[taskId] = { intervalId: timerInterval, state: timerState };

        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/status/${taskId}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                const newStatus = response.data.status;

                if (newStatus === 'queued' || newStatus === 'processing') {
                    setActiveTasks(prev =>
                        prev.map(t => t.id === taskId ? { ...t, status: newStatus, queuePosition: response.data.queue_position, seconds: timersRef.current[taskId]?.state?.seconds || 0 } : t)
                    );
                } else if (newStatus === 'completed') {
                    clearInterval(pollInterval);
                    clearInterval(timersRef.current[taskId]?.intervalId);
                    delete intervalsRef.current[taskId];

                    const finalModelUrl = `${API_BASE_URL}${response.data.model_url}`;
                    const historyItem = {
                        id: taskId,
                        status: newStatus,
                        modelUrl: finalModelUrl,
                        timestamp: new Date().toISOString(),
                        timeElapsed: formatTime(timersRef.current[taskId]?.state?.seconds || 0),
                        settings: response.data.settings,
                        mesh_stats: response.data.mesh_stats || {},
                        export_urls: response.data.export_urls || {},
                        // textPrompt and settings come from response.data.settings normally, but adding them below
                    };

                    // Save to Firestore so it shows up in Gallery
                    try {
                        const user = auth.currentUser;
                        await setDoc(doc(db, 'models', taskId), {
                            modelUrl: finalModelUrl,
                            createdAt: serverTimestamp(),
                            isPublic: true,  // By default, let's make them public for the gallery
                            userId: user ? user.uid : 'anonymous',
                            userDisplayName: user ? user.displayName : 'Anônimo',
                            settings: response.data.settings || {},
                            mesh_stats: response.data.mesh_stats || {},
                            export_urls: response.data.export_urls || {},
                            timeElapsed: formatTime(timersRef.current[taskId]?.state?.seconds || 0),
                            textPrompt: response.data.settings?.text_prompt || null
                        }, { merge: true });
                    } catch (err) {
                        console.error("Erro ao salvar modelo no Firestore:", err);
                    }

                    delete timersRef.current[taskId];

                    setHistory(prev => [historyItem, ...prev]);
                    setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
                    notifyUser('Geração Concluída! 🎉', `Seu modelo 3D terminou de gerar em ${formatTime(timersRef.current[taskId]?.state?.seconds || 0)}`);
                } else if (newStatus === 'failed') {
                    clearInterval(pollInterval);
                    clearInterval(timersRef.current[taskId]?.intervalId);
                    delete intervalsRef.current[taskId];
                    delete timersRef.current[taskId];
                    setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed' } : t));
                    notifyUser('Geração Falhou ❌', 'Ocorreu um erro ao gerar seu modelo. Verifique o console.');
                }
            } catch (error) {
                console.error("Polling error for", taskId, error);
            }
        }, 3000);

        intervalsRef.current[taskId] = pollInterval;
    }, []);

    // Add a new task and start polling
    const addTask = useCallback((taskId) => {
        setActiveTasks(prev => [{ id: taskId, timestamp: Date.now(), status: 'queued', seconds: 0 }, ...prev]);
        startPolling(taskId);
    }, [startPolling]);

    // Open model viewer
    const viewModel = useCallback((taskId) => {
        const item = history.find(h => h.id === taskId);
        if (item) {
            setActiveModel(item);
            setIsModalOpen(true);
        }
    }, [history]);

    const openHistoryItem = useCallback((item) => {
        setActiveModel(item);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(intervalsRef.current).forEach(clearInterval);
            Object.values(timersRef.current).forEach(t => clearInterval(t.intervalId));
        };
    }, []);

    const value = {
        activeTasks,
        history,
        isModalOpen,
        activeModel,
        addTask,
        viewModel,
        openHistoryItem,
        closeModal,
        clearHistory,
    };

    return (
        <GenerationContext.Provider value={value}>
            {children}
        </GenerationContext.Provider>
    );
}

export function useGeneration() {
    const ctx = useContext(GenerationContext);
    if (!ctx) throw new Error('useGeneration must be used within GenerationProvider');
    return ctx;
}
