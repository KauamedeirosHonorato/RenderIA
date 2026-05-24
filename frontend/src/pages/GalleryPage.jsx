import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, ImageOff, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { useGeneration } from '../contexts/GenerationContext';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';

const GalleryPage = () => {
    const { openHistoryItem } = useGeneration();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                // Fetch public raw 3D models from AI
                const qModels = query(
                    collection(db, 'models'),
                    where('isPublic', '==', true),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                
                // Fetch public custom mockups from Customizer
                const qMockups = query(
                    collection(db, 'custom_mockups'),
                    where('isPublic', '==', true),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const [snapshotModels, snapshotMockups] = await Promise.all([
                    getDocs(qModels).catch(err => {
                        console.warn("Failed to fetch models from Firestore:", err);
                        return { docs: [] };
                    }),
                    getDocs(qMockups).catch(err => {
                        console.warn("Failed to fetch custom_mockups from Firestore:", err);
                        return { docs: [] };
                    })
                ]);

                const fetchedModels = snapshotModels.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    type: 'ai_model',
                    timestamp: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                }));

                const fetchedMockups = snapshotMockups.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    type: 'custom_mockup',
                    timestamp: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                }));

                // Merge and sort chronologically (most recent first)
                const merged = [...fetchedModels, ...fetchedMockups].sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    return timeB - timeA;
                });

                setModels(merged);

                // Check for shared direct link
                const sharedId = searchParams.get('id');
                if (sharedId) {
                    if (sharedId.startsWith('mockup_')) {
                        const sharedDoc = await getDoc(doc(db, 'custom_mockups', sharedId));
                        if (sharedDoc.exists() && sharedDoc.data().isPublic) {
                            navigate('/customizer', { state: { loadMockup: { id: sharedDoc.id, ...sharedDoc.data() } } });
                        }
                    } else {
                        const sharedDoc = await getDoc(doc(db, 'models', sharedId));
                        if (sharedDoc.exists() && sharedDoc.data().isPublic) {
                            openHistoryItem({
                                id: sharedDoc.id,
                                ...sharedDoc.data(),
                                timestamp: sharedDoc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar galeria:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchModels();
    }, [openHistoryItem, searchParams, navigate]);

    const handleItemClick = (item) => {
        if (item.type === 'custom_mockup') {
            // Load direct custom mockup inside Customizer page!
            navigate('/customizer', { state: { loadMockup: item } });
        } else {
            // View AI 3D model details in modal
            openHistoryItem(item);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                    Galeria da Comunidade
                </h1>
                <p className="text-slate-400 max-w-xl mx-auto">
                    Explore tanto as gerações de IA 3D cruas quanto as personalizações e mockups de canecas desenhadas em 3D.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
                    <p className="text-slate-400 text-sm">Carregando galeria...</p>
                </div>
            ) : models.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="glass rounded-2xl p-12">
                        <ImageOff className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">Nenhum modelo ainda</h3>
                        <p className="text-sm text-slate-500 max-w-xs">
                            Gere um modelo 3D ou salve um design customizado para que ele apareça aqui automaticamente.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {models.map((item) => {
                        const date = new Date(item.timestamp);
                        const isAi = item.type === 'ai_model';
                        
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={`glass rounded-2xl overflow-hidden group hover:-translate-y-1 hover:border-slate-700/50 transition-all duration-300 cursor-pointer shadow-lg relative ${
                                    !isAi ? 'border-amber-500/10 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]' : 'border-slate-800/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]'
                                }`}
                            >
                                <div className="h-48 bg-gradient-to-br from-slate-950/80 via-slate-900 to-slate-950/80 flex items-center justify-center relative">
                                    {isAi ? (
                                        <Box className="w-12 h-12 text-slate-700 group-hover:text-cyan-400/40 transition-colors duration-300" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                                {item.productType === 'caneca' ? '☕' : item.productType === 'chicara' ? '🍵' : '🥤'}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                                {item.productType?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Format/Type Badge */}
                                    <div className={`absolute top-3 right-3 px-2.5 py-1 text-[9px] font-black rounded-md border uppercase tracking-wider ${
                                        isAi 
                                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    }`}>
                                        {isAi ? 'Geração IA' : 'Design 3D'}
                                    </div>
                                    
                                    {/* Text Prompt or Custom Name */}
                                    <div className="absolute bottom-3 left-3 right-3 truncate text-xs text-slate-300 bg-slate-950/80 border border-slate-900/60 px-3 py-1.5 rounded-xl backdrop-blur-md">
                                        {isAi ? (
                                            item.textPrompt ? `"${item.textPrompt}"` : "Sem prompt de texto"
                                        ) : (
                                            <span className="font-bold text-slate-200">{item.name}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white truncate max-w-[160px] flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                            {item.userDisplayName || 'Membro do Estúdio'}
                                        </h3>
                                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                                            {date.toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    
                                    {isAi ? (
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-900/40">
                                            <span>{item.settings?.steps || 30} passos</span>
                                            <span className="w-px h-3 bg-slate-800" />
                                            <span>{item.timeElapsed || '--:--'}</span>
                                            {item.mesh_stats?.vertices && (
                                                <>
                                                    <span className="w-px h-3 bg-slate-800" />
                                                    <span>{item.mesh_stats.vertices.toLocaleString()} vts</span>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-medium bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-900/40">
                                            <span className="capitalize">{item.materialType}</span>
                                            <span className="w-px h-3 bg-slate-800" />
                                            <span className="uppercase font-mono text-[9px]">{item.baseColor}</span>
                                            {item.showLiquid && (
                                                <>
                                                    <span className="w-px h-3 bg-slate-800" />
                                                    <span className="text-amber-500 font-bold">Com Líquido</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GalleryPage;
