import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

const CookieConsent = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('nexa_cookie_consent');
        if (!consent) {
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('nexa_cookie_consent', 'accepted');
        setVisible(false);
        // Initialize analytics after consent
        if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted' });
    };

    const decline = () => {
        localStorage.setItem('nexa_cookie_consent', 'declined');
        setVisible(false);
        if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-fade-up" style={{ animationDelay: '0s' }}>
            <div className="max-w-3xl mx-auto glass rounded-2xl p-5 shadow-2xl border-slate-700/80">
                <div className="flex items-start gap-4">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 shrink-0">
                        <Cookie className="w-5 h-5 text-amber-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white mb-1">Este site usa cookies 🍪</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Usamos cookies para análise de uso e exibição de anúncios personalizados.
                            Ao aceitar, você concorda com nossa{' '}
                            <a href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">Política de Privacidade</a> e{' '}
                            <a href="/terms" className="text-cyan-400 hover:text-cyan-300 underline">Termos de Uso</a>.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={decline}
                            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-all"
                        >
                            Recusar
                        </button>
                        <button
                            onClick={accept}
                            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        >
                            Aceitar Todos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
