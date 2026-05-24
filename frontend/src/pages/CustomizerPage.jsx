import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, ContactShadows, Environment, Decal, useTexture, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { 
    Cuboid, Palette, Image as ImageIcon, Sliders, 
    Download, RefreshCw, Upload, Sparkles, Move,
    Layers, AlertCircle, CheckCircle, RotateCw, ZoomIn,
    Save, Coffee, Box, Printer
} from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ═══════════════════════════════════════════════
// Sub-Components inside R3F Canvas
// ═══════════════════════════════════════════════

// Decal texture projection component (mounted conditionally)
function ProjectedDecal({ imageUrl, position, rotation, scale }) {
    const texture = useTexture(imageUrl);
    
    useEffect(() => {
        if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.needsUpdate = true;
        }
    }, [texture]);

    return (
        <Decal
            name="projected-decal"
            position={position}
            rotation={rotation}
            scale={scale}
            map={texture}
            polygonOffset
            polygonOffsetFactor={-10}
        />
    );
}

// 3D Ornament model component (mounted conditionally)
function OrnamentModel({ url, position, rotation, scale, styleType, baseColor, materialProps }) {
    const { scene } = useGLTF(url);
    const clonedScene = React.useMemo(() => {
        const clone = scene.clone();
        clone.name = "Adorno_3D_IA";
        clone.traverse((child) => {
            if (child.isMesh) {
                child.name = "Adorno_3D_Malha";
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (styleType === 'original') {
                    if (child.material) {
                        child.material.roughness = 0.45;
                        child.material.metalness = 0.15;
                        child.material.needsUpdate = true;
                    }
                } else {
                    let matProps = {};
                    if (styleType === 'gold') {
                        matProps = {
                            color: new THREE.Color('#d4af37'),
                            roughness: 0.15,
                            metalness: 0.95,
                            clearcoat: 0.6,
                            clearcoatRoughness: 0.05,
                        };
                    } else if (styleType === 'silver') {
                        matProps = {
                            color: new THREE.Color('#e5e5e5'),
                            roughness: 0.12,
                            metalness: 0.98,
                            clearcoat: 0.6,
                            clearcoatRoughness: 0.05,
                        };
                    } else if (styleType === 'copper') {
                        matProps = {
                            color: new THREE.Color('#b87333'),
                            roughness: 0.18,
                            metalness: 0.92,
                            clearcoat: 0.3,
                        };
                    } else if (styleType === 'glass') {
                        matProps = {
                            color: new THREE.Color('#e0f2fe'),
                            roughness: 0.05,
                            transmission: 0.95,
                            thickness: 1.0,
                            transparent: true,
                            opacity: 0.35,
                            clearcoat: 1.0,
                        };
                    } else if (styleType === 'clay') {
                        matProps = {
                            color: new THREE.Color(baseColor),
                            ...materialProps,
                        };
                    }
                    
                    const MaterialClass = styleType === 'glass' ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
                    child.material = new MaterialClass(matProps);
                }
            }
        });
        return clone;
    }, [scene, styleType, baseColor, materialProps]);
    
    return (
        <primitive 
            object={clonedScene} 
            position={position} 
            rotation={rotation} 
            scale={scale} 
        />
    );
}

// 3D Liquid mesh component inside the product cavity
function LiquidModel({ productType, showLiquid, liquidType, liquidLevel }) {
    if (!showLiquid || liquidLevel <= 0.05) return null;

    const PRESETS = {
        cafe: { 
            color: new THREE.Color('#1f0d07'), 
            roughness: 0.1, 
            metalness: 0.05, 
            transmission: 0.0, 
            transparent: false 
        },
        cha: { 
            color: new THREE.Color('#f59e0b'), 
            roughness: 0.05, 
            metalness: 0.0, 
            transmission: 0.85, 
            transparent: true, 
            opacity: 0.8, 
            thickness: 0.8 
        },
        leite: { 
            color: new THREE.Color('#faf8f2'), 
            roughness: 0.35, 
            metalness: 0.0, 
            transmission: 0.0, 
            transparent: false 
        },
        cola: { 
            color: new THREE.Color('#0f0502'), 
            roughness: 0.08, 
            metalness: 0.1, 
            transmission: 0.15, 
            transparent: true, 
            opacity: 0.95,
            thickness: 0.5
        },
        agua: { 
            color: new THREE.Color('#dbeafe'), 
            roughness: 0.02, 
            metalness: 0.0, 
            transmission: 0.98, 
            transparent: true, 
            opacity: 0.25, 
            thickness: 1.0 
        }
    };

    const props = PRESETS[liquidType] || PRESETS.cafe;
    const MaterialComponent = props.transmission > 0 ? 'meshPhysicalMaterial' : 'meshStandardMaterial';

    if (productType === 'caneca') {
        const radius = 0.85;
        const maxHeight = 1.7;
        const height = maxHeight * liquidLevel;
        const posY = -0.85 + height / 2;
        return (
            <mesh name="Caneca_Liquido" position={[0, posY, 0]}>
                <cylinderGeometry args={[radius, radius, height, 32, 1, false]} />
                <MaterialComponent {...props} />
            </mesh>
        );
    } else if (productType === 'chicara') {
        const maxHeight = 1.0;
        const height = maxHeight * liquidLevel;
        const posY = -0.52 + height / 2;
        const rBottom = 0.58;
        const rTop = rBottom + (1.05 - rBottom) * liquidLevel;
        return (
            <mesh name="Chicara_Liquido" position={[0, posY, 0]}>
                <cylinderGeometry args={[rTop, rBottom, height, 32, 1, false]} />
                <MaterialComponent {...props} />
            </mesh>
        );
    } else { // copo
        const maxHeight = 2.2;
        const height = maxHeight * liquidLevel;
        const posY = -1.15 + height / 2;
        const rBottom = 0.61;
        const rTop = rBottom + (0.82 - rBottom) * liquidLevel;
        return (
            <mesh name="Copo_Liquido" position={[0, posY, 0]}>
                <cylinderGeometry args={[rTop, rBottom, height, 32, 1, false]} />
                <MaterialComponent {...props} />
            </mesh>
        );
    }
}

// Helper to transform global/cylinder coordinate space into handle local space
function getLocalDecalProps(x, y, z, decalAngle, decalRot, handlePos, handleRot) {
    const decalOb = new THREE.Object3D();
    decalOb.position.set(x, y, z);
    decalOb.rotation.set(0, decalAngle, decalRot);
    decalOb.updateMatrix();

    const handleOb = new THREE.Object3D();
    handleOb.position.fromArray(handlePos);
    handleOb.rotation.fromArray(handleRot);
    handleOb.updateMatrix();

    const handleInv = handleOb.matrix.clone().invert();
    const localMatrix = decalOb.matrix.clone().premultiply(handleInv);

    const localPos = new THREE.Vector3();
    const localRot = new THREE.Quaternion();
    const localScl = new THREE.Vector3();
    localMatrix.decompose(localPos, localRot, localScl);

    const pos = [localPos.x, localPos.y, localPos.z];
    const rot = new THREE.Euler().setFromQuaternion(localRot);
    return { pos, rot: [rot.x, rot.y, rot.z] };
}

// Error boundary to prevent 3D canvas crashes when blob or image URLs fail to load
class DecalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.warn("Decal loading failed. Auto-healing by resetting the invalid URL:", error);
        if (this.props.onError) {
            // Avoid state transition loops by scheduling the callback in the next tick
            setTimeout(() => {
                this.props.onError();
            }, 0);
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.imageUrl !== this.props.imageUrl) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
            return null; // Return null instead of crashing the viewport
        }
        return this.props.children;
    }
}

