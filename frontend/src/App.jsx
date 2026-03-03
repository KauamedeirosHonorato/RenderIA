import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Cuboid, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ModelViewer from './components/ModelViewer';

// Helper Components
const StatusBadge = ({ status }) => {
  const config = {
    processing: { color: 'bg-blue-400', pulse: true },
    completed: { color: 'bg-green-400', pulse: false },
    failed: { color: 'bg-red-400', pulse: false },
  };
  const style = config[status] || { color: 'bg-slate-400', pulse: false };

  return (
    <span className={`w-2 h-2 rounded-full ${style.color} ${style.pulse ? 'animate-pulse' : ''}`} />
  );
};

const Timer = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      <span>{format(seconds)}</span>
    </div>
  );
};

const TIPS_LIST = [
  "Did you know? Hunyuan3D uses a two-stage process: Shape generation followed by Texture painting.",
  "Tip: Lowering 'steps' reduces quality but speeds up generation significantly.",
  "Fun Fact: 3D meshes are composed of thousands of tiny triangles called polygons.",
  "Tip: Use a clear background in your input image for better geometry extraction.",
  "Did you know? The texture model paints the 3D object from multiple angles automatically.",
  "Please wait... AI models are loading into VRAM for faster subsequent responses."
];

const Tips = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % TIPS_LIST.length);
    }, 5000); // Change tip every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-4 p-3 bg-cyan-900/10 border border-cyan-500/20 rounded-lg">
      <p className="text-xs text-cyan-200/80 italic animate-[fade-in_0.5s_ease-out]">
        "{TIPS_LIST[index]}"
      </p>
    </div>
  );
};

function App() {
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null); // 'processing', 'completed', 'failed'
  const [modelUrl, setModelUrl] = useState(null);

  // Polling Logic
  useEffect(() => {
    let interval;
    if (taskId && status !== 'completed' && status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/status/${taskId}`);
          const newStatus = response.data.status;
          setStatus(newStatus);

          if (newStatus === 'completed') {
            // Backend returns relative path /models/xxx.glb. Prepend API URL.
            setModelUrl(`http://127.0.0.1:8000${response.data.model_url}`);
            clearInterval(interval);
          } else if (newStatus === 'failed') {
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [taskId, status]);

  const handleUploadSuccess = (id) => {
    setTaskId(id);
    setStatus('processing');
    setModelUrl(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8 gap-8">
      {/* Header */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
            <Cuboid className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Nexa 3D Gen
            </h1>
            <p className="text-sm text-slate-400">Generative AI 3D Pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><Layers className="w-4 h-4" /> v0.1.0-alpha</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start">

        {/* Left Panel: Upload & Status */}
        <section className="w-full lg:w-1/3 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Input
            </h2>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Status Card */}
          {status && (
            <div className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-500 ${status === 'processing' ? 'border-blue-500/30 bg-blue-900/10' :
              status === 'completed' ? 'border-green-500/30 bg-green-900/10' :
                'border-red-500/30 bg-red-900/10'
              }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-400">Status</span>
                <StatusBadge status={status} />
              </div>

              <div className="text-2xl font-bold capitalize flex items-center gap-2 mb-2">
                {status === 'processing' && "Generating Assets..."}
                {status === 'completed' && <><CheckCircle className="w-6 h-6 text-green-400" /> Ready</>}
                {status === 'failed' && <><AlertCircle className="w-6 h-6 text-red-400" /> Failed</>}
              </div>

              {status === 'processing' && (
                <div className="space-y-4">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                    <div className="h-full bg-blue-500 animate-[progress_3s_ease-in-out_infinite] w-1/3 blur-[2px]" />
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>Initializing AI</span>
                    <span className="animate-pulse">Generating Mesh...</span>
                    <span>Texturing</span>
                  </div>

                  <Timer />
                  <Tips />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Panel: Visualization */}
        <section className="w-full lg:w-2/3">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl h-full min-h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Cuboid className="w-5 h-5 text-indigo-400" />
              3D Viewport
            </h2>

            <div className="flex-1 rounded-lg overflow-hidden bg-slate-950 relative">
              {modelUrl ? (
                <ModelViewer modelUrl={modelUrl} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4">
                  <Cuboid className="w-16 h-16 opacity-20" />
                  <p>Model will appear here</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
