import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Layers, Cuboid, Zap, CheckCircle, AlertCircle, Clock, Check, Loader2, Globe, Wifi } from 'lucide-react';
import FileUpload from './components/FileUpload';
import HistorySidebar from './components/HistorySidebar';
import ResultModal from './components/ResultModal';
import { API_BASE_URL, setApiUrl } from './config';

// Helper Components
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
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % TIPS_LIST.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-6 p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl">
      <p className="text-sm text-cyan-200/80 italic font-medium">
        "{TIPS_LIST[index]}"
      </p>
    </div>
  );
};

const formatTime = (s) => {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const ProgressStepper = ({ status, timeElapsed, queuePosition }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (status !== 'processing') return;

    const timers = [
      setTimeout(() => setCurrentStep(1), 5000),      // Initializing AI
      setTimeout(() => setCurrentStep(2), 30000),     // Generating Geometry
      setTimeout(() => setCurrentStep(3), 120000),    // Texturing
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
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <div>
            <p className="text-sm font-bold text-white">Aguardando na Fila</p>
            <p className="text-xs text-slate-400">Posição: {queuePosition || 1} • Aguardando GPU ficar disponível.</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-800" />

          <div className="space-y-6 relative">
            {steps.map((step, index) => {
              const isCompleted = currentStep > index || status === 'completed';
              const isActive = currentStep === index && status === 'processing';
              const isPending = currentStep < index && status !== 'completed';

              return (
                <div key={index} className={`flex gap-4 ${isPending ? 'opacity-40' : 'opacity-100'} transition-opacity duration-500`}>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 shadow-lg
                      ${isCompleted ? 'bg-green-500 text-slate-900' :
                        isActive ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                          'bg-slate-800 border-2 border-slate-700'}`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> :
                        isActive ? <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> : null}
                    </div>
                  </div>

                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-bold ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
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
          <p>Este processo é muito intensivo e pode levar <b>~3 a 5 minutos</b> no Colab (ou mais localmente). Não feche esta janela.</p>
        </div>
      )}
    </div>
  );
};

// Component to track a single generation task independently
const ActiveGenerationCard = ({ taskId, onComplete, onFail, onViewModel }) => {
  const [status, setStatus] = useState('queued'); // 'queued', 'processing', 'completed', 'failed'
  const [queuePosition, setQueuePosition] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const secondsRef = useRef(0); // Track seconds without triggering re-renders

  // Timer logic
  useEffect(() => {
    if (status === 'processing') {
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Polling Logic (separate from timer - NO seconds dependency!)
  useEffect(() => {
    let interval;
    if (status !== 'completed' && status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/status/${taskId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          const newStatus = response.data.status;

          if (newStatus === 'queued') {
            setStatus('queued');
            setQueuePosition(response.data.queue_position);
          } else if (newStatus === 'processing') {
            setStatus('processing');
          } else if (newStatus === 'completed') {
            setStatus('completed');
            clearInterval(interval);

            const finalModelUrl = `${API_BASE_URL}${response.data.model_url}`;
            const timeElapsedStr = formatTime(secondsRef.current);

            const historyItem = {
              id: taskId,
              status: newStatus,
              modelUrl: finalModelUrl,
              timestamp: new Date().toISOString(),
              timeElapsed: timeElapsedStr,
              settings: response.data.settings,
              mesh_stats: response.data.mesh_stats || {},
              export_urls: response.data.export_urls || {},
            };

            onComplete(historyItem);

          } else if (newStatus === 'failed') {
            setStatus('failed');
            clearInterval(interval);
            onFail(taskId);
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000); // Check every 3s
    }
    return () => clearInterval(interval);
  }, [taskId, status]);

  // Once completed, it shows a minimal finalized card
  if (status === 'completed') {
    return (
      <div className="mt-6 p-4 rounded-xl border border-green-500/30 bg-green-900/10 flex items-center justify-between animate-[fade-in_0.5s_ease-out]">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <span className="text-sm font-bold text-green-100 block">Geração Concluída</span>
            <span className="text-xs font-mono text-green-400/70">ID: {taskId.split('-')[0]}</span>
          </div>
        </div>
        <button
          onClick={() => onViewModel(taskId)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          <Cuboid className="w-4 h-4" />
          Ver
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t border-slate-800/80 animate-[fade-in_0.5s_ease-out]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-slate-500">TASK ID: {taskId.split('-')[0]}...</span>
      </div>

      <ProgressStepper status={status} timeElapsed={formatTime(seconds)} queuePosition={queuePosition} />
      {status === 'processing' && <Tips />}

      {status === 'failed' && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Geração falhou. Verifique o console do servidor.</p>
        </div>
      )}
    </div>
  );
};

function App() {
  const [activeTasks, setActiveTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const historyLoaded = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModel, setActiveModel] = useState(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexa_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
    historyLoaded.current = true;
  }, []);

  // Save history to local storage when updated (only after initial load)
  useEffect(() => {
    if (!historyLoaded.current) return;
    localStorage.setItem('nexa_history', JSON.stringify(history));
  }, [history]);

  const handleUploadSuccess = (taskId) => {
    // Add new task to active tracking
    setActiveTasks(prev => [{ id: taskId, timestamp: Date.now() }, ...prev]);
  };

  const handleTaskComplete = useCallback((historyItem) => {
    setHistory(prev => [historyItem, ...prev]);
  }, []);

  const handleTaskFail = useCallback((failedTaskId) => {
    console.log(`Task ${failedTaskId} failed.`);
  }, []);

  const handleViewModel = (taskId) => {
    const item = history.find(h => h.id === taskId);
    if (item) {
      setActiveModel(item);
      setIsModalOpen(true);
    }
  };

  const handleOpenHistoryItem = (item) => {
    setActiveModel(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 lg:p-8 gap-8">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto border-b border-slate-800 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Cuboid className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                Nexa 3D Gen
              </h1>
              <p className="text-sm text-slate-400 font-medium">Pipeline IA Generativa 4D com Fila</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-500 tracking-widest uppercase">
            <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> v2.0.0</span>
          </div>
        </div>

        {/* Server Connection Bar */}
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <div className={`flex items-center gap-2 shrink-0 ${API_BASE_URL.includes('ngrok') ? 'text-green-400' : 'text-yellow-400'}`}>
            {API_BASE_URL.includes('ngrok') ? <Globe className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">
              {API_BASE_URL.includes('ngrok') ? 'Nuvem' : 'Local'}
            </span>
          </div>
          <input
            type="text"
            defaultValue={API_BASE_URL}
            placeholder="Cole a URL do Colab aqui (ex: https://xxxx.ngrok-free.app)"
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
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start flex-1">

        {/* Left Column: Actions & Progress (60%) */}
        <div className="w-full lg:w-3/5 space-y-6">
          <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
              <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
              Enviar & Gerar Modelo
            </h2>

            <div>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* List of Active Generation Tasks */}
            {activeTasks.map((task) => (
              <ActiveGenerationCard
                key={task.id}
                taskId={task.id}
                onComplete={handleTaskComplete}
                onFail={handleTaskFail}
                onViewModel={handleViewModel}
              />
            ))}

          </section>
        </div>

        {/* Right Column: History Sidebar (40%) */}
        <div className="w-full lg:w-2/5 h-[800px] sticky top-8">
          <HistorySidebar
            history={history}
            activeTaskId={activeModel?.id}
            onSelect={handleOpenHistoryItem}
            onClear={() => setHistory([])}
          />
        </div>

      </main>

      {/* Interactive 4D Modal */}
      <ResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modelUrl={activeModel?.modelUrl}
        taskInfo={activeModel}
      />
    </div>
  );
}

export default App;