// R3F Component to render the procedural shapes with specific materials
const ProductModel = React.forwardRef(({ 
    productType, 
    baseColor, 
    materialType, 
    decalUrl, 
    decalPos, 
    decalRot, 
    decalScale,
    ornamentUrl,
    ornamentPos,
    ornamentRot,
    ornamentScale,
    ornamentStyle,
    showLiquid,
    liquidType,
    liquidLevel,
    individualHandle,
    handleDecalUrl,
    handleDecalSize,
    onDecalError,
    onHandleDecalError
}, ref) => {
    // 1. Configure the R3F material based on the selected finish
    let materialProps = { color: baseColor };
    
    if (materialType === 'ceramic') {
        materialProps = {
            ...materialProps,
            roughness: 0.15,
            metalness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
        };
    } else if (materialType === 'matte') {
        materialProps = {
            ...materialProps,
            roughness: 0.8,
            metalness: 0.0,
        };
    } else if (materialType === 'metal') {
        materialProps = {
            ...materialProps,
            roughness: 0.25,
            metalness: 0.95,
            clearcoat: 0.4,
        };
    } else if (materialType === 'glass') {
        materialProps = {
            ...materialProps,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 1.2,
            transparent: true,
            opacity: 0.35,
            clearcoat: 1.0,
        };
    }

    const MaterialComponent = materialType === 'glass' ? 'meshPhysicalMaterial' : 'meshStandardMaterial';

    // Cylindrical Coordinate mapping to slide decal all 360 degrees around the cylinder normal
    const radius = productType === 'caneca' ? 0.95 : productType === 'chicara' ? 0.90 : 0.80;
    const decalAngle = (decalPos[0] / 1.5) * Math.PI; // Maps -1.5..1.5 to -PI..PI
    
    // Cylindrical coordinate calculation
    const px = radius * Math.sin(decalAngle);
    const pz = radius * Math.cos(decalAngle);
    const py = decalPos[1];
    
    const cylinderDecalPos = [px, py, pz];
    const cylinderDecalRot = [0, decalAngle, decalRot];

    // 2. Render geometries based on product selection
    if (productType === 'caneca') {
        const mugHandlePos = [-0.95, 0, 0];
        const mugHandleRot = [0, 0, Math.PI / 2];
        const mugHandleDecal = getLocalDecalProps(
            px, py, pz,
            decalAngle, decalRot,
            mugHandlePos, mugHandleRot
        );

        // Calculate handle decal properties based on individual handle configuration
        let activeHandleDecalUrl = null;
        let activeHandleDecalPos = null;
        let activeHandleDecalRot = null;
        let activeHandleDecalScale = [decalScale[0], decalScale[1], 2.5];

        if (!individualHandle) {
            if (decalUrl) {
                activeHandleDecalUrl = decalUrl;
                activeHandleDecalPos = mugHandleDecal.pos;
                activeHandleDecalRot = mugHandleDecal.rot;
            }
        } else {
            if (handleDecalUrl) {
                const handleDecalAngle = -Math.PI / 2; // Facing left handle
                const hx = radius * Math.sin(handleDecalAngle);
                const hz = radius * Math.cos(handleDecalAngle);
                const hy = 0.0;
                const centeredHandleDecal = getLocalDecalProps(
                    hx, hy, hz,
                    handleDecalAngle, 0.0,
                    mugHandlePos, mugHandleRot
                );
                
                activeHandleDecalUrl = handleDecalUrl;
                activeHandleDecalPos = centeredHandleDecal.pos;
                activeHandleDecalRot = centeredHandleDecal.rot;
                activeHandleDecalScale = [handleDecalSize, handleDecalSize, 2.5];
            }
        }

        // MUG: hollow body + torus handle + rim + bottom
        return (
            <group ref={ref} name="Caneca_Completa">
                {/* Outer Wall (Open Cylinder) */}
                <mesh name="Caneca_Parede_Externa" castShadow receiveShadow>
                    <cylinderGeometry args={[0.95, 0.95, 2.0, 32, 1, true]} />
                    <MaterialComponent {...materialProps} />
                    {decalUrl && (
                        <DecalErrorBoundary imageUrl={decalUrl} onError={onDecalError}>
                            <ProjectedDecal 
                                imageUrl={decalUrl} 
                                position={cylinderDecalPos} 
                                rotation={cylinderDecalRot} 
                                scale={[decalScale[0], decalScale[1], 0.5]} 
                            />
                        </DecalErrorBoundary>
                    )}
                </mesh>

                {/* Inner Wall (Open Cylinder, BackSide) */}
                <mesh name="Caneca_Parede_Interna" position={[0, 0.05, 0]}>
                    <cylinderGeometry args={[0.87, 0.87, 1.9, 32, 1, true]} />
                    <MaterialComponent {...materialProps} side={THREE.BackSide} />
                </mesh>

                {/* Top Rim (Ring) */}
                <mesh name="Caneca_Borda_Superior" position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.87, 0.95, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Inner Bottom (Circle) */}
                <mesh name="Caneca_Fundo_Interno" position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.87, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Outer Bottom (Circle) */}
                <mesh name="Caneca_Fundo_Externo" position={[0, -1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.95, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Handle (Hollow C-shape Torus, no intersection inside) */}
                <mesh name="Caneca_Alca" castShadow position={mugHandlePos} rotation={mugHandleRot}>
                    <torusGeometry args={[0.6, 0.11, 16, 64, Math.PI]} />
                    <MaterialComponent {...materialProps} />
                    {activeHandleDecalUrl && (
                        <DecalErrorBoundary 
                            imageUrl={activeHandleDecalUrl} 
                            onError={individualHandle ? onHandleDecalError : onDecalError}
                        >
                            <ProjectedDecal 
                                imageUrl={activeHandleDecalUrl} 
                                position={activeHandleDecalPos} 
                                rotation={activeHandleDecalRot} 
                                scale={activeHandleDecalScale} 
                            />
                        </DecalErrorBoundary>
                    )}
                </mesh>

                {/* Liquid inside the Mug */}
                <LiquidModel 
                    productType={productType}
                    showLiquid={showLiquid}
                    liquidType={liquidType}
                    liquidLevel={liquidLevel}
                />

                {/* Optional 3D Ornament placement */}
                {ornamentUrl && (
                    <OrnamentModel 
                        url={ornamentUrl} 
                        position={ornamentPos} 
                        rotation={ornamentRot} 
                        scale={ornamentScale} 
                        styleType={ornamentStyle}
                        baseColor={baseColor}
                        materialProps={materialProps}
                    />
                )}
            </group>
        );
    } else if (productType === 'chicara') {
        const teacupHandlePos = [-0.9, -0.05, 0];
        const teacupHandleRot = [0, 0, Math.PI / 2];
        const teacupHandleDecal = getLocalDecalProps(
            px, py, pz,
            decalAngle, decalRot,
            teacupHandlePos, teacupHandleRot
        );

        // Calculate handle decal properties based on individual handle configuration
        let activeHandleDecalUrl = null;
        let activeHandleDecalPos = null;
        let activeHandleDecalRot = null;
        let activeHandleDecalScale = [decalScale[0], decalScale[1], 2.5];

        if (!individualHandle) {
            if (decalUrl) {
                activeHandleDecalUrl = decalUrl;
                activeHandleDecalPos = teacupHandleDecal.pos;
                activeHandleDecalRot = teacupHandleDecal.rot;
            }
        } else {
            if (handleDecalUrl) {
                const handleDecalAngle = -Math.PI / 2; // Facing left handle
                const hx = radius * Math.sin(handleDecalAngle);
                const hz = radius * Math.cos(handleDecalAngle);
                const hy = -0.05;
                const centeredHandleDecal = getLocalDecalProps(
                    hx, hy, hz,
                    handleDecalAngle, 0.0,
                    teacupHandlePos, teacupHandleRot
                );
                
                activeHandleDecalUrl = handleDecalUrl;
                activeHandleDecalPos = centeredHandleDecal.pos;
                activeHandleDecalRot = centeredHandleDecal.rot;
                activeHandleDecalScale = [handleDecalSize, handleDecalSize, 2.5];
            }
        }

        // TEACUP: tapered wider cylinder + torus handle + saucer plate
        return (
            <group ref={ref} name="Chicara_Completa" position={[0, 0.1, 0]}>
                {/* Outer Wall (Tapered Open Cylinder) */}
                <mesh name="Chicara_Parede_Externa" castShadow receiveShadow>
                    <cylinderGeometry args={[1.15, 0.65, 1.2, 32, 1, true]} />
                    <MaterialComponent {...materialProps} />
                    {decalUrl && (
                        <DecalErrorBoundary imageUrl={decalUrl} onError={onDecalError}>
                            <ProjectedDecal 
                                imageUrl={decalUrl} 
                                position={cylinderDecalPos} 
                                rotation={cylinderDecalRot} 
                                scale={[decalScale[0], decalScale[1], 0.5]} 
                            />
                        </DecalErrorBoundary>
                    )}
                </mesh>

                {/* Inner Wall (Tapered Open Cylinder, BackSide) */}
                <mesh name="Chicara_Parede_Interna" position={[0, 0.04, 0]}>
                    <cylinderGeometry args={[1.08, 0.60, 1.12, 32, 1, true]} />
                    <MaterialComponent {...materialProps} side={THREE.BackSide} />
                </mesh>

                {/* Top Rim */}
                <mesh name="Chicara_Borda_Superior" position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.08, 1.15, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Inner Bottom */}
                <mesh name="Chicara_Fundo_Interno" position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.60, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Outer Bottom */}
                <mesh name="Chicara_Fundo_Externo" position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.65, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Saucer Outer Dish (Tapered Open Cylinder) */}
                <mesh name="Chicara_Pires_Externo" castShadow receiveShadow position={[0, -0.63, 0]}>
                    <cylinderGeometry args={[1.65, 1.35, 0.08, 32, 1, true]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Saucer Inner Dish (BackSide) */}
                <mesh name="Chicara_Pires_Interno" position={[0, -0.62, 0]}>
                    <cylinderGeometry args={[1.58, 1.35, 0.06, 32, 1, true]} />
                    <MaterialComponent {...materialProps} side={THREE.BackSide} />
                </mesh>

                {/* Saucer Rim */}
                <mesh name="Chicara_Pires_Borda" position={[0, -0.59, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.58, 1.65, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Saucer Bottom Base */}
                <mesh name="Chicara_Pires_Base" position={[0, -0.67, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.35, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Small Ear Handle (Hollow C-shape Torus, no intersection inside) */}
                <mesh name="Chicara_Alca" castShadow position={teacupHandlePos} rotation={teacupHandleRot}>
                    <torusGeometry args={[0.4, 0.08, 16, 64, Math.PI]} />
                    <MaterialComponent {...materialProps} />
                    {activeHandleDecalUrl && (
                        <DecalErrorBoundary 
                            imageUrl={activeHandleDecalUrl} 
                            onError={individualHandle ? onHandleDecalError : onDecalError}
                        >
                            <ProjectedDecal 
                                imageUrl={activeHandleDecalUrl} 
                                position={activeHandleDecalPos} 
                                rotation={activeHandleDecalRot} 
                                scale={activeHandleDecalScale} 
                            />
                        </DecalErrorBoundary>
                    )}
                </mesh>

                {/* Liquid inside the Teacup */}
                <LiquidModel 
                    productType={productType}
                    showLiquid={showLiquid}
                    liquidType={liquidType}
                    liquidLevel={liquidLevel}
                />

                {/* Optional 3D Ornament */}
                {ornamentUrl && (
                    <OrnamentModel 
                        url={ornamentUrl} 
                        position={ornamentPos} 
                        rotation={ornamentRot} 
                        scale={ornamentScale} 
                        styleType={ornamentStyle}
                        baseColor={baseColor}
                        materialProps={materialProps}
                    />
                )}
            </group>
        );
    } else {
        // COP/GLASS/TUMBLER: tall sleek cylinder, tapered bottom, no handle
        return (
            <group ref={ref} name="Copo_Completo">
                {/* Outer Wall (Tapered Open Cylinder) */}
                <mesh name="Copo_Parede_Externa" castShadow receiveShadow>
                    <cylinderGeometry args={[0.9, 0.68, 2.5, 32, 1, true]} />
                    <MaterialComponent {...materialProps} />
                    {decalUrl && (
                        <DecalErrorBoundary imageUrl={decalUrl} onError={onDecalError}>
                            <ProjectedDecal 
                                imageUrl={decalUrl} 
                                position={cylinderDecalPos} 
                                rotation={cylinderDecalRot} 
                                scale={[decalScale[0], decalScale[1], 0.5]} 
                            />
                        </DecalErrorBoundary>
                    )}
                </mesh>

                {/* Inner Wall (Tapered Open Cylinder, BackSide) */}
                <mesh name="Copo_Parede_Interna" position={[0, 0.05, 0]}>
                    <cylinderGeometry args={[0.84, 0.62, 2.4, 32, 1, true]} />
                    <MaterialComponent {...materialProps} side={THREE.BackSide} />
                </mesh>

                {/* Top Rim */}
                <mesh name="Copo_Borda_Superior" position={[0, 1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.84, 0.9, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Inner Bottom */}
                <mesh name="Copo_Fundo_Interno" position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.62, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Outer Bottom */}
                <mesh name="Copo_Fundo_Externo" position={[0, -1.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.68, 32]} />
                    <MaterialComponent {...materialProps} />
                </mesh>

                {/* Liquid inside the Tumbler */}
                <LiquidModel 
                    productType={productType}
                    showLiquid={showLiquid}
                    liquidType={liquidType}
                    liquidLevel={liquidLevel}
                />

                {/* Optional 3D Ornament */}
                {ornamentUrl && (
                    <OrnamentModel 
                        url={ornamentUrl} 
                        position={ornamentPos} 
                        rotation={ornamentRot} 
                        scale={ornamentScale} 
                        styleType={ornamentStyle}
                        baseColor={baseColor}
                        materialProps={materialProps}
                    />
                )}
            </group>
        );
    }
});

