import React from 'react';
import { Link } from 'react-router-dom';
import { Cuboid, Github, Twitter, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-slate-800/50 bg-slate-950/80 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <Cuboid className="w-6 h-6 text-cyan-400" />
                            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                Nexa 3D Gen
                            </span>
                        </Link>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Transforme imagens em modelos 3D profissionais usando inteligência artificial de última geração.
                        </p>
                    </div>

                    {/* Produto */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Produto</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/generate" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Gerar Modelo</Link></li>
                            <li><Link to="/gallery" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Galeria</Link></li>
                            <li><Link to="/profile" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Meu Perfil</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/terms" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Termos de Uso</Link></li>
                            <li><Link to="/privacy" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Política de Privacidade</Link></li>
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Contato</h4>
                        <div className="flex items-center gap-3">
                            <a href="#" className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} Nexa 3D Gen. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-slate-600">
                        Powered by <span className="text-slate-500 font-medium">Hunyuan3D-2</span> • Tencent AI
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
