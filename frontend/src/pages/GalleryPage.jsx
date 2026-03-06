import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, ImageOff, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { useGeneration } from '../contexts/GenerationContext';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';

const GalleryPage = () => {
    const { openHistoryItem } = useGeneration();
    const [searchParams] = useSearchParams();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                // Fetch public models
                const q = query(
                    collection(db, 'models'),
                    where('isPublic', '==', true),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                const snapshot = await getDocs(q);
                const fetchedModels = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // reconstruct the history object shape expected by openHistoryItem
                    timestamp: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                }));
                setModels(fetchedModels);

                // Check for shared direct link
                const sharedId = searchParams.get('id');
                if (sharedId) {
                    const sharedDoc = await getDoc(doc(db, 'models', sharedId));
                    if (sharedDoc.exists() && sharedDoc.data().isPublic) {
                        openHistoryItem({
                            id: sharedDoc.id,
                            ...sharedDoc.data(),
                            timestamp: sharedDoc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
                        });
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar galeria:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchModels();
    }, [openHistoryItem, searchParams]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Galeria da Comunidade</h1>
                <p className="text-slate-400 max-w-xl mx-auto">
                    Explore modelos 3D gerados pela comunidade. Cada modelo pode ser visualizado e baixado.
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
                            Gere seu primeiro modelo 3D e ele aparecerá aqui automaticamente.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {models.map((item) => {
                        const date = new Date(item.timestamp);
                        return (
                            <div
                                key={item.id}
                                onClick={() => openHistoryItem(item)}
                                className="glass rounded-xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                            >
                                <div className="h-48 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center relative">
                                    <Box className="w-12 h-12 text-slate-700 group-hover:text-cyan-400/40 transition-colors" />
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-slate-900/80 text-[10px] font-bold text-cyan-400 rounded-md border border-slate-700 uppercase">
                                        {item.settings?.export_format || 'GLB'}
                                    </div>
                                    {item.textPrompt && (
                                        <div className="absolute bottom-3 left-3 right-3 truncate text-xs text-slate-400 bg-slate-950/80 px-2 py-1 rounded backdrop-blur">
                                            "{item.textPrompt}"
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white truncate max-w-[150px]">
                                            {item.userDisplayName || 'Membro da Comunidade'}
                                        </h3>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {date.toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                        <span>{item.settings?.steps || 30} passos</span>
                                        <span className="w-px h-3 bg-slate-700" />
                                        <span>{item.timeElapsed || '--:--'}</span>
                                        {item.mesh_stats?.vertices && (
                                            <>
                                                <span className="w-px h-3 bg-slate-700" />
                                                <span>{item.mesh_stats.vertices.toLocaleString()} vértices</span>
                                            </>
                                        )}
                                    </div>
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