// Generic Canvas Error Boundary to catch any WebGL or suspend crashes inside the 3D Canvas
class CanvasErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Canvas error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 rounded-3xl border border-red-500/20 text-red-400 space-y-4 z-50">
                    <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                        <AlertCircle className="w-8 h-8 text-red-400 animate-pulse" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Falha no Renderizador 3D</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Ocorreu um erro ao carregar texturas ou modelos do visualizador 3D.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (this.props.onReset) {
                                this.props.onReset();
                            }
                            this.setState({ hasError: false, error: null });
                        }}
                        className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-white font-bold text-xs rounded-xl transition-all"
                    >
                        Recuperar & Resetar Texturas
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

const CustomizerPage = () => {
    const location = useLocation();
    const canvasRef = useRef(null);

    // Initial imports via React Router navigation state (if coming from Generator)
    const passedModelUrl = location.state?.modelUrl || null;
    const passedTextureUrl = location.state?.textureUrl || null;

    // --- State Setup ---
    const [productType, setProductType] = useState('caneca'); // 'caneca', 'chicara', 'copo'
    const [activeTab, setActiveTab] = useState('appearance'); // 'appearance', 'decal', 'ornament'
    
    // Product appearance
    const [baseColor, setBaseColor] = useState('#ffffff');
    const [materialType, setMaterialType] = useState('ceramic'); // 'ceramic', 'matte', 'metal', 'glass'
    
    // Decal print image controls
    const [decalUrl, setDecalUrl] = useState(passedTextureUrl || ''); // default to AI texture if passed
    const [decalPosX, setDecalPosX] = useState(0.0); // translation X
    const [decalPosY, setDecalPosY] = useState(0.0); // translation Y
    const [decalRot, setDecalRot] = useState(0.0);   // rotation angle (radians)
    const [decalSize, setDecalSize] = useState(1.2);  // scale multiplier

    // New: Individual Handle Decal controls
    const [individualHandle, setIndividualHandle] = useState(false);
    const [handleDecalUrl, setHandleDecalUrl] = useState('');
    const [handleDecalSize, setHandleDecalSize] = useState(0.8);
    const handleFileInputRef = useRef(null);

    // Export 3D Mesh controls
    const [exportGlbSuccess, setExportGlbSuccess] = useState(false);
    const [isExportingGlb, setIsExportingGlb] = useState(false);
    const productGroupRef = useRef(null);

    // 3D Ornament controls
    const [ornamentUrl, setOrnamentUrl] = useState(passedModelUrl || ''); // default to AI GLB if passed
    const [ornPos, setOrnPos] = useState([0.0, 0.0, 1.05]);  // offset [X, Y, Z]
    const [ornRot, setOrnRot] = useState([0.0, 0.0, 0.0]);   // rotation [X, Y, Z]
    const [ornScale, setOrnScale] = useState(0.4);            // size scale
    const [ornamentStyle, setOrnamentStyle] = useState('original'); // 'original', 'gold', 'silver', 'copper', 'clay', 'glass'

    // Liquid states
    const [showLiquid, setShowLiquid] = useState(false);
    const [liquidType, setLiquidType] = useState('cafe');
    const [liquidLevel, setLiquidLevel] = useState(0.7);

    // UI Feedback states
    const [exportSuccess, setExportSuccess] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef(null);

    // 3D Printing States
    const [showPrintBed, setShowPrintBed] = useState(false);
    const [printHeight, setPrintHeight] = useState(100); // 100mm default
    const [printInfill, setPrintInfill] = useState(15); // 15% default
    const [printLayerHeight, setPrintLayerHeight] = useState(0.20); // 0.20mm default
    const [isExportingStl, setIsExportingStl] = useState(false);
    const [exportStlSuccess, setExportStlSuccess] = useState(false);

    // Dynamic state updates when location changes
    useEffect(() => {
        if (location.state?.loadMockup) {
            const m = location.state.loadMockup;
            setProductType(m.productType || 'caneca');
            setBaseColor(m.baseColor || '#ffffff');
            setMaterialType(m.materialType || 'ceramic');
            setDecalUrl(m.decalUrl || '');
            setDecalPosX(m.decalPosX ?? 0.0);
            setDecalPosY(m.decalPosY ?? 0.0);
            setDecalRot(m.decalRot ?? 0.0);
            setDecalSize(m.decalSize ?? 0.7);
            setOrnamentUrl(m.ornamentUrl || '');
            setOrnPos(m.ornPos || [0.0, 0.0, 1.05]);
            setOrnRot(m.ornRot || [0.0, 0.0, 0.0]);
            setOrnScale(m.ornScale ?? 0.4);
            setOrnamentStyle(m.ornamentStyle || 'original');
            setShowLiquid(m.showLiquid ?? false);
            setLiquidType(m.liquidType || 'cafe');
            setLiquidLevel(m.liquidLevel ?? 0.7);
            setIndividualHandle(m.individualHandle ?? false);
            setHandleDecalUrl(m.handleDecalUrl || '');
            setHandleDecalSize(m.handleDecalSize ?? 0.8);
        } else {
            if (location.state?.modelUrl) {
                setOrnamentUrl(location.state.modelUrl);
                setActiveTab('ornament'); // focus on ornament when a model is passed
            }
            if (location.state?.textureUrl) {
                setDecalUrl(location.state.textureUrl);
                setActiveTab('decal'); // focus on decal when texture is passed
            }
        }
    }, [location.state]);

    // Handle Local Image Upload
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setDecalUrl(objectUrl);
            setActiveTab('decal');
        }
    };

    // Handle Local Handle Image Upload
    const handleHandleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setHandleDecalUrl(objectUrl);
        }
    };

    // Premium Colors Preset
    const COLOR_PRESETS = [
        { name: 'Cerâmica Branca', color: '#ffffff' },
        { name: 'Preto Absoluto', color: '#111827' },
        { name: 'Vermelho Carmim', color: '#dc2626' },
        { name: 'Azul Escandinavo', color: '#1e3a8a' },
        { name: 'Amarelo Ouro', color: '#eab308' },
        { name: 'Verde Menta', color: '#10b981' },
        { name: 'Lilás Tecnológico', color: '#8b5cf6' },
        { name: 'Rosa Coral', color: '#f43f5e' },
    ];

    // Save mockup to local storage & Firestore Gallery
    const handleSaveMockup = () => {
        try {
            const user = auth.currentUser;
            const mockupId = `mockup_${Date.now()}`;
            const saved = JSON.parse(localStorage.getItem('nexa_saved_mockups') || '[]');
            
            const newMockup = {
                id: mockupId,
                name: `Design ${productType.charAt(0).toUpperCase() + productType.slice(1)} - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
                timestamp: new Date().toISOString(),
                productType,
                baseColor,
                materialType,
                decalUrl,
                decalPosX,
                decalPosY,
                decalRot,
                decalSize,
                ornamentUrl,
                ornPos,
                ornRot,
                ornScale,
                ornamentStyle,
                showLiquid,
                liquidType,
                liquidLevel,
                individualHandle,
                handleDecalUrl,
                handleDecalSize,
                userId: user ? user.uid : 'anonymous',
                userDisplayName: user ? user.displayName : 'Anônimo',
                isPublic: true // make it public by default so it shows up in the community gallery!
            };
            
            saved.push(newMockup);
            localStorage.setItem('nexa_saved_mockups', JSON.stringify(saved));
            
            // 2. Save to Firestore (only if not in Mock Mode)
            if (db) {
                const firestoreMockup = { ...newMockup };
                firestoreMockup.createdAt = serverTimestamp();
                
                setDoc(doc(db, 'custom_mockups', mockupId), firestoreMockup)
                    .then(() => console.log("Mockup customizado salvo com sucesso no Firestore!"))
                    .catch(err => console.error("Erro ao salvar mockup no Firestore:", err));
            }
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            console.error("Failed to save mockup:", err);
            alert("Erro ao salvar mockup.");
        }
    };

    // Reset controls to defaults
    const handleReset = () => {
        setDecalPosX(0.0);
        setDecalPosY(0.0);
        setDecalRot(0.0);
        setDecalSize(1.2);
        setOrnPos([0.0, 0.0, 1.05]);
        setOrnRot([0.0, 0.0, 0.0]);
        setOrnScale(0.4);
        setOrnamentStyle('original');
        setShowLiquid(false);
        setLiquidType('cafe');
        setLiquidLevel(0.7);
        setIndividualHandle(false);
        setHandleDecalUrl('');
        setHandleDecalSize(0.8);
    };

    // Capture and download canvas mockup
    const handleExportMockup = () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        try {
            // Canvas preservation allows capturing sRGB buffer instantly
            const dataUrl = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.download = `mockup_3d_${productType}_${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (err) {
            console.error("Mockup export failed:", err);
            alert("Erro ao gerar captura 3D. Tente rotacionar um pouco e clique novamente.");
        }
    };

    // Export 3D Model as GLB for Blender and advanced 3D software
    const handleDownloadGLB = () => {
        if (!productGroupRef.current) {
            alert("O modelo 3D ainda não foi carregado completamente.");
            return;
        }

        setIsExportingGlb(true);
        
        // 1. Clone the group to perform clean normal offset operations without affecting the canvas viewport
        const clonedGroup = productGroupRef.current.clone(true);
        
        // 2. Travese meshes to find decals and push their vertices outward along normal vectors (solves Z-fighting)
        clonedGroup.traverse((child) => {
            if (child.isMesh && (child.name === 'projected-decal' || child.material?.polygonOffset)) {
                const positionAttribute = child.geometry.attributes.position;
                const normalAttribute = child.geometry.attributes.normal;
                
                if (positionAttribute && normalAttribute) {
                    // Create a vanilla BufferGeometry to bypass the broken DecalGeometry.clone() constructor
                    const oldGeom = child.geometry;
                    const newGeom = new THREE.BufferGeometry();
                    
                    // Copy all attributes
                    for (const attrName in oldGeom.attributes) {
                        newGeom.setAttribute(attrName, oldGeom.attributes[attrName].clone());
                    }
                    // Copy index if it exists
                    if (oldGeom.index) {
                        newGeom.setIndex(oldGeom.index.clone());
                    }
                    
                    child.geometry = newGeom;
                    
                    const posAttr = child.geometry.attributes.position;
                    const normAttr = child.geometry.attributes.normal;
                    
                    for (let i = 0; i < posAttr.count; i++) {
                        const vx = posAttr.getX(i);
                        const vy = posAttr.getY(i);
                        const vz = posAttr.getZ(i);
                        
                        const nx = normAttr.getX(i);
                        const ny = normAttr.getY(i);
                        const nz = normAttr.getZ(i);
                        
                        // Push vertex outward by 0.005 units along its normal vector
                        posAttr.setXYZ(i, vx + nx * 0.005, vy + ny * 0.005, vz + nz * 0.005);
                    }
                    posAttr.needsUpdate = true;
                    child.geometry.computeVertexNormals();
                }
            }
        });

        const exporter = new GLTFExporter();
        
        exporter.parse(
            clonedGroup,
            (gltf) => {
                const blob = new Blob([gltf], { type: 'application/octet-stream' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `mockup_3d_${productType}_${Date.now()}.glb`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setIsExportingGlb(false);
                setExportGlbSuccess(true);
                setTimeout(() => setExportGlbSuccess(false), 3000);
            },
            (error) => {
                console.error("GLTF Export failed:", error);
                setIsExportingGlb(false);
                alert("Erro ao exportar o modelo 3D. Tente novamente.");
            },
            { 
                binary: true,
                animations: [],
                includeCustomExtensions: true
            }
        );
    };

    // Export 3D Model as STL for 3D Printing (clean and solidified)
    const handleDownloadSTL = (exportType = 'all') => {
        if (!productGroupRef.current) {
            alert("O modelo 3D ainda não foi carregado completamente.");
            return;
        }

        setIsExportingStl(true);
        try {
            // 1. Clone the product group to perform clean exports
            const clonedGroup = productGroupRef.current.clone(true);
            
            // If exporting only the ornament, let's find the mesh named "Adorno_3D_IA"
            let exportTarget = clonedGroup;
            
            if (exportType === 'ornament') {
                let foundOrn = null;
                clonedGroup.traverse((child) => {
                    if (child.name === 'Adorno_3D_IA' || child.name === 'Adorno_3D_Malha') {
                        // Find the highest-level primitive or group for the ornament
                        foundOrn = child;
                    }
                });
                
                if (!foundOrn) {
                    alert("Nenhum adorno 3D IA foi encontrado neste produto para exportação isolada.");
                    setIsExportingStl(false);
                    return;
                }
                
                // We must reset position and rotation of the ornament if exporting it isolated
                // so it centers perfectly on the print bed in the slicer!
                foundOrn.position.set(0, 0, 0);
                foundOrn.rotation.set(0, 0, 0);
                foundOrn.scale.set(1, 1, 1);
                exportTarget = foundOrn;
            } else {
                // Remove non-printable procedural liquid mesh and decals
                const meshesToRemove = [];
                clonedGroup.traverse((child) => {
                    if (child.isMesh && (
                        child.name.includes("Liquido") || 
                        child.name.includes("projected-decal")
                    )) {
                        meshesToRemove.push(child);
                    }
                });
                meshesToRemove.forEach(m => {
                    if (m.parent) m.parent.remove(m);
                });
            }

            const exporter = new STLExporter();
            const result = exporter.parse(exportTarget, { binary: true });
            
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `impressao_3d_${exportType === 'ornament' ? 'adorno' : productType}_${Date.now()}.stl`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setIsExportingStl(false);
            setExportStlSuccess(true);
            setTimeout(() => setExportStlSuccess(false), 3000);
        } catch (error) {
            console.error("STL Export failed:", error);
            setIsExportingStl(false);
            alert("Erro ao exportar STL. Tente novamente.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                        Customizador de Produtos 3D
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">
                        Crie mockups realistas. Projete estampas ou acople miniaturas 3D IA em canecas, copos e chícaras.
                    </p>
                </div>
                
                {/* Reset button */}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resetar Ajustes
                </button>
            </div>

            {/* Main Interactive Grid Layout */}
            <div className="flex flex-col lg:flex-row gap-8 items-stretch min-h-[620px]">
                
                {/* 1. LEFT COLUMN: 3D Viewport (60% width) */}
                <div className="w-full lg:w-3/5 min-h-[500px] lg:min-h-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl relative overflow-hidden flex flex-col shadow-2xl">
                    
                    {/* Floating Info Tag */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md rounded-full text-cyan-400 text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        Motor de Amostragem Fiel PBR
                    </div>

                    {/* Canvas Container */}
                    <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
                        <CanvasErrorBoundary onReset={handleReset}>
                            <Canvas 
                                shadows 
                                camera={{ position: [0, 1.5, 4.5], fov: 40 }}
                                gl={{ preserveDrawingBuffer: true, antialias: true }}
                            >
                                <Suspense fallback={null}>
                                    <ambientLight intensity={0.5} />
                                    <directionalLight 
                                        castShadow 
                                        position={[5, 10, 5]} 
                                        intensity={1.8} 
                                        shadow-mapSize={[1024, 1024]} 
                                    />
                                    <directionalLight position={[-5, 5, -5]} intensity={0.6} color="#4f46e5" />
                                    <directionalLight position={[0, -2, 0]} intensity={0.3} color="#ffffff" />
                                    
                                    <Stage environment="studio" intensity={0.6} adjustCamera={false}>
                                        <ProductModel 
                                            ref={productGroupRef}
                                            productType={productType}
                                            baseColor={baseColor}
                                            materialType={materialType}
                                            decalUrl={decalUrl}
                                            decalPos={[decalPosX, decalPosY]}
                                            decalRot={decalRot}
                                            decalScale={[decalSize, decalSize]}
                                            ornamentUrl={ornamentUrl}
                                            ornamentPos={ornPos}
                                            ornamentRot={ornRot}
                                            ornamentScale={[ornScale, ornScale, ornScale]}
                                            ornamentStyle={ornamentStyle}
                                            showLiquid={showLiquid}
                                            liquidType={liquidType}
                                            liquidLevel={liquidLevel}
                                            individualHandle={individualHandle}
                                            handleDecalUrl={handleDecalUrl}
                                            handleDecalSize={handleDecalSize}
                                            onDecalError={() => {
                                                console.warn("Resetting decalUrl due to loading error.");
                                                setDecalUrl('');
                                            }}
                                            onHandleDecalError={() => {
                                                console.warn("Resetting handleDecalUrl due to loading error.");
                                                setHandleDecalUrl('');
                                            }}
                                        />
                                    </Stage>

                                    <ContactShadows position={[0, -1.05, 0]} opacity={0.6} scale={6} blur={2.2} far={3} color="#000000" />
                                    <Environment preset="city" />

                                    {showPrintBed && (
                                        <gridHelper 
                                            args={[2.2, 22, '#06b6d4', '#1e293b']}
                                            position={[0, -1.055, 0]}
                                        />
                                    )}
                                </Suspense>

                                <OrbitControls 
                                    enableDamping
                                    dampingFactor={0.06}
                                    minDistance={2}
                                    maxDistance={8}
                                    maxPolarAngle={Math.PI / 1.7}
                                />
                            </Canvas>
                        </CanvasErrorBoundary>

                        {/* Drag Helper overlay */}
                        <div className="absolute bottom-4 left-4 pointer-events-none flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-slate-500 tracking-wider flex items-center gap-1.5">
                                <RotateCw className="w-3 h-3 text-slate-500 animate-spin" /> Arraste para rotacionar
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 tracking-wider flex items-center gap-1.5">
                                <ZoomIn className="w-3 h-3 text-slate-500" /> Scroll para dar zoom
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. RIGHT COLUMN: Controls Panel (40% width) */}
                <div className="w-full lg:w-2/5 flex flex-col gap-6">
                    
                    {/* Product Shape Selector Card */}
                    <div className="glass rounded-2xl p-5 shadow-lg border border-slate-800/80">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Cuboid className="w-4 h-4 text-cyan-400" /> 1. Escolha o Produto Base
                        </p>
                        
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'caneca', name: 'Caneca', emoji: '☕', desc: 'Clássica Cerâmica' },
                                { id: 'chicara', name: 'Chícara', emoji: '🍵', desc: 'Com Pires' },
                                { id: 'copo', name: 'Copo', emoji: '🥤', desc: 'Moderno Esguio' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setProductType(item.id)}
                                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                                        productType === item.id 
                                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                            : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span className="text-2xl mb-1.5">{item.emoji}</span>
                                    <span className="text-xs font-bold block">{item.name}</span>
                                    <span className="text-[9px] opacity-60 mt-0.5">{item.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customizer Tabs & Settings Card */}
                    <div className="glass rounded-2xl flex-1 p-5 shadow-lg border border-slate-800/80 flex flex-col min-h-[400px]">
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-800 pb-3 mb-5 gap-1 overflow-x-auto scrollbar-none">
                            {[
                                { id: 'appearance', label: 'Aparência', icon: Palette },
                                { id: 'decal', label: 'Estampa', icon: ImageIcon },
                                { id: 'ornament', label: 'Adorno 3D', icon: Sparkles },
                                { id: 'print3d', label: 'Impressão 3D', icon: Printer },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 min-w-[70px] pb-2 text-[10px] font-bold tracking-wider uppercase border-b-2 transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                                            activeTab === tab.id 
                                                ? 'border-cyan-400 text-cyan-400' 
                                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* --- TAB CONTENT --- */}
                        <div className="flex-1 flex flex-col overflow-y-auto max-h-[420px] pr-1">
                            
                            {/* TAB A: Appearance */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-6 animate-fade-in">
                                    
                                    {/* Material Finish */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Acabamento do Material</p>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {[
                                                { id: 'ceramic', label: 'Cerâmica Brilhante', desc: 'Reflexo clássico' },
                                                { id: 'matte', label: 'Plástico Fosco', desc: 'Visual aveludado' },
                                                { id: 'metal', label: 'Metal Polido', desc: 'Estilo alumínio' },
                                                { id: 'glass', label: 'Vidro Translúcido', desc: 'Refração realista' },
                                            ].map((mat) => (
                                                <button
                                                    key={mat.id}
                                                    onClick={() => setMaterialType(mat.id)}
                                                    className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                                                        materialType === mat.id
                                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.08)]'
                                                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold block">{mat.label}</span>
                                                    <span className="text-[9px] opacity-60 mt-0.5">{mat.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color Swatches */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cor do Produto</p>
                                            <span className="text-xs font-mono text-slate-500">{baseColor.toUpperCase()}</span>
                                        </div>
                                        
                                        {/* Presets Grid */}
                                        <div className="grid grid-cols-8 gap-2 mb-4">
                                            {COLOR_PRESETS.map((p) => (
                                                <button
                                                    key={p.color}
                                                    onClick={() => setBaseColor(p.color)}
                                                    title={p.name}
                                                    style={{ backgroundColor: p.color }}
                                                    className={`w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 shadow-md ${
                                                        baseColor === p.color ? 'border-cyan-400 scale-105' : 'border-slate-800'
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        {/* Custom Picker */}
                                        <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl mb-5">
                                            <input 
                                                type="color" 
                                                value={baseColor}
                                                onChange={(e) => setBaseColor(e.target.value)}
                                                className="w-10 h-10 border-0 bg-transparent rounded-lg cursor-pointer"
                                            />
                                            <div>
                                                <p className="text-xs font-bold text-white">Escolher Cor Customizada</p>
                                                <p className="text-[10px] text-slate-500">Arraste para criar tons gradientes</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- LIQUID IN MUG CONTROLS --- */}
                                    <div className="pt-4 border-t border-slate-800/80 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <Coffee className="w-4 h-4 text-amber-500" />
                                                Preencher com Líquido 3D
                                            </p>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={showLiquid}
                                                    onChange={(e) => setShowLiquid(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white" />
                                            </label>
                                        </div>

                                        {showLiquid && (
                                            <div className="space-y-4 pt-1 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                                        Tipo de Conteúdo
                                                    </label>
                                                    <div className="grid grid-cols-5 gap-1.5">
                                                        {[
                                                            { id: 'cafe', name: 'Café', emoji: '☕' },
                                                            { id: 'cha', name: 'Chá', emoji: '🍵' },
                                                            { id: 'leite', name: 'Leite', emoji: '🥛' },
                                                            { id: 'cola', name: 'Refrigerante', emoji: '🥤' },
                                                            { id: 'agua', name: 'Água', emoji: '💧' },
                                                        ].map((liq) => (
                                                            <button
                                                                key={liq.id}
                                                                onClick={() => setLiquidType(liq.id)}
                                                                className={`py-2 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5 ${
                                                                    liquidType === liq.id
                                                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                                                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-750 text-slate-400'
                                                                }`}
                                                            >
                                                                <span className="text-sm">{liq.emoji}</span>
                                                                <span className="text-[9px] font-bold">{liq.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Volume do Líquido</span>
                                                        <span className="font-mono text-cyan-400">{Math.round(liquidLevel * 100)}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="0.1" max="0.95" step="0.02"
                                                        value={liquidLevel} 
                                                        onChange={(e) => setLiquidLevel(parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB B: Decal Print (Texture) */}
                            {activeTab === 'decal' && (
                                <div className="space-y-5 animate-fade-in">
                                    
                                    {/* Texture upload */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Carregar Imagem de Estampa</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-xl text-slate-300 hover:text-cyan-400 transition-all text-xs font-bold"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Enviar Arquivo PNG/JPG
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleImageUpload} 
                                                accept="image/*" 
                                                className="hidden" 
                                            />
                                            {decalUrl && (
                                                <button
                                                    onClick={() => setDecalUrl('')}
                                                    className="px-3.5 bg-red-900/10 border border-red-500/20 text-red-400 hover:bg-red-900/20 rounded-xl text-xs font-bold transition-all"
                                                >
                                                    Limpar
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {decalUrl ? (
                                        <div className="space-y-4 pt-2 border-t border-slate-800/80">
                                            {/* Preview box */}
                                            <div className="flex items-center gap-3 bg-slate-900/20 p-2 border border-slate-800/50 rounded-xl">
                                                <img 
                                                    src={decalUrl} 
                                                    alt="Print preview" 
                                                    className="w-10 h-10 object-cover rounded-lg border border-slate-700 bg-white" 
                                                />
                                                <div>
                                                    <p className="text-xs font-bold text-white">Estampa Ativa</p>
                                                    <p className="text-[10px] text-slate-500">Mapeada no centro da caneca</p>
                                                </div>
                                            </div>

                                            {/* Position X Slider */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                    <span>Posição Horizontal (X)</span>
                                                    <span className="font-mono text-cyan-400">{decalPosX.toFixed(2)}</span>
                                                </div>
                                                <input 
                                                    type="range" min="-1.5" max="1.5" step="0.01"
                                                    value={decalPosX} onChange={(e) => setDecalPosX(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                                />
                                            </div>

                                            {/* Position Y Slider */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                    <span>Posição Vertical (Y)</span>
                                                    <span className="font-mono text-cyan-400">{decalPosY.toFixed(2)}</span>
                                                </div>
                                                <input 
                                                    type="range" min="-1.5" max="1.5" step="0.01"
                                                    value={decalPosY} onChange={(e) => setDecalPosY(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                                />
                                            </div>

                                            {/* Scale Size Slider */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                    <span>Tamanho (Escala)</span>
                                                    <span className="font-mono text-cyan-400">{decalSize.toFixed(2)}</span>
                                                </div>
                                                <input 
                                                    type="range" min="0.1" max="5.0" step="0.05"
                                                    value={decalSize} onChange={(e) => setDecalSize(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                                />
                                            </div>

                                            {/* Rotation Slider */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                    <span>Rotação da Imagem</span>
                                                    <span className="font-mono text-cyan-400">{Math.round(decalRot * (180 / Math.PI))}°</span>
                                                </div>
                                                <input 
                                                    type="range" min="-3.14" max="3.14" step="0.05"
                                                    value={decalRot} onChange={(e) => setDecalRot(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl text-slate-500">
                                            <ImageIcon className="w-8 h-8 opacity-40 mb-2" />
                                            <p className="text-xs font-semibold">Nenhuma estampa carregada</p>
                                            <p className="text-[10px] opacity-60 mt-1 max-w-xs">Faça upload de uma foto ou importe a imagem gerada por IA na página Gerar para visualizá-la aqui.</p>
                                        </div>
                                    )}

                                    {/* Opção de Alça Individual (apenas Caneca e Chícara) */}
                                    {(productType === 'caneca' || productType === 'chicara') && (
                                        <div className="pt-4 border-t border-slate-800/80 space-y-4 mt-4">
                                            <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Alça Individual</p>
                                                    <p className="text-[10px] text-slate-500">A estampa principal não entra na alça</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={individualHandle}
                                                        onChange={(e) => setIndividualHandle(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white" />
                                                </label>
                                            </div>

                                            {individualHandle && (
                                                <div className="space-y-4 pt-1 animate-fade-in border border-slate-800/60 p-3.5 rounded-xl bg-slate-900/10">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Imagem Exclusiva da Alça</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleFileInputRef.current?.click()}
                                                                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-xl text-slate-300 hover:text-cyan-400 transition-all text-[11px] font-semibold"
                                                            >
                                                                <Upload className="w-3.5 h-3.5" />
                                                                Enviar Foto da Alça
                                                            </button>
                                                            <input 
                                                                type="file" 
                                                                ref={handleFileInputRef} 
                                                                onChange={handleHandleImageUpload} 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                            />
                                                            {handleDecalUrl && (
                                                                <button
                                                                    onClick={() => setHandleDecalUrl('')}
                                                                    className="px-3 bg-red-900/10 border border-red-500/20 text-red-400 hover:bg-red-900/20 rounded-xl text-xs font-bold transition-all"
                                                                >
                                                                    Limpar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {handleDecalUrl ? (
                                                        <div className="space-y-3 pt-1">
                                                            <div className="flex items-center gap-3 bg-slate-950/40 p-2 border border-slate-850 rounded-xl">
                                                                <img 
                                                                    src={handleDecalUrl} 
                                                                    alt="Handle print preview" 
                                                                    className="w-8 h-8 object-cover rounded-lg border border-slate-700 bg-white" 
                                                                />
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-white">Estampa da Alça Ativa</p>
                                                                    <p className="text-[9px] text-slate-500">Centralizada na curva da alça</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                                    <span>Tamanho Estampa Alça</span>
                                                                    <span className="font-mono text-cyan-400">{handleDecalSize.toFixed(2)}</span>
                                                                </div>
                                                                <input 
                                                                    type="range" min="0.1" max="2.0" step="0.05"
                                                                    value={handleDecalSize} onChange={(e) => setHandleDecalSize(parseFloat(e.target.value))}
                                                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[9px] text-slate-500 leading-normal">
                                                            Nenhuma imagem carregada para a alça. Ela ficará totalmente lisa/sem nada (estilo caneca bicolor).
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB C: 3D Ornament */}
                            {activeTab === 'ornament' && (
                                <div className="space-y-5 animate-fade-in">
                                    
                                    {/* Ornament source info */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Adornar com Modelo 3D (IA)</p>
                                        
                                        {ornamentUrl ? (
                                            <div className="space-y-4">
                                                {/* Attachment Presets */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                        <Move className="w-3 h-3 text-indigo-400" /> Posicionamento Rápido
                                                    </p>
                                                    <div className="grid grid-cols-4 gap-1.5">
                                                        {[
                                                            { id: 'front', label: 'Frente', emoji: '🎯', pos: [0.0, 0.0, 1.05], rot: [0, 0, 0], scl: 0.4 },
                                                            { id: 'rim', label: 'Borda', emoji: '☕', pos: [0.0, 1.05, 0.5], rot: [0.3, 0, 0], scl: 0.3 },
                                                            { id: 'inside', label: 'Dentro', emoji: '🕳️', pos: [0.0, -0.4, 0.0], rot: [0, 0, 0], scl: 0.4 },
                                                            { id: 'handle', label: 'Alça', emoji: '🔗', pos: [-0.95, 0.7, 0.0], rot: [0, 0, -0.4], scl: 0.28 }
                                                        ].map((preset) => (
                                                            <button
                                                                key={preset.id}
                                                                onClick={() => {
                                                                    setOrnPos(preset.pos);
                                                                    setOrnRot(preset.rot);
                                                                    setOrnScale(preset.scl);
                                                                }}
                                                                className="px-1 py-2 bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-750 hover:border-indigo-500/50 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1"
                                                            >
                                                                <span className="text-sm">{preset.emoji}</span>
                                                                {preset.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Active Ornament tag */}
                                                <div className="flex items-center justify-between bg-slate-900/30 p-2.5 border border-slate-800/80 rounded-xl">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                                                        <div>
                                                            <p className="text-xs font-bold text-white">Modelo GLB Acoplado</p>
                                                            <p className="text-[10px] text-slate-500">ID: {ornamentUrl.split('/').pop()?.split('-')[0] || 'gerado_por_ia'}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setOrnamentUrl('')}
                                                        className="text-[10px] font-bold text-red-400 hover:text-red-300"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>

                                                {/* Ornament Style Selector */}
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                                        Banho de Material (Estilo)
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {[
                                                            { id: 'original', name: 'Original', desc: 'Cores da IA' },
                                                            { id: 'gold', name: 'Ouro Polido', desc: 'Metalizado 24k' },
                                                            { id: 'silver', name: 'Prata Polida', desc: 'Metal reluzente' },
                                                            { id: 'copper', name: 'Bronze', desc: 'Cobre clássico' },
                                                            { id: 'glass', name: 'Vidro', desc: 'Transparência' },
                                                            { id: 'clay', name: 'Cerâmica', desc: 'Mesma cor do copo' },
                                                        ].map((st) => (
                                                            <button
                                                                key={st.id}
                                                                onClick={() => setOrnamentStyle(st.id)}
                                                                className={`py-1.5 px-1 rounded-lg border text-center transition-all ${
                                                                    ornamentStyle === st.id
                                                                        ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                                                                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-750 text-slate-400'
                                                                }`}
                                                            >
                                                                <span className="text-[10px] font-bold block">{st.name}</span>
                                                                <span className="text-[8px] opacity-50 block leading-tight mt-0.5">{st.desc}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Position X Slider */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Posição Horizontal (X)</span>
                                                        <span className="font-mono text-cyan-400">{ornPos[0].toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="-1.5" max="1.5" step="0.02"
                                                        value={ornPos[0]} 
                                                        onChange={(e) => setOrnPos([parseFloat(e.target.value), ornPos[1], ornPos[2]])}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                                    />
                                                </div>

                                                {/* Position Y Slider */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Posição Altura (Y)</span>
                                                        <span className="font-mono text-cyan-400">{ornPos[1].toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="-1.5" max="1.5" step="0.02"
                                                        value={ornPos[1]} 
                                                        onChange={(e) => setOrnPos([ornPos[0], parseFloat(e.target.value), ornPos[2]])}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                                    />
                                                </div>

                                                {/* Position Z Slider */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Avanço / Profundidade (Z)</span>
                                                        <span className="font-mono text-cyan-400">{ornPos[2].toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="-1.8" max="1.8" step="0.02"
                                                        value={ornPos[2]} 
                                                        onChange={(e) => setOrnPos([ornPos[0], ornPos[1], parseFloat(e.target.value)])}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                                    />
                                                </div>

                                                {/* Ornament Scale */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Tamanho do Adorno</span>
                                                        <span className="font-mono text-cyan-400">{ornScale.toFixed(2)}</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="0.1" max="1.2" step="0.02"
                                                        value={ornScale} onChange={(e) => setOrnScale(parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                                    />
                                                </div>

                                                {/* Rotate X axis */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Inclinação Adorno (Rotação X)</span>
                                                        <span className="font-mono text-cyan-400">{Math.round(ornRot[0] * (180 / Math.PI))}°</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="-3.14" max="3.14" step="0.05"
                                                        value={ornRot[0]} 
                                                        onChange={(e) => setOrnRot([parseFloat(e.target.value), ornRot[1], ornRot[2]])}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                                    />
                                                </div>

                                                {/* Rotate Y axis (spin) */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Girar Adorno (Rotação Y)</span>
                                                        <span className="font-mono text-cyan-400">{Math.round(ornRot[1] * (180 / Math.PI))}°</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="-3.14" max="3.14" step="0.05"
                                                        value={ornRot[1]} 
                                                        onChange={(e) => setOrnRot([ornRot[0], parseFloat(e.target.value), ornRot[2]])}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                                    />
                                                </div>

                                                {/* Rotate Z axis */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                                                        <span>Giro Lateral (Rotação Z)</span>
                                                        <span className="font-mono text-cyan-400">{Math.round(ornRot[2] * (180 / Math.PI))}°</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="-3.14" max="3.14" step="0.05"
                                                        value={ornRot[2]} 
                                                        onChange={(e) => setOrnRot([ornRot[0], ornRot[1], parseFloat(e.target.value)])}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl text-slate-500">
                                                <Sparkles className="w-8 h-8 opacity-40 mb-2" />
                                                <p className="text-xs font-semibold">Nenhum modelo 3D acoplado</p>
                                                <p className="text-[10px] opacity-60 mt-1 max-w-xs leading-relaxed">
                                                    Ao gerar um modelo 3D por IA (Hunyuan3D) na aba "Gerar", você poderá clicar em **"Personalizar em Produto"** no modal de resultados para acoplar esse objeto 3D diretamente na parede ou borda desta caneca/copo como um ornamento físico!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'print3d' && (
                                <div className="space-y-5 animate-fade-in text-left">
                                    {/* 3D Print Status and Grid */}
                                    <div className="flex items-center justify-between p-3.5 bg-slate-900/30 border border-slate-800 rounded-xl">
                                        <div>
                                            <p className="text-xs font-bold text-slate-300">Grade da Mesa de Impressão</p>
                                            <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">
                                                Visualizar modelo em uma mesa de 220x220mm (1 quadrado = 1x1cm reais).
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={showPrintBed}
                                                onChange={(e) => setShowPrintBed(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white" />
                                        </label>
                                    </div>

                                    {/* Real-world Scaling Wizard */}
                                    <div className="space-y-3.5 p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <Printer className="w-3.5 h-3.5 text-cyan-400" /> Dimensionamento Real (mm)
                                        </p>
                                        
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                                                <span>Altura Desejada</span>
                                                <span className="text-cyan-400 font-mono font-bold">{printHeight} mm</span>
                                            </div>
                                            <input 
                                                type="range" min="30" max="200" step="5"
                                                value={printHeight} 
                                                onChange={(e) => setPrintHeight(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                            />
                                            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                                                <span>30 mm (Mini)</span>
                                                <span>200 mm (Máximo)</span>
                                            </div>
                                        </div>

                                        {/* Physical Specs Box */}
                                        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                                            <div>
                                                <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Altura</span>
                                                <span className="font-mono text-cyan-200 font-bold">{printHeight} mm</span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Largura</span>
                                                <span className="font-mono text-cyan-200 font-bold">
                                                    {productType === 'chicara' ? Math.round(printHeight * 1.4) : productType === 'copo' ? Math.round(printHeight * 0.45) : printHeight} mm
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Profundidade</span>
                                                <span className="font-mono text-cyan-200 font-bold">
                                                    {productType === 'chicara' ? Math.round(printHeight * 1.4) : productType === 'copo' ? Math.round(printHeight * 0.45) : printHeight} mm
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slicer Settings and Estimates */}
                                    <div className="space-y-4 p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Parâmetros de Fatiamento (Estimativas)
                                        </p>

                                        {/* Infill */}
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                                                <span>Preenchimento (Infill)</span>
                                                <span className="text-indigo-300 font-mono font-bold">{printInfill}%</span>
                                            </div>
                                            <input 
                                                type="range" min="5" max="60" step="5"
                                                value={printInfill} 
                                                onChange={(e) => setPrintInfill(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                            />
                                        </div>

                                        {/* Layer Height Select */}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1.5">Altura de Camada (Resolução)</label>
                                            <div className="flex gap-1.5">
                                                {[
                                                    { v: 0.12, label: '0.12 Ultra' },
                                                    { v: 0.16, label: '0.16 Alta' },
                                                    { v: 0.20, label: '0.20 Normal' },
                                                    { v: 0.28, label: '0.28 Rápido' }
                                                ].map(opt => (
                                                    <button key={opt.v}
                                                        onClick={() => setPrintLayerHeight(opt.v)}
                                                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all
                                                            ${printLayerHeight === opt.v
                                                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                                    >{opt.label}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Calculation Output Box */}
                                        {(() => {
                                            let printWidth = printHeight;
                                            if (productType === 'chicara') {
                                                printWidth = Math.round(printHeight * 1.4);
                                            } else if (productType === 'copo') {
                                                printWidth = Math.round(printHeight * 0.45);
                                            }
                                            let volumeCm3 = 0;
                                            if (productType === 'caneca') {
                                                volumeCm3 = Math.PI * (Math.pow(printWidth/20, 2) - Math.pow(printWidth/20 - 0.4, 2)) * (printHeight/10);
                                            } else if (productType === 'chicara') {
                                                volumeCm3 = Math.PI * (Math.pow(printWidth/20, 2) - Math.pow(printWidth/20 - 0.35, 2)) * (printHeight/10);
                                            } else { // copo
                                                volumeCm3 = Math.PI * (Math.pow(printWidth/20, 2) - Math.pow(printWidth/20 - 0.3, 2)) * (printHeight/10);
                                            }
                                            if (ornamentUrl) {
                                                volumeCm3 += (printHeight * printHeight * printHeight / 8000) * (ornScale * 2);
                                            }
                                            const infillFactor = (printInfill / 100) * 0.4 + 0.6;
                                            let weightGrams = Math.round(volumeCm3 * 1.24 * infillFactor);
                                            if (weightGrams < 5) weightGrams = 15;
                                            
                                            const rate = printLayerHeight === 0.12 ? 8 : printLayerHeight === 0.16 ? 12 : printLayerHeight === 0.20 ? 15 : 22;
                                            const totalMinutes = Math.round((weightGrams / rate) * 60);
                                            const hours = Math.floor(totalMinutes / 60);
                                            const minutes = totalMinutes % 60;
                                            
                                            return (
                                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/50 border border-slate-850 rounded-xl text-xs font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">⚖️</span>
                                                        <div>
                                                            <span className="block text-[9px] text-slate-500 uppercase font-semibold">Peso Estimado</span>
                                                            <span className="font-mono text-cyan-300 font-bold">{weightGrams}g de PLA</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">⏱️</span>
                                                        <div>
                                                            <span className="block text-[9px] text-slate-500 uppercase font-semibold">Tempo de Impressão</span>
                                                            <span className="font-mono text-cyan-300 font-bold">{hours}h {minutes}m</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Download STL Action Buttons */}
                                    <div className="space-y-2.5">
                                        <button
                                            onClick={() => handleDownloadSTL('all')}
                                            disabled={isExportingStl}
                                            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all"
                                        >
                                            <Download className="w-4 h-4" />
                                            {isExportingStl ? "Exportando STL..." : "Baixar Produto Completo (.STL)"}
                                        </button>
                                        
                                        {ornamentUrl && (
                                            <button
                                                onClick={() => handleDownloadSTL('ornament')}
                                                disabled={isExportingStl}
                                                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                                Baixar Apenas Adorno IA (.STL)
                                            </button>
                                        )}
                                    </div>

                                    {/* Disclaimer Food Safe */}
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            <span className="font-bold text-amber-500">Nota Food-Safe:</span> Plásticos impressos em 3D possuem microfissuras que acumulam bactérias e não são inerentemente seguros para alimentação. Para uso com bebidas quentes/frias, utilize filamentos adequados e aplique uma camada selante epóxi profissional certificada (Food-Safe).
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- BLENDER & 3D DCC COMPATIBILITY CARD --- */}
                        <div className="mt-4 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
                            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Box className="w-3.5 h-3.5" /> Compatibilidade PBR & Estamparia Otimizada
                            </p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                O arquivo exportado é no formato <b>.GLB (glTF 2.0 binário)</b>. Este padrão industrial preserva toda a geometria tridimensional, materiais PBR (cor base, metalicidade, rugosidade, transparência física) e texturas aplicadas.
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-1.5">
                                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase">Organização & Mesclagem</p>
                                    <p className="text-[8px] text-slate-500 leading-normal mt-0.5">
                                        Todas as peças vêm organizadas e com nomes claros no Outliner (ex: <i>Caneca_Parede_Externa</i>, <i>Caneca_Alca</i>). Para manipulá-las como um único sólido no Blender, selecione a coleção correspondente e pressione <b>Ctrl + J</b> para juntá-las!
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                                    <p className="text-[9px] font-bold text-emerald-400 uppercase">Zero Z-Fighting (Bug de Imagem)</p>
                                    <p className="text-[8px] text-slate-500 leading-normal mt-0.5">
                                        Aplicamos um deslocamento matemático automático de <b>0.005 unidades</b> nos vértices da estampa ao longo de suas normais durante a exportação. Isso afasta a estampa milimetricamente da superfície, eliminando o defeito de listras ou falhas de sobreposição no viewport.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* --- EXPORT ACTION BAR (Footer of Card) --- */}
                        <div className="pt-4 border-t border-slate-800 mt-5 space-y-2.5">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveMockup}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-bold text-xs rounded-xl shadow-md transition-all ${
                                        saveSuccess
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 shadow-sm'
                                    }`}
                                >
                                    <Save className="w-4 h-4" />
                                    {saveSuccess ? 'Salvo!' : 'Salvar'}
                                </button>
                                <button
                                    onClick={handleExportMockup}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-bold text-xs rounded-xl shadow-md transition-all ${
                                        exportSuccess
                                            ? 'bg-green-600 hover:bg-green-500 text-white'
                                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                                    }`}
                                >
                                    <Download className="w-4 h-4" />
                                    {exportSuccess ? 'Mockup Exportado!' : 'Exportar PNG'}
                                </button>
                            </div>
                            <button
                                onClick={handleDownloadGLB}
                                disabled={isExportingGlb}
                                className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold text-xs rounded-xl shadow-lg transition-all ${
                                    isExportingGlb
                                        ? 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                                        : exportGlbSuccess
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                                            : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                                }`}
                            >
                                <Box className={`w-4 h-4 ${isExportingGlb ? 'animate-spin' : ''}`} />
                                {isExportingGlb 
                                    ? 'Preparando Malha e Texturas...' 
                                    : exportGlbSuccess 
                                        ? 'Modelo 3D Exportado! 🎉' 
                                        : 'Baixar Modelo 3D (.GLB para Blender)'
                                }
                            </button>
                            <p className="text-[9px] text-center text-slate-500">
                                Salve localmente no seu perfil, exporte uma foto sRGB ou baixe o arquivo GLB otimizado para Blender.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizerPage;
