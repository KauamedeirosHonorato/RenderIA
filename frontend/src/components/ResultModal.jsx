import React, { useState } from 'react';
import { Download, X, Clock, Layers, CheckCircle2, XCircle, Ruler, HelpCircle, Share2, Check } from 'lucide-react';
import ModelViewer from './ModelViewer';
import { API_BASE_URL } from '../config';

const ResultModal = ({ isOpen, onClose, modelUrl, taskInfo }) => {
    if (!isOpen) return null;

    const stats = taskInfo?.mesh_stats || {};
    const exportUrls = taskInfo?.export_urls || {};
    const hasStats = stats.vertices !== undefined && stats.vertices !== null;
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        if (!taskInfo?.id) return;
        const url = `${window.location.origin}/gallery?id=${taskInfo.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (format) => {
        // Build URL: prefer export_urls, fallback to modelUrl
        let url = null;
        if (exportUrls[format]) {
            url = `${API_BASE_URL}${exportUrls[format]}`;
        } else if (modelUrl) {
            // Fallback: replace the extension on the main model URL
            url = modelUrl.replace(/\.[^.]+$/, `.${format}`);
        }
        if (!url) {
            // Last resort: just use modelUrl as-is
            url = modelUrl;
        }
        if (!url) return;

        fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('text/html')) throw new Error('Servidor retornou HTML');
                return res.blob();
            })
            .then(blob => {
                if (blob.size < 100) {
                    alert("Download falhou: arquivo vazio. O modelo pode não existir mais no servidor.");
                    return;
                }
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `nexa_3d_${taskInfo?.id?.split('-')[0] || 'model'}.${format || 'glb'}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            })
            .catch(err => {
                console.error('Download falhou:', err);
                alert(`Download falhou: ${err.message}`);
            });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-6xl h-[85vh] bg-slate-900/90 border border-slate-700/50 shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden">

                {/* Left: 3D Viewport */}
                <div className="w-full md:w-3/4 h-[50vh] md:h-full relative bg-black/50 border-b md:border-b-0 md:border-r border-slate-700/50">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 backdrop-blur-md rounded-full text-blue-400 text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Visualização 4D Interativa
                    </div>

                    <div className="w-full h-full">
                        {modelUrl ? (
                            <ModelViewer modelUrl={modelUrl} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                Carregando modelo...
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Info & Actions */}
                <div className="w-full md:w-1/4 h-full p-5 flex flex-col gap-4 overflow-y-auto bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="mt-8 flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white mb-1">Resultado da Geração</h2>
                            <p className="text-xs text-slate-400">Modelo criado com sucesso a partir da sua imagem.</p>
                        </div>
                        <button
                            onClick={handleShare}
                            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold ${copied
                                    ? 'bg-green-500/20 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600 text-slate-300'
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Compartilhar'}</span>
                        </button>
                    </div>

                    {/* ═══ Stats ═══ */}
                    <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estatísticas</p>

                        {hasStats ? (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Vértices</p>
                                        <p className="text-base text-white font-mono font-bold">{stats.vertices?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Faces</p>
                                        <p className="text-base text-white font-mono font-bold">{stats.faces?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${stats.watertight
                                    ? 'bg-green-900/20 border-green-500/30'
                                    : 'bg-red-900/20 border-red-500/30'
                                    }`}>
                                    {stats.watertight ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    )}
                                    <div>
                                        <p className={`text-xs font-bold ${stats.watertight ? 'text-green-300' : 'text-red-300'}`}>
                                            {stats.watertight ? 'Malha Estanque' : 'Malha com Buracos'}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {stats.watertight ? 'Pronta para impressão 3D' : 'Pode precisar de reparo no Blender'}
                                        </p>
                                    </div>
                                </div>

                                {stats.dimensions && (
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 flex items-center gap-2.5">
                                        <Ruler className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Dimensões</p>
                                            <p className="text-xs text-white font-mono">
                                                {stats.dimensions.x} × {stats.dimensions.y} × {stats.dimensions.z}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-slate-800/30 border-slate-700/40">
                                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-slate-400">Estatísticas indisponíveis</p>
                                    <p className="text-[10px] text-slate-600">Atualize o notebook Colab para obter dados da malha</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ Generation Info ═══ */}
                    <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Geração</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-slate-500">Tempo</p>
                                    <p className="text-sm text-white font-mono">{taskInfo?.timeElapsed || '--:--'}</p>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-slate-500">Passos</p>
                                    <p className="text-sm text-white font-mono">{taskInfo?.settings?.steps || '30'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Downloads ═══ */}
                    <div className="pt-3 border-t border-slate-800 space-y-2.5 mt-auto">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exportar</p>

                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { fmt: 'glb', label: 'GLB', desc: 'Web', color: 'from-blue-600 to-indigo-600' },
                                { fmt: 'stl', label: 'STL', desc: '3D Print', color: 'from-emerald-600 to-green-600' },
                                { fmt: 'obj', label: 'OBJ', desc: 'Blender', color: 'from-purple-600 to-pink-600' },
                            ].map(({ fmt, label, desc, color }) => (
                                <button
                                    key={fmt}
                                    onClick={() => handleDownload(fmt)}
                                    disabled={!modelUrl}
                                    className={`flex flex-col items-center gap-0.5 bg-gradient-to-r ${color} hover:opacity-90 text-white font-semibold py-2.5 px-2 rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-xs font-bold">{label}</span>
                                    <span className="text-[9px] opacity-70">{desc}</span>
                                </button>
                            ))}
                        </div>

                        <p className="text-[10px] text-center text-slate-600">
                            GLB (Web/Unity) • STL (Impressão FDM/SLA) • OBJ (Blender/Maya)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultModal;
