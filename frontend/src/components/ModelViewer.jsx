import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html } from '@react-three/drei';

function Model({ url }) {
    // Pass url directly to useGLTF. Ensure your backend serves standard GLBs.
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

const Loader = () => (
    <Html center>
        <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-cyan-400 font-mono text-sm animate-pulse">LOADING ASSET...</span>
        </div>
    </Html>
);

const ModelViewer = ({ modelUrl }) => {
    return (
        <div className="w-full h-[500px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative">
            {/* Grid Background Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

            <Canvas shadows camera={{ position: [4, 2, 8], fov: 45 }}>
                <Suspense fallback={<Loader />}>
                    <Stage environment="city" intensity={0.6}>
                        <Model url={modelUrl} />
                    </Stage>
                </Suspense>
                <OrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />
            </Canvas>

            <div className="absolute bottom-4 left-4 pointer-events-none text-xs text-slate-500 font-mono">
                NEXA 3D_VIEWER v1.0
            </div>
        </div>
    );
};

export default ModelViewer;
