import React, { useState, useCallback } from 'react';
import { Upload, Loader2, FileImage, Zap, Settings2, Cpu, Gem, Palette, ChevronDown, ChevronUp, RotateCcw, X, Type, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// ═══════════════════════════════════════════════════
// Presets de Qualidade
// ═══════════════════════════════════════════════════
const PRESETS = {
    fast: {
        name: 'Rápido',
        icon: Zap,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        bgActive: 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
        time: '~3 min',
        desc: 'Teste rápido, baixa resolução',
        settings: {
            steps: 5, guidance: 7.5, dualGuidance: 10.5,
            octreeResolution: 256, maxFaces: 20000,
            exportFormat: 'glb', removeBg: true, turboTexture: true,
            removeFloaters: true, removeDegenerateFaces: true,
        }
    },
    standard: {
        name: 'Padrão',
        icon: Settings2,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        bgActive: 'bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
        time: '~8 min',
        desc: 'Bom equilíbrio qualidade/tempo',
        settings: {
            steps: 30, guidance: 7.5, dualGuidance: 10.5,
            octreeResolution: 384, maxFaces: 80000,
            exportFormat: 'glb', removeBg: true, turboTexture: false,
            removeFloaters: true, removeDegenerateFaces: true,
        }
    },
    high: {
        name: 'Alta Qualidade',
        icon: Palette,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/30',
        bgActive: 'bg-purple-500/20 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
        time: '~12 min',
        desc: 'Resultado profissional',
        settings: {
            steps: 50, guidance: 7.5, dualGuidance: 10.5,
            octreeResolution: 384, maxFaces: 150000,
            exportFormat: 'glb', removeBg: true, turboTexture: false,
            removeFloaters: true, removeDegenerateFaces: true,
        }
    },
    ultra: {
        name: 'Ultra / Impressão 3D',
        icon: Gem,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/30',
        bgActive: 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
        time: '~20 min',
        desc: 'Máxima fidelidade, pronta para impressão',
        settings: {
            steps: 100, guidance: 7.5, dualGuidance: 10.5,
            octreeResolution: 512, maxFaces: 200000,
            exportFormat: 'stl', removeBg: true, turboTexture: false,
            removeFloaters: true, removeDegenerateFaces: true,
        }
    }
};

const DEFAULT_SETTINGS = {
    steps: 30,
    guidance: 7.5,
    dualGuidance: 10.5,
    octreeResolution: 384,
    maxFaces: 80000,
    exportFormat: 'glb',
    seed: '',
    removeBg: true,
    turboTexture: false,
    removeFloaters: true,
    removeDegenerateFaces: true,
    useFlashVDM: true, // Phase 4 feature
    generateVariations: false, // Phase 4 feature
    generateTexture: true, // Phase 4 feature
};

const FileUpload = ({ onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activePreset, setActivePreset] = useState('standard');
    const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [inputMode, setInputMode] = useState('image'); // 'image' or 'text'
    const [textPrompt, setTextPrompt] = useState('');

    const applyPreset = (key) => {
        setActivePreset(key);
        const preset = PRESETS[key];
        setSettings(prev => ({
            ...prev,
            ...preset.settings,
            seed: prev.seed,
        }));
    };

    const handleSettingChange = (key, value) => {
        setActivePreset(null);
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const selectFile = (file) => {
        if (!file) return;
        setSelectedFile(file);
        setErrorMsg(null);
        const url = URL.createObjectURL(file);
        setPreview(url);
        setDragActive(false);
    };

    const clearFile = () => {
        if (preview) URL.revokeObjectURL(preview);
        setSelectedFile(null);
        setPreview(null);
        setErrorMsg(null);
    };

    const startGeneration = async () => {
        if (inputMode === 'image' && !selectedFile) return;
        if (inputMode === 'text' && !textPrompt.trim()) return;
        if (uploading) return;
        setUploading(true);
        setErrorMsg(null);
        const formData = new FormData();
        if (inputMode === 'image') {
            formData.append("image", selectedFile);
        } else {
            formData.append("text_prompt", textPrompt.trim());
        }
        formData.append("steps", settings.steps);
        formData.append("guidance_scale", settings.guidance);
        formData.append("dual_guidance_scale", settings.dualGuidance);
        formData.append("octree_resolution", settings.octreeResolution);
        formData.append("max_faces", settings.maxFaces);
        formData.append("export_format", settings.exportFormat);
        formData.append("seed", settings.seed === "" ? -1 : settings.seed);
        formData.append("remove_bg", settings.removeBg);
        formData.append("turbo_texture", settings.turboTexture);
        formData.append("remove_floaters", settings.removeFloaters);
        formData.append("remove_degenerate_faces", settings.removeDegenerateFaces);
        formData.append("use_flash_vdm", settings.useFlashVDM);
        formData.append("generate_variations", settings.generateVariations);
        formData.append("generate_texture", settings.generateTexture);

        try {
            const response = await axios.post(`${API_BASE_URL}/generate`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "ngrok-skip-browser-warning": "true",
                },
            });
            onUploadSuccess(response.data.task_id);
            clearFile();
            setTextPrompt('');
        } catch (error) {
            console.error("Upload failed", error);
            setErrorMsg("Falha ao enviar. Verifique se o servidor está rodando.");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            selectFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            selectFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full space-y-5">

            {/* ════ Mode Toggle (Image / Text) ════ */}
            <div className="flex bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
                <button
                    onClick={() => setInputMode('image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === 'image'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Imagem → 3D
                </button>
                <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === 'text'
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Type className="w-4 h-4" />
                    Texto → 3D
                </button>
            </div>

            {/* ════ Presets de Qualidade ════ */}
            <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(PRESETS).map(([key, preset]) => {
                    const Icon = preset.icon;
                    const isActive = activePreset === key;
                    return (
                        <button
                            key={key}
                            onClick={() => applyPreset(key)}
                            className={`relative p-3 rounded-xl border transition-all duration-300 text-left group
                                ${isActive ? preset.bgActive : preset.bgColor + ' hover:opacity-80'}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${preset.color}`} />
                                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                    {preset.name}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">{preset.desc}</p>
                            <span className={`absolute top-2.5 right-2.5 text-[10px] font-mono font-bold ${preset.color} opacity-70`}>
                                {preset.time}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ════ Zona de Upload / Preview / Text ════ */}
            {inputMode === 'image' ? (
                // IMAGE MODE
                !selectedFile ? (
                    <div
                        className={`relative group border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${dragActive
                            ? "border-cyan-400 bg-cyan-900/20 scale-[1.02]"
                            : "border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/50"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleChange}
                            accept="image/png, image/jpeg, image/jpg"
                        />
                        <div className="flex flex-col items-center justify-center space-y-3 text-center">
                            <div className="p-3 rounded-full bg-slate-900 border border-slate-700 shadow-[0_0_15px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] transition-shadow">
                                <Upload className="w-7 h-7 text-cyan-400" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-base font-medium text-slate-200">Selecionar Imagem</h3>
                                <p className="text-sm text-slate-400">Arraste e Solte ou Clique para Selecionar</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                                <FileImage className="w-3 h-3" />
                                <span>JPG, PNG suportados</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
                        <div className="flex items-center gap-4 p-4">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-24 h-24 object-cover rounded-lg border border-slate-600 shadow-lg"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {(selectedFile.size / 1024).toFixed(1)} KB  •  {selectedFile.type.split('/')[1]?.toUpperCase()}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs text-green-400 font-medium">Pronta para gerar</span>
                                </div>
                            </div>
                            <button
                                onClick={clearFile}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remover imagem"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )
            ) : (
                // TEXT MODE
                <div className="relative">
                    <textarea
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        placeholder="Ex: Um dragão chinês estilo low poly azul com detalhes dourados..."
                        className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none resize-none transition-all"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono">
                        {textPrompt.length} caracteres
                    </div>
                </div>
            )}

            {/* ════ Resumo da Config Ativa ════ */}
            <div className="flex items-center justify-between bg-slate-800/30 rounded-lg px-4 py-2.5 border border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span><b className="text-slate-300">{settings.steps}</b> passos</span>
                    <span className="w-px h-3 bg-slate-700" />
                    <span>Octree <b className="text-slate-300">{settings.octreeResolution}</b></span>
                    <span className="w-px h-3 bg-slate-700" />
                    <span><b className="text-slate-300">{(settings.maxFaces / 1000).toFixed(0)}K</b> faces</span>
                    <span className="w-px h-3 bg-slate-700" />
                    <span className="uppercase font-bold text-slate-300">{settings.exportFormat}</span>
                </div>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAdvanced ? "Ocultar" : "Configurar"}
                </button>
            </div>

            {/* ════ Painel Avançado ════ */}
            {showAdvanced && (
                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/80 space-y-5">

                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            Configurações Avançadas
                        </h4>
                        <button
                            onClick={() => { setSettings({ ...DEFAULT_SETTINGS }); setActivePreset('standard'); }}
                            className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Resetar
                        </button>
                    </div>

                    {/* Geração */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Geração</p>
                        <div>
                            <label className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Passos de Inferência</span>
                                <span className="text-cyan-400 font-mono font-bold">{settings.steps}</span>
                            </label>
                            <input type="range" min="3" max="100" value={settings.steps}
                                onChange={(e) => handleSettingChange('steps', parseInt(e.target.value))}
                                className="w-full accent-cyan-500" />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                                <span>3 (rápido)</span><span>100 (máxima qualidade)</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Escala de Orientação</span>
                                    <span className="text-cyan-400 font-mono font-bold">{settings.guidance}</span>
                                </label>
                                <input type="range" min="1" max="20" step="0.5" value={settings.guidance}
                                    onChange={(e) => handleSettingChange('guidance', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500" />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Escala Dupla (DINO)</span>
                                    <span className="text-cyan-400 font-mono font-bold">{settings.dualGuidance}</span>
                                </label>
                                <input type="range" min="1" max="20" step="0.5" value={settings.dualGuidance}
                                    onChange={(e) => handleSettingChange('dualGuidance', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500" />
                            </div>
                        </div>
                    </div>

                    {/* Malha */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Malha 3D</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Resolução Octree</label>
                                <div className="flex gap-1.5">
                                    {[256, 384, 512].map(v => (
                                        <button key={v}
                                            onClick={() => handleSettingChange('octreeResolution', v)}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all
                                                ${settings.octreeResolution === v
                                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >{v}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Máximo de Faces</span>
                                    <span className="text-cyan-400 font-mono font-bold">{(settings.maxFaces / 1000).toFixed(0)}K</span>
                                </label>
                                <input type="range" min="10000" max="200000" step="10000" value={settings.maxFaces}
                                    onChange={(e) => handleSettingChange('maxFaces', parseInt(e.target.value))}
                                    className="w-full accent-cyan-500" />
                            </div>
                        </div>
                    </div>

                    {/* Exportação */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Exportação</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Formato</label>
                                <div className="flex gap-1.5">
                                    {['glb', 'stl', 'obj'].map(fmt => (
                                        <button key={fmt}
                                            onClick={() => handleSettingChange('exportFormat', fmt)}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all uppercase
                                                ${settings.exportFormat === fmt
                                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >{fmt}</button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1">
                                    {settings.exportFormat === 'glb' && 'Web, Unity, Unreal'}
                                    {settings.exportFormat === 'stl' && 'Impressão 3D (FDM/SLA)'}
                                    {settings.exportFormat === 'obj' && 'Blender, Maya, 3ds Max'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Semente (Opcional)</label>
                                <input
                                    type="number"
                                    placeholder="Aleatório"
                                    value={settings.seed}
                                    onChange={(e) => setSettings(prev => ({ ...prev, seed: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-cyan-100 placeholder-slate-600 focus:border-cyan-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Processamento */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-800">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Processamento</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'removeBg', label: 'Remover Fundo', desc: 'Extrai objeto da imagem' },
                                { key: 'generateTexture', label: 'Gerar Textura', desc: 'Renderização com cor' },
                                { key: 'useFlashVDM', label: 'Aceleração FlashVDM', desc: 'Geração muito mais rápida' },
                                { key: 'generateVariations', label: 'Gerar Variações (3x)', desc: 'Cria 3 sementes diferentes' },
                                { key: 'turboTexture', label: 'Textura Turbo', desc: 'Mais rápido, menos detalhes' },
                                { key: 'removeFloaters', label: 'Remover Flutuantes', desc: 'Limpa pedaços soltos' },
                                { key: 'removeDegenerateFaces', label: 'Limpar Faces', desc: 'Remove faces degeneradas' },
                            ].map(({ key, label, desc }) => (
                                <button
                                    key={key}
                                    onClick={() => handleSettingChange(key, !settings[key])}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all
                                        ${settings[key]
                                            ? 'bg-cyan-500/10 border-cyan-500/30'
                                            : 'bg-slate-800/50 border-slate-700/50 opacity-60 hover:opacity-80'}`}
                                >
                                    <div className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                                        ${settings[key] ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                                        {settings[key] && <span className="text-[10px] text-white font-bold">✓</span>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-300">{label}</p>
                                        <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════ BOTÃO GERAR ════ */}
            <button
                onClick={startGeneration}
                disabled={uploading || (inputMode === 'image' && !selectedFile) || (inputMode === 'text' && !textPrompt.trim())}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3
                    ${uploading
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                        : ((inputMode === 'image' && selectedFile) || (inputMode === 'text' && textPrompt.trim()))
                            ? inputMode === 'image'
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] cursor-pointer"
                                : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] cursor-pointer"
                            : "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                    }`}
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {inputMode === 'image' ? 'Enviando imagem...' : 'Enviando texto...'}
                    </>
                ) : (
                    <>
                        <Zap className={`w-5 h-5 ${((inputMode === 'image' && selectedFile) || (inputMode === 'text' && textPrompt.trim())) ? 'text-yellow-300' : ''}`} />
                        {inputMode === 'image' ? (selectedFile ? 'Gerar Modelo 3D' : 'Selecione uma imagem') : (textPrompt.trim() ? 'Criar do Zero (Texto → 3D)' : 'Digite um texto')}
                    </>
                )}
            </button>

            {errorMsg && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
