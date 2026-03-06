import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cuboid, Menu, X, LogIn, User } from 'lucide-react';
import { auth } from '../firebase';
import { useAuthState } from '../hooks/useAuth';

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuthState();

    const links = [
        { to: '/', label: 'Início' },
        { to: '/generate', label: 'Gerar' },
        { to: '/gallery', label: 'Galeria' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-shadow">
                            <Cuboid className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                Nexa 3D Gen
                            </span>
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/30 uppercase tracking-wider">
                                Beta
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                    ${isActive(link.to)
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Button */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                                ) : (
                                    <User className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="text-sm text-slate-300 font-medium">{user.displayName || 'Perfil'}</span>
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                            >
                                <LogIn className="w-4 h-4" />
                                Entrar
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl">
                    <div className="px-4 py-4 space-y-2">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all
                                    ${isActive(link.to) ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-2 border-t border-slate-800">
                            {user ? (
                                <Link to="/profile" onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                                    Meu Perfil
                                </Link>
                            ) : (
                                <Link to="/login" onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 rounded-lg text-sm font-bold text-cyan-400 bg-cyan-500/10">
                                    Entrar / Cadastrar
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
