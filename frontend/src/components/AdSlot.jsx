import React, { useEffect } from 'react';

/**
 * AdSense ad slot component.
 * Places: 'banner' (top horizontal), 'sidebar' (vertical), 'interstitial' (between content).
 * 
 * To activate: add your AdSense publisher ID to index.html:
 * <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX" crossorigin="anonymous"></script>
 */
const AdSlot = ({ type = 'banner', className = '' }) => {
    useEffect(() => {
        try {
            if (window.adsbygoogle) (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) { /* AdSense not loaded yet */ }
    }, []);

    // Check cookie consent
    const consent = localStorage.getItem('nexa_cookie_consent');
    if (consent !== 'accepted') return null;

    const styles = {
        banner: 'w-full min-h-[90px] max-h-[90px]',
        sidebar: 'w-full min-h-[250px]',
        interstitial: 'w-full min-h-[100px] max-h-[100px]',
    };

    return (
        <div className={`overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900/30 ${styles[type]} ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format={type === 'sidebar' ? 'auto' : 'horizontal'}
                data-full-width-responsive="true"
            // Replace with your actual ad slot IDs from AdSense dashboard
            // data-ad-client="ca-pub-XXXXXXX"
            // data-ad-slot="XXXXXXX"
            />
            {/* Placeholder when ads not loaded */}
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-700 uppercase tracking-widest font-bold">
                Anúncio
            </div>
        </div>
    );
};

export default AdSlot;
