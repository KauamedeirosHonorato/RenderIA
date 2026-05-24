import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, Cpu, Download, Cuboid, Layers, Zap, Shield, Printer, Palette, Loader2 } from 'lucide-react';
import { useAuthState } from '../hooks/useAuth';

const LandingPage = () => {
    const { user, loading } = useAuthState();

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-mono">Verificando sessão do estúdio...</p>
            </div>
        );
    }

    if (user) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-10">
                {/* 1. Personalized Welcome Header Card */}
                <div className="glass rounded-3xl p-6 md:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                        <img 
                            src={user.photoURL || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60"} 
                            alt="Avatar" 
                            className="w-20 h-20 rounded-full border-4 border-slate-800 shadow-xl object-cover bg-slate-900"
                        />
                        <div className="space-y-1.5">
                            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                                Olá, <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">{user.displayName || 'Criador'}</span>! 👋
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                                Seu estúdio criativo tridimensional está ativo e pronto. Explore nossas ferramentas de aceleração por inteligência artificial e visualização PBR de alta fidelidade abaixo.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-black tracking-wider uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Sessão Segura Ativa
                        </div>
                    </div>
                </div>

                {/* 2. Tools Grid Section */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Ferramentas de Criação</h3>
                        <p className="text-xs text-slate-500">Selecione uma ferramenta abaixo para iniciar ou gerenciar seu fluxo tridimensional.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* CARD 1: IA Generator */}
                        <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-lg hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(6,182,212,0.05)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-[30px] pointer-events-none" />
                            <div className="space-y-4">
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 w-fit group-hover:scale-105 transition-transform duration-300 shadow-md">
                                    <Zap className="w-6 h-6 animate-pulse" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-base font-bold text-white group-hover:text-yellow-300 transition-colors">
                                        Gerador de Modelos IA
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Converta fotos 2D ou descrições em texto em modelos 3D completos. Mapeamento de texturas e geometria fechada (watertight) prontos em poucos minutos com a IA Hunyuan3D-2.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800/60 mt-6 flex justify-between items-center">
                                <span className="text-[10px] font-mono text-slate-500">Pipeline Imagem → 3D</span>
                                <Link 
                                    to="/generate" 
                                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                >
                                    Abrir Gerador IA
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* CARD 2: 3D Customizer */}
                        <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-lg hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(6,182,212,0.05)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-[30px] pointer-events-none" />
                            <div className="space-y-4">
                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 w-fit group-hover:scale-105 transition-transform duration-300 shadow-md">
                                    <Palette className="w-6 h-6" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                                        Customizador 3D de Mockups
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Mapeie estampas 360° em canecas e copos sem distorções. Simule líquidos realistas (café, leite, chá) e acople adornos tridimensionais IA com banho de ouro, prata e cerâmica.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800/60 mt-6 flex justify-between items-center">
                                <span className="text-[10px] font-mono text-slate-500">Visualizador PBR Interativo</span>
                                <Link 
                                    to="/customizer" 
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                >
                                    Abrir Customizador
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* CARD 3: Community Gallery */}
                        <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-lg hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(6,182,212,0.05)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[30px] pointer-events-none" />
                            <div className="space-y-4">
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit group-hover:scale-105 transition-transform duration-300 shadow-md">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                                        Galeria da Comunidade
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Explore e faça o download de malhas 3D brutas da IA ou carregue mockups completos de canecas projetadas em 3D de outros criadores com um único clique diretamente no seu editor.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800/60 mt-6 flex justify-between items-center">
                                <span className="text-[10px] font-mono text-slate-500">Feed de Projetos Mesclados</span>
                                <Link 
                                    to="/gallery" 
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                >
                                    Visitar Galeria
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* CARD 4: API & Developer Center */}
                        <div className="glass rounded-2xl p-6 border border-slate-800/80 shadow-lg hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(6,182,212,0.05)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[30px] pointer-events-none" />
                            <div className="space-y-4">
                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit group-hover:scale-105 transition-transform duration-300 shadow-md">
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                                        Central da API & Colab GPU
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Configure sua aceleração por GPU dedicada no Google Colab, gerencie seus mockups de canecas salvos em cache local ou personalize suas preferências de perfil VIP.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800/60 mt-6 flex justify-between items-center">
                                <span className="text-[10px] font-mono text-slate-500">Ngrok Tunnel & Perfil</span>
                                <Link 
                                    to="/profile" 
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                >
                                    Configurar API
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* ═══════════ HERO ═══════════ */}
            <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
                </div>

                <div className="relative max-w-5xl mx-auto text-center stagger">
                    {/* Badge */}
                    <div className="animate-fade-up opacity-0 inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold tracking-wider uppercase mb-8">
                        <Zap className="w-3.5 h-3.5" />
                        IA Generativa de Última Geração
                    </div>

                    {/* Title */}
                    <h1 className="animate-fade-up opacity-0 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
                        <span className="text-white">Transforme Imagens em</span>
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent animate-gradient-x">
                            Modelos 3D Profissionais
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="animate-fade-up opacity-0 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Gere modelos 3D de alta qualidade com inteligência artificial em minutos.
                        Pronto para <span className="text-cyan-400 font-semibold">impressão 3D</span>, <span className="text-blue-400 font-semibold">games</span> e <span className="text-indigo-400 font-semibold">visualização profissional</span>.
                    </p>

                    {/* CTA */}
                    <div className="animate-fade-up opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/generate"
                            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 transition-all"
                        >
                            <Cuboid className="w-5 h-5" />
                            Gerar Modelo 3D Agora
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/gallery"
                            className="flex items-center gap-2 px-6 py-4 text-slate-400 hover:text-white font-medium text-sm border border-slate-700 rounded-xl hover:bg-slate-800/50 transition-all"
                        >
                            Ver Galeria
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="animate-fade-up opacity-0 mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                        <StatItem value="3" label="Formatos" suffix="" />
                        <StatItem value="< 5" label="Minutos" suffix="min" />
                        <StatItem value="200K" label="Max Faces" suffix="+" />
                    </div>
                </div>
            </section>

            {/* ═══════════ COMO FUNCIONA ═══════════ */}
            <section className="py-24 px-4 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto relative">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Como Funciona</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Três passos simples para transformar qualquer imagem em um modelo 3D profissional.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StepCard
                            step={1}
                            icon={Upload}
                            title="Envie sua Imagem"
                            desc="Faça upload de uma foto do objeto que deseja transformar em 3D. JPG ou PNG."
                            color="cyan"
                        />
                        <StepCard
                            step={2}
                            icon={Cpu}
                            title="IA Processa"
                            desc="Nossa IA analisa a geometria, gera a malha 3D e aplica texturas automaticamente."
                            color="blue"
                        />
                        <StepCard
                            step={3}
                            icon={Download}
                            title="Baixe o Modelo"
                            desc="Exporte em GLB, STL ou OBJ. Pronto para impressão 3D, games ou visualização."
                            color="indigo"
                        />
                    </div>
                </div>
            </section>

            {/* ═══════════ FEATURES ═══════════ */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Por que o Nexa 3D Gen?</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Tecnologia de ponta para resultados profissionais.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard icon={Layers} title="Multi-Formato" desc="Exporte em GLB (web), STL (impressão 3D) e OBJ (Blender) simultaneamente." />
                        <FeatureCard icon={Printer} title="Pronto para Impressão" desc="Malhas otimizadas e watertight para FDM e SLA. Validação automática." />
                        <FeatureCard icon={Palette} title="Textura IA" desc="Pintura de textura automática a partir da imagem original, em múltiplos ângulos." />
                        <FeatureCard icon={Zap} title="4 Presets de Qualidade" desc="Do rápido (3 min) ao ultra (20 min). Configurações profissionais de especialista." />
                        <FeatureCard icon={Shield} title="Pós-Processamento" desc="Remoção de flutuantes, limpeza de faces degeneradas e redução automática." />
                        <FeatureCard icon={Cuboid} title="Visualização 4D" desc="Viewer 3D interativo com iluminação studio, sombras e rotação automática." />
                    </div>
                </div>
            </section>

            {/* ═══════════ CTA FINAL ═══════════ */}
            <section className="py-24 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="glass rounded-3xl p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
                        <div className="relative">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Pronto para Começar?</h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                Crie sua conta gratuita e comece a gerar modelos 3D profissionais em minutos.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 transition-all"
                            >
                                Comece Grátis Agora
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

/* ═══ Sub-Components ═══ */

const StatItem = ({ value, label, suffix }) => (
    <div className="text-center">
        <p className="text-2xl font-bold text-white font-mono">{value}<span className="text-cyan-400 text-sm">{suffix}</span></p>
        <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
    </div>
);

const StepCard = ({ step, icon: Icon, title, desc, color }) => {
    const colors = {
        cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
        indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    };
    return (
        <div className={`relative p-8 rounded-2xl bg-gradient-to-b ${colors[color]} border group hover:-translate-y-1 transition-all duration-300`}>
            <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                {step}
            </div>
            <Icon className={`w-10 h-10 mb-4 ${colors[color].split(' ').pop()}`} />
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="glass rounded-xl p-6 group hover:-translate-y-1 hover:border-slate-700 transition-all duration-300">
        <div className="bg-cyan-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:animate-glow-pulse">
            <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
