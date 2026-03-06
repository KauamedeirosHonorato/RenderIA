import React from 'react';
import { History, Box, ChevronRight, XCircle } from 'lucide-react';

const HistorySidebar = ({ history, onSelect, activeTaskId, onClear }) => {
    return (
        <div className="w-full h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <History className="w-5 h-5 text-indigo-400" />
                    Histórico
                </h2>
                {history.length > 0 && (
                    <button
                        onClick={onClear}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        title="Limpar Histórico"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <Box className="w-12 h-12 text-slate-700 mb-3" />
                        <p className="text-sm text-slate-400">Nenhum modelo gerado ainda.</p>
                        <p className="text-xs text-slate-500 mt-1">Suas gerações concluídas aparecerão aqui.</p>
                    </div>
                ) : (
                    history.map((item, index) => {
                        const isActive = item.id === activeTaskId;
                        const date = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className={`w-full text-left p-3 rounded-xl border transition-all duration-300 group flex items-center justify-between
                  ${isActive
                                        ? 'bg-indigo-500/10 border-indigo-500/30'
                                        : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                                        <Box className="w-4 h-4" />
                                    </div>
                                    <div className="truncate">
                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'}`}>
                                            Modelo #{history.length - index}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {date} • {item.timeElapsed}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1'}`} />
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default HistorySidebar;
