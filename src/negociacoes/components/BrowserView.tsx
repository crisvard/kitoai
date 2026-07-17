import { useEffect, useRef, useState } from 'react';
import { useOtherNav } from '../contexts/OtherNavContext';
import { startBrowser, stopBrowser, buildNovncUrl, BrowserSession } from '../services/browserSessions';
import { BROWSER_API_BASE } from '../config';

interface BrowserViewProps {
    navId: string;
}

export default function BrowserView({ navId }: BrowserViewProps) {
    const { isGridMode, setGridMode, removeNavItem } = useOtherNav();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<BrowserSession | null>(null);
    const [status, setStatus] = useState<'connecting' | 'active' | 'closing' | 'error'>('connecting');
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        let active = true;
        setCancelled(false);
        setStatus('connecting');

        startBrowser(navId)
            .then((sess) => {
                if (!active) return;
                setSession(sess);
                setStatus('active');
            })
            .catch((e: Error) => {
                if (!active) return;
                console.error(e);
                setStatus('error');
                setLoading(false);
            });

        return () => {
            active = false;
            setCancelled(true);
        };
    }, [navId]);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            setLoading(false);
        };

        const handleError = () => {
            setLoading(false);
        };

        iframe.addEventListener('load', handleLoad);
        iframe.addEventListener('error', handleError);

        return () => {
            iframe.removeEventListener('load', handleLoad);
            iframe.removeEventListener('error', handleError);
        };
    }, [session]);

    const handleClose = async () => {
        setStatus('closing');
        try {
            await stopBrowser(navId);
            removeNavItem(navId);
        } catch (e) {
            console.error(e);
            alert('Erro ao fechar navegador');
            setStatus('error');
        }
    };

    const iframeSrc = session ? buildNovncUrl(session).replace('ws://', 'http://').replace('wss://', 'https://') : '';

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{navId}</h3>
                <div className="flex gap-2">
                    {status === 'active' && (
                        <button
                            onClick={handleClose}
                            className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-medium text-red-500 hover:bg-red-500/30"
                        >
                            Fechar navegador
                        </button>
                    )}
                    {isGridMode && (
                        <button
                            onClick={() => setGridMode(false)}
                            className="rounded-lg bg-[#c4d82e]/20 px-3 py-1 text-sm font-medium text-[#c4d82e] hover:bg-[#c4d82e]/30"
                        >
                            Voltar para um
                        </button>
                    )}
                </div>
            </div>

            <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-black">
                {status === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent border-[#c4d82e]"></div>
                            <p className="text-sm text-gray-400">Iniciando sessão na nuvem...</p>
                        </div>
                    </div>
                )}
                {status === 'closing' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                            <p className="text-sm text-gray-400">Encerrando sessão...</p>
                        </div>
                    </div>
                )}
                {status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                            <p className="text-sm text-red-400">Erro ao comunicar com a VM.</p>
                        </div>
                    </div>
                )}
                {status === 'active' && session && (
                    <iframe
                        ref={iframeRef}
                        src={iframeSrc}
                        title={navId}
                        className="h-full w-full border-none"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock"
                        onError={() => setLoading(false)}
                    />
                )}
            </div>
        </div>
    );
}