import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthState } from '../hooks/useAuth';
import { useGeneration } from '../contexts/GenerationContext';
import { User, Mail, Calendar, Hash, LogOut, Cuboid } from 'lucide-react';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuthState();
    const { history } = useGeneration();

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

            {/* Profile Card */}
            <div className="glass rounded-2xl p-8 mb-8">
                <div className="flex items-center gap-5">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-cyan-500/30" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <User className="w-8 h-8 text-cyan-400" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-white">{user.displayName || 'Usuário'}</h2>
                        <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <Cuboid className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white font-mono">{history.length}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Modelos Gerados</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <Hash className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white font-mono">{user.uid.slice(0, 6)}</p>
                        <p className="text-[11px] text-slate-500 mt-1">ID do Usuário</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <Calendar className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                        <p className="text-lg font-bold text-white font-mono">
                            {new Date(user.metadata.creationTime).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Membro Desde</p>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl font-medium text-sm transition-all"
            >
                <LogOut className="w-4 h-4" />
                Sair da Conta
            </button>
        </div>
    );
};

export default ProfilePage;
