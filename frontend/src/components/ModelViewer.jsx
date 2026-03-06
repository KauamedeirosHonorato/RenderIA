import React, { Suspense, useState, useEffect, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html, ContactShadows, Environment } from '@react-three/drei';

function Model({ url }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

// Error Boundary to catch useGLTF / Three.js crashes
class ModelErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('ModelErrorBoundary caught:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900">
                    <div className="text-center space-y-3 p-6">
                        <div className="text-4xl">⚠️</div>
                        <p className="text-red-400 font-medium text-sm">Erro ao renderizar modelo 3D</p>
                        <p className="text-slate-500 text-xs max-w-xs">{this.state.error?.message || 'Erro desconhecido'}</p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const Loader = () => (
    <Html center>
        <div className="flex flex-col items-center gap-3 bg-slate-900/80 p-6 rounded-2xl backdrop-blur-md border border-slate-700/50 shadow-2xl">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 border-r-indigo-500 rounded-full animate-spin" />
                <div className="absolute inset-2 border-4 border-transparent border-b-purple-500 border-l-blue-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
            </div>
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent font-mono text-sm tracking-widest animate-pulse font-bold">
                CARREGANDO MODELO 4D
            </span>
        </div>
    </Html>
);

const ModelViewer = ({ modelUrl }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [error, setError] = useState(null);
    const [loadingMsg, setLoadingMsg] = useState('Baixando modelo 3D...');

    useEffect(() => {
        if (!modelUrl) return;

        let objectUrl = null;
        let cancelled = false;

        const fetchModel = async (retries = 3) => {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    setLoadingMsg(`Baixando modelo 3D... (tentativa ${attempt}/${retries})`);

                    const response = await fetch(modelUrl, {
                        headers: {
                            'ngrok-skip-browser-warning': 'true',
                            'Accept': 'application/octet-stream, model/gltf-binary, */*'
                        }
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('text/html')) {
                        console.warn(`Tentativa ${attempt}: ngrok retornou HTML, tentando novamente...`);
                        if (attempt < retries) {
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        }
                        throw new Error('Servidor retornou página HTML em vez do modelo 3D. Tente recarregar.');
                    }

                    const blob = await response.blob();

                    // Validate blob has actual content
                    if (!blob || blob.size < 100) {
                        console.warn(`Tentativa ${attempt}: blob vazio (${blob?.size || 0} bytes)`);
                        if (attempt < retries) {
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        }
                        throw new Error(`Modelo retornado está vazio (${blob?.size || 0} bytes). O arquivo pode não existir mais no servidor.`);
                    }

                    if (cancelled) return;
                    objectUrl = URL.createObjectURL(blob);
                    setBlobUrl(objectUrl);
                    return;
                } catch (err) {
                    if (attempt === retries) {
                        console.error('Erro ao carregar modelo:', err);
                        if (!cancelled) setError(err.message);
                    }
                }
            }
        };
        fetchModel();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [modelUrl]);

    if (error) {
        return (
            <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-3 p-6">
                    <div className="text-4xl">❌</div>
                    <p className="text-red-400 font-medium text-sm">Erro ao carregar modelo</p>
                    <p className="text-slate-500 text-xs max-w-xs">{error}</p>
                    <button
                        onClick={() => { setError(null); setBlobUrl(null); }}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (!blobUrl) {
        return (
            <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 border-r-indigo-500 rounded-full animate-spin" />
                    </div>
                    <span className="text-sm text-cyan-400 font-mono animate-pulse">{loadingMsg}</span>
                </div>
            </div>
        );
    }

    return (
        <ModelErrorBoundary>
            <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 overflow-hidden relative group">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30 pointer-events-none" />

                <Canvas shadows camera={{ position: [5, 3, 10], fov: 35 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
                    <Suspense fallback={<Loader />}>
                        <ambientLight intensity={0.4} />
                        <directionalLight castShadow position={[5, 10, 5]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
                        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#4f46e5" />

                        <Stage environment="studio" intensity={0.8} adjustCamera={1.2}>
                            <Model url={blobUrl} />
                        </Stage>

                        <ContactShadows position={[0, -0.5, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
                        <Environment preset="city" />
                    </Suspense>

                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={1.5}
                        enableDamping
                        dampingFactor={0.05}
                        minDistance={2}
                        maxDistance={20}
                        makeDefault
                    />
                </Canvas>

                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 pointer-events-none flex flex-col gap-1">
                    <div className="text-xs font-mono text-cyan-400 font-bold tracking-widest opacity-80 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                        NEXA ENGINE 4D
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 tracking-wider">
                        RENDERIZAÇÃO INTERATIVA
                    </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 px-4 py-2 rounded-full text-xs text-slate-300 font-medium opacity-100 group-hover:opacity-0 transition-opacity duration-500">
                    Arraste para rotacionar • Scroll para zoom
                </div>
            </div>
        </ModelErrorBoundary>
    );
};

export default ModelViewer;
