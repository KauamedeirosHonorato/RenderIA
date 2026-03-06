import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertCircle, Clock, Check, Loader2, Cuboid, Globe, Wifi } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import HistorySidebar from '../components/HistorySidebar';
import ResultModal from '../components/ResultModal';
import { useGeneration } from '../contexts/GenerationContext';
import { API_BASE_URL, setApiUrl } from '../config';

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════
const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

const Tips = () => {
    const TIPS_LIST = [
        "Sabia que? O Hunyuan3D usa um processo em duas etapas: Geração de forma seguida de Pintura de textura.",
        "Dica: Reduzir os 'steps' diminui a qualidade mas acelera muito a geração.",
        "Curiosidade: Malhas 3D são compostas por milhares de triângulos chamados polígonos.",
        "Sabia que? O modelo de textura pinta o objeto 3D de múltiplos ângulos automaticamente.",
        "Operação Pesada: Sua GPU está trabalhando duro. Relaxe e tome um café ☕",
        "Sistema de Fila: As tarefas são processadas uma por vez para evitar travamentos."
    ];
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setIndex(prev => (prev + 1) % TIPS_LIST.length), 6000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="mt-6 p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl">
            <p className="text-sm text-cyan-200/80 italic font-medium">"{TIPS_LIST[index]}"</p>
        </div>
    );
};

const ProgressStepper = ({ status, timeElapsed, queuePosition }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (status !== 'processing') return;
        const timers = [
            setTimeout(() => setCurrentStep(1), 5000),
            setTimeout(() => setCurrentStep(2), 30000),
            setTimeout(() => setCurrentStep(3), 120000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [status]);

    useEffect(() => {
        if (status === 'completed') setCurrentStep(4);
        if (status === 'failed') setCurrentStep(0);
        if (status === 'queued') setCurrentStep(-1);
    }, [status]);

    const steps = [
        { label: "Inicializando Modelo IA", desc: "Carregando pesos na VRAM" },
        { label: "Gerando Geometria", desc: "Criando malha 3D base" },
        { label: "Texturizando Objeto", desc: "Pintando detalhes a partir da imagem" },
        { label: "Finalizando Modelo", desc: "Exportando no formato .GLB" }
    ];

    return (
        <div className="space-y-6 mt-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    {status === 'queued' ? 'Status: Na Fila' : 'Progresso da Geração'}
                </h3>
                {status === 'processing' && (
                    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-sm text-cyan-400 font-bold">{timeElapsed || "0:00"}</span>
                    </div>
                )}
            </div>

            {status === 'queued' ? (
                <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl relative overflow-hidden">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <div>
                        <p className="text-sm font-bold text-white">Aguardando na Fila</p>
                        <p className="text-xs text-slate-400">Posição: {queuePosition || 1} • Aguardando GPU.</p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-800" />
                    <div className="space-y-6 relative">
                        {steps.map((step, idx) => {
                            const isCompleted = currentStep > idx || status === 'completed';
                            const isActive = currentStep === idx && status === 'processing';
                            const isPending = currentStep < idx && status !== 'completed';
                            return (
                                <div key={idx} className={`flex gap-4 ${isPending ? 'opacity-40' : ''} transition-opacity duration-500`}>
                                    <div className="relative z-10">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 shadow-lg
                                            ${isCompleted ? 'bg-green-500 text-slate-900' : isActive ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-2 border-slate-700'}`}>
                                            {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : isActive ? <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> : null}
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <p className={`text-sm font-bold ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-slate-400'}`}>{step.label}</p>
                                        <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {status === 'processing' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/80 text-xs p-4 rounded-xl mt-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p>Este processo pode levar <b>~3 a 5 minutos</b> no Colab. Não feche esta janela.</p>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════
// Active Task Card (reads from context, no local polling)
// ═══════════════════════════════════════════════
const ActiveTaskCard = ({ task, onViewModel }) => {
    if (task.status === 'completed') {
        return (
            <div className="mt-6 p-4 rounded-xl border border-green-500/30 bg-green-900/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                        <span className="text-sm font-bold text-green-100 block">Geração Concluída</span>
                        <span className="text-xs font-mono text-green-400/70">ID: {task.id.split('-')[0]}</span>
                    </div>
                </div>
                <button onClick={() => onViewModel(task.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2">
                    <Cuboid className="w-4 h-4" /> Ver
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8 pt-8 border-t border-slate-800/80">
            <span className="text-xs font-mono text-slate-500">TASK ID: {task.id.split('-')[0]}...</span>
            <ProgressStepper
                status={task.status || 'queued'}
                timeElapsed={formatTime(task.seconds || 0)}
                queuePosition={task.queuePosition}
            />
            {task.status === 'processing' && <Tips />}
            {task.status === 'failed' && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">Geração falhou. Verifique o console do servidor.</p>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════
// Generate Page (uses global context)
// ═══════════════════════════════════════════════
const GeneratePage = () => {
    const {
        activeTasks, history, isModalOpen, activeModel,
        addTask, viewModel, openHistoryItem, closeModal, clearHistory
    } = useGeneration();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Server Bar */}
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 mb-8">
                <div className={`flex items-center gap-2 shrink-0 ${API_BASE_URL.includes('ngrok') ? 'text-green-400' : 'text-yellow-400'}`}>
                    {API_BASE_URL.includes('ngrok') ? <Globe className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {API_BASE_URL.includes('ngrok') ? 'Nuvem' : 'Local'}
                    </span>
                </div>
                <input
                    type="text"
                    defaultValue={API_BASE_URL}
                    placeholder="Cole a URL do Colab (ex: https://xxxx.ngrok-free.app)"
                    className="flex-1 bg-transparent border-none text-sm text-slate-300 placeholder-slate-600 outline-none font-mono"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = e.target.value.trim().replace(/\/$/, '');
                            if (val) setApiUrl(val);
                        }
                    }}
                />
                <span className="text-[10px] text-slate-600 shrink-0">Enter para salvar</span>
            </div>

            {/* Layout */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left */}
                <div className="w-full lg:w-3/5 space-y-6">
                    <section className="glass rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                            <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
                            Enviar & Gerar Modelo
                        </h2>

                        <FileUpload onUploadSuccess={addTask} />

                        {activeTasks.map((task) => (
                            <ActiveTaskCard key={task.id} task={task} onViewModel={viewModel} />
                        ))}
                    </section>
                </div>

                {/* Right */}
                <div className="w-full lg:w-2/5 h-[800px] sticky top-24">
                    <HistorySidebar
                        history={history}
                        activeTaskId={activeModel?.id}
                        onSelect={openHistoryItem}
                        onClear={clearHistory}
                    />
                </div>
            </div>

            <ResultModal
                isOpen={isModalOpen}
                onClose={closeModal}
                modelUrl={activeModel?.modelUrl}
                taskInfo={activeModel}
            />
        </div>
    );
};

export default GeneratePage;
