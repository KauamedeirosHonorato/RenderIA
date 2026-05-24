import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updateProfile } from 'firebase/auth';
import { auth, isMock, db } from '../firebase';
import { useAuthState } from '../hooks/useAuth';
import { useGeneration } from '../contexts/GenerationContext';
import { API_BASE_URL, setApiUrl } from '../config';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { 
    User, Mail, Calendar, Hash, LogOut, 
    Cuboid, Check, Edit2, ShieldCheck, Activity, 
    Wifi, Globe, Award, Sparkles, Settings2, Trash2,
    BookOpen, ExternalLink, Heart, Download
} from 'lucide-react';

const PRESET_AVATARS = [
    { name: 'Abstrato Néon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60' },
    { name: 'Ciber Espacial', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&auto=format&fit=crop&q=60' },
    { name: 'Metal Chrome', url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=150&auto=format&fit=crop&q=60' },
    { name: 'Geometria 3D', url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=150&auto=format&fit=crop&q=60' },
    { name: 'Toro de Vidro', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=60' },
    { name: 'Seda Fluida', url: 'https://images.unsplash.com/photo-1618005198143-e5283b519ef7?w=150&auto=format&fit=crop&q=60' },
];

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuthState();
    const { history } = useGeneration();

    // Tabs control
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'api', 'mockups'

    // Profile state
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [bio, setBio] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // API settings state
    const [serverUrl, setServerUrl] = useState(API_BASE_URL);
    const [urlSaved, setUrlSaved] = useState(false);
    const [pinging, setPinging] = useState(false);
    const [pingStatus, setPingStatus] = useState(null); // 'online', 'offline'

    // Mockups list state
    const [savedMockups, setSavedMockups] = useState([]);

    // Initialize editing values when user loads
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || 'Usuário Nexa');
            setPhotoURL(user.photoURL || PRESET_AVATARS[0].url);
            setBio(localStorage.getItem('nexa_user_bio') || 'Visualizador de Mockups 3D no RenderIA Studio. Criando protótipos ultra realistas por inteligência artificial.');
        }
    }, [user]);

    // Load saved mockups from localStorage & Firestore
    useEffect(() => {
        const loadMockups = async () => {
            let localMockups = [];
            try {
                localMockups = JSON.parse(localStorage.getItem('nexa_saved_mockups') || '[]');
            } catch (e) {
                console.error("Error loading local mockups:", e);
            }

            if (user && db && !isMock) {
                try {
                    const q = query(
                        collection(db, 'custom_mockups'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );
                    const snapshot = await getDocs(q);
                    const dbMockups = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().createdAt?.toDate()?.toISOString() || doc.data().timestamp || new Date().toISOString()
                    }));

                    // Merge local and DB mockups, keeping unique IDs, favoring DB mockups if duplicate
                    const mergedMap = new Map();
                    localMockups.forEach(m => mergedMap.set(m.id, m));
                    dbMockups.forEach(m => mergedMap.set(m.id, m));
                    setSavedMockups(Array.from(mergedMap.values()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
                    return;
                } catch (err) {
                    console.error("Error fetching mockups from Firestore:", err);
                }
            }

            setSavedMockups(localMockups);
        };

        loadMockups();
    }, [user, activeTab]);

    const handleLogout = async () => {
        if (!isMock) {
            await signOut(auth);
        }
        navigate('/');
    };

    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();
        if (!user) return;

        try {
            localStorage.setItem('nexa_user_bio', bio);
            
            if (isMock) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
                setIsEditing(false);
            } else {
                await updateProfile(auth.currentUser, {
                    displayName: displayName,
                    photoURL: photoURL
                });
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Erro ao atualizar o perfil.");
        }
    };

    const handleSaveApiUrl = () => {
        const trimmed = serverUrl.trim().replace(/\/$/, '');
        if (trimmed) {
            setApiUrl(trimmed); // Updates localStorage and reloads!
            setUrlSaved(true);
            setTimeout(() => setUrlSaved(false), 2000);
        }
    };

    const handleTestPing = async () => {
        setPinging(true);
        setPingStatus(null);
        try {
            // Check status API endpoint with a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(`${serverUrl}/status/mock-test-ping`, {
                signal: controller.signal,
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            clearTimeout(timeoutId);
            if (res.ok || res.status === 404) { // 404 means server reached but invalid task
                setPingStatus('online');
            } else {
                setPingStatus('offline');
            }
        } catch (e) {
            console.error("Ping failed:", e);
            setPingStatus('offline');
        } finally {
            setPinging(false);
        }
    };

    const handleDeleteMockup = async (id) => {
        const updated = savedMockups.filter(m => m.id !== id);
        setSavedMockups(updated);
        localStorage.setItem('nexa_saved_mockups', JSON.stringify(updated));

        if (db && !isMock && id.startsWith('mockup_')) {
            try {
                await deleteDoc(doc(db, 'custom_mockups', id));
                console.log("Mockup deletado com sucesso do Firestore:", id);
            } catch (err) {
                console.error("Erro ao deletar mockup do Firestore:", err);
            }
        }
    };

    const handleLoadMockup = (mockup) => {
        navigate('/customizer', { state: { loadMockup: mockup } });
    };

    if (!user) return null;

    // Safe extraction of date to avoid crashes in Mock Mode
    const creationDateStr = user.metadata?.creationTime 
        ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Usage metrics
    const maxFreeGenerations = 50;
    const currentGenerationsCount = history.length;
    const progressPercent = Math.min(100, (currentGenerationsCount / maxFreeGenerations) * 100);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                    Painel do Desenvolvedor
                </h1>
                <p className="text-sm text-slate-400 font-medium font-mono">Gerencie seu perfil, controle a API e configure seus designs 3D.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                
                {/* 1. LEFT CARD: Mini Profile overview */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
                        
                        {/* Premium Account Badge */}
                        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-bold tracking-wider uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            VIP Beta
                        </div>

                        {/* Avatar */}
                        <div className="relative mb-3">
                            <img src={photoURL} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-xl object-cover bg-slate-900" />
                        </div>

                        <div className="w-full">
                            <h2 className="text-lg font-bold text-white mb-0.5 truncate">{displayName}</h2>
                            <p className="text-[10px] text-slate-500 font-mono truncate mb-4">{user.email}</p>
                            
                            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-left">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500">Total Criado:</span>
                                    <span className="font-mono text-cyan-400 font-bold">{currentGenerationsCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500">Saved Mockups:</span>
                                    <span className="font-mono text-indigo-400 font-bold">{savedMockups.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500">Conexão API:</span>
                                    <span className={`font-bold font-mono ${API_BASE_URL.includes('ngrok') ? 'text-green-400' : 'text-yellow-500'}`}>
                                        {API_BASE_URL.includes('ngrok') ? 'Nuvem' : 'Local'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl font-bold text-[10px] transition-all tracking-wider uppercase"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sair da Conta
                        </button>
                    </div>
                </div>

                {/* 2. RIGHT COLUMNS: 3-Tabs panel */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    
                    {/* Tab Navigation */}
                    <div className="flex bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1 gap-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${
                                activeTab === 'profile'
                                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <User className="w-4 h-4" />
                            Meu Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('api')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${
                                activeTab === 'api'
                                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Settings2 className="w-4 h-4" />
                            Configurações da API
                        </button>
                        <button
                            onClick={() => setActiveTab('mockups')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${
                                activeTab === 'mockups'
                                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Heart className="w-4 h-4" />
                            Meus Mockups ({savedMockups.length})
                        </button>
                    </div>

                    {/* --- TAB CONTENT: MEU PERFIL --- */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* Profile edit card */}
                            <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-6">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <User className="w-4.5 h-4.5 text-cyan-400" /> Detalhes da Conta
                                    </h3>
                                    {!isEditing && (
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                                        >
                                            <Edit2 className="w-3 h-3" /> Editar
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <form onSubmit={handleSaveProfile} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Apelido do Usuário</label>
                                                <input 
                                                    type="text" 
                                                    value={displayName} 
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Foto de Avatar (URL)</label>
                                                <input 
                                                    type="text" 
                                                    value={photoURL} 
                                                    onChange={(e) => setPhotoURL(e.target.value)}
                                                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none font-mono transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Preset 3D Avatars Selector */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                                                Escolher Render Avatar 3D
                                            </label>
                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                                {PRESET_AVATARS.map((av) => (
                                                    <button
                                                        key={av.url}
                                                        type="button"
                                                        onClick={() => setPhotoURL(av.url)}
                                                        className={`relative rounded-xl overflow-hidden border-2 aspect-square transition-all ${
                                                            photoURL === av.url ? 'border-cyan-400 scale-[1.05]' : 'border-slate-800 hover:border-slate-700'
                                                        }`}
                                                        title={av.name}
                                                    >
                                                        <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-0.5 text-[8px] text-center text-slate-400 font-medium">
                                                            {av.name}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Biografia do Estúdio</label>
                                            <textarea 
                                                value={bio} 
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={3}
                                                className="w-full bg-slate-950/40 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none resize-none transition-colors"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2 border-t border-slate-800/80 justify-end">
                                            <button 
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-xl border border-slate-750 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                                            >
                                                <Check className="w-4 h-4" /> Salvar Perfil
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Apelido</span>
                                                <span className="text-sm font-semibold text-slate-200">{displayName}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Registro</span>
                                                <span className="text-sm font-semibold text-slate-200">{creationDateStr}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Biografia</span>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium bg-slate-950/20 p-3 rounded-xl border border-slate-900">{bio}</p>
                                        </div>
                                    </div>
                                )}

                                {saveSuccess && (
                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-bold animate-pulse text-center">
                                        Perfil Atualizado com Sucesso! ✓
                                    </div>
                                )}
                            </div>

                            {/* Generative quota card */}
                            <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-cyan-400" /> Limite de Geração do Servidor
                                    </p>
                                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-mono">
                                        {currentGenerationsCount} / {maxFreeGenerations}
                                    </span>
                                </div>

                                <div className="relative w-full h-3.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden mb-3">
                                    <div 
                                        style={{ width: `${progressPercent}%` }}
                                        className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-1000 relative"
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem] animate-[progress_1.5s_linear_infinite]" />
                                    </div>
                                </div>

                                <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                                    <span>Quota Beta Gratuita</span>
                                    <span>{progressPercent.toFixed(0)}% Utilizado</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: CONFIGURACOES DA API --- */}
                    {activeTab === 'api' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-6">
                                <div className="border-b border-slate-800 pb-3">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Settings2 className="w-4.5 h-4.5 text-cyan-400" /> Servidor de Aceleração 3D
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                                        Insira a URL Ngrok gerada no Google Colab para alimentar as modelagens de IA do site.
                                    </p>
                                </div>

                                {/* --- GOOGLE COLAB NOTEBOOK CARD --- */}
                                <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/20 space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[30px] pointer-events-none" />
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
                                            <BookOpen className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                Executar GPU Gratuita no Google Colab
                                                <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/25 rounded-md text-amber-400 text-[8px] font-black tracking-widest uppercase animate-pulse">Recomendado</span>
                                            </h4>
                                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                                Para gerar modelos 3D com a IA Hunyuan3D-2 de graça usando a GPU T4 do Google Colab, baixe o notebook oficial do servidor e faça o upload dele no Google Colab para obter sua URL de conexão Ngrok.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5 pt-1">
                                        <a
                                            href="/Nexa3D_Colab_Server.ipynb"
                                            download="Nexa3D_Colab_Server.ipynb"
                                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[10px] rounded-lg shadow-md transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(99,102,241,0.35)]"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Baixar Notebook (.ipynb)
                                        </a>
                                        <a
                                            href="https://colab.research.google.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-lg border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5"
                                        >
                                            Abrir Google Colab
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* URL Input */}
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            URL do Túnel do Colab (Ngrok) / Host Local
                                        </label>
                                        
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="flex-1 flex items-center gap-2 bg-slate-950/60 border border-slate-800 focus-within:border-cyan-500/80 rounded-xl px-3.5 py-3 transition-colors">
                                                {serverUrl.includes('ngrok') ? (
                                                    <Globe className="w-4 h-4 text-green-400 shrink-0" />
                                                ) : (
                                                    <Wifi className="w-4 h-4 text-yellow-400 shrink-0" />
                                                )}
                                                <input 
                                                    type="text" 
                                                    value={serverUrl}
                                                    onChange={(e) => setServerUrl(e.target.value)}
                                                    placeholder="https://xxxx.ngrok-free.app ou http://localhost:8000"
                                                    className="w-full bg-transparent border-0 text-xs text-white placeholder-slate-600 outline-none font-mono"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleTestPing}
                                                    disabled={pinging}
                                                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5"
                                                >
                                                    {pinging && <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
                                                    Testar Ping
                                                </button>
                                                <button
                                                    onClick={handleSaveApiUrl}
                                                    className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                                                >
                                                    Salvar Conexão
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ping Feedback */}
                                    {pingStatus && (
                                        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
                                            pingStatus === 'online' 
                                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${pingStatus === 'online' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                                            <span>
                                                {pingStatus === 'online' 
                                                    ? 'Conexão Estabelecida com Sucesso! O Servidor 3D está ONLINE. 🎉' 
                                                    : 'Servidor inacessível. Verifique se a URL está correta e se a célula do notebook Colab está ativa.'
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {urlSaved && (
                                        <div className="p-3 bg-green-500/15 border border-green-500/25 rounded-xl text-green-400 text-xs font-bold animate-pulse text-center">
                                            Conexão salva! Recarregando sistema com o novo host...
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="bg-slate-950/30 border border-slate-850 p-4.5 rounded-xl flex items-center gap-3">
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Rede Hospedeira</span>
                                            <span className="text-xs font-bold text-slate-200 mt-0.5">
                                                {serverUrl.includes('ngrok') ? 'Nuvem Externa (Túnel Colab)' : 'Local Host Server (127.0.0.1)'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/30 border border-slate-850 p-4.5 rounded-xl flex items-center gap-3">
                                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Aceleração GPU</span>
                                            <span className="text-xs font-bold text-slate-200 mt-0.5">Hunyuan3D-2 CUDA FP16 Ativo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 bg-slate-950/30 border border-slate-850 p-4.5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                                    <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-300 mb-0.5">Dica de Produtividade</h4>
                                        O Colab Ngrok desconecta após algumas horas de inatividade. Quando isso acontecer, reinicie a célula no notebook do Colab, cole a nova URL gerada acima e salve.
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Trash2 className="w-3.5 h-3.5" /> Administração e Limpeza
                                    </h4>
                                    <p className="text-[10px] text-slate-500 leading-normal">
                                        Se você realizou testes locais e deseja remover todo o histórico de gerações simuladas, mockups salvos temporariamente ou biografias padrão para iniciar o sistema em estado totalmente limpo de fábrica, clique no botão de limpeza.
                                    </p>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Deseja realmente limpar todo o histórico de gerações, mockups salvos e configurações locais? Esta ação não pode ser desfeita.")) {
                                                localStorage.removeItem('nexa_history');
                                                localStorage.removeItem('nexa_saved_mockups');
                                                localStorage.removeItem('nexa_user_bio');
                                                localStorage.removeItem('nexa_api_url');
                                                alert("Todos os dados de testes locais foram apagados com sucesso! O sistema será reiniciado limpo.");
                                                window.location.reload();
                                            }
                                        }}
                                        className="px-4 py-2.5 bg-red-950/20 hover:bg-red-900/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                                    >
                                        Limpar Histórico e Cache de Testes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: MEUS MOCKUPS --- */}
                    {activeTab === 'mockups' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
                                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                            <Heart className="w-4.5 h-4.5 text-cyan-400" /> Meus Mockups Salvos
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">Designs de canecas e copos salvos localmente em seu navegador.</p>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                                        {savedMockups.length} Designs
                                    </span>
                                </div>

                                {savedMockups.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                        {savedMockups.map((m) => (
                                            <div 
                                                key={m.id} 
                                                className="bg-slate-950/40 border border-slate-850 hover:border-slate-750 transition-all rounded-xl p-4 flex flex-col justify-between group shadow-md"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-2xl">
                                                            {m.productType === 'caneca' ? '☕' : m.productType === 'chicara' ? '🍵' : '🥤'}
                                                        </span>
                                                        <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                                                            {m.productType.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-200 truncate">{m.name}</h4>
                                                        <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">
                                                            Salvo em: {new Date(m.timestamp).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-1.5 pt-1.5">
                                                        <div 
                                                            className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                                                            style={{ backgroundColor: m.baseColor }}
                                                            title={`Cor: ${m.baseColor}`}
                                                        />
                                                        <span className="text-[8px] text-slate-500 font-mono self-center">
                                                            {m.materialType.toUpperCase()}
                                                        </span>
                                                        {m.showLiquid && (
                                                            <span className="text-[8px] text-amber-500/80 font-bold self-center">
                                                                • Com {m.liquidType.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-900">
                                                    <button
                                                        onClick={() => handleDeleteMockup(m.id)}
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Excluir Design"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleLoadMockup(m)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[10px] font-bold rounded-lg transition-all"
                                                    >
                                                        Customizar
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                                        <Heart className="w-10 h-10 opacity-30 mb-2.5 text-slate-400" />
                                        <p className="text-xs font-semibold text-slate-400">Nenhum mockup salvo ainda</p>
                                        <p className="text-[10px] opacity-60 mt-1 max-w-xs leading-normal">
                                            Entre na página de **"Customizar 3D"**, crie seu design e clique em **"Salvar"** no rodapé do painel para guardá-lo aqui!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProfilePage;
