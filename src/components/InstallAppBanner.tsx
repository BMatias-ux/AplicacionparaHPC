import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const DISMISSED_KEY = 'hpc_install_banner_dismissed_v1';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIos()) {
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIosHelp(false);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') dismiss();
      else setVisible(false);
      return;
    }
    if (isIos()) {
      setShowIosHelp(true);
    }
  };

  if (!visible) return null;

  return (
    <div className="absolute bottom-20 left-3 right-3 z-40 bg-slate-900 text-white rounded-2xl shadow-xl p-3.5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#9C1342] flex items-center justify-center shrink-0">
        <Download size={18} />
      </div>
      <div className="flex-1 min-w-0">
        {showIosHelp ? (
          <p className="text-xs leading-relaxed">
            Tocá <Share size={12} className="inline -mt-0.5 mx-0.5" /> Compartir y luego{' '}
            <strong>"Agregar a pantalla de inicio"</strong> para instalar la app.
          </p>
        ) : (
          <>
            <p className="text-sm font-bold leading-tight">Instalá la app en tu celular</p>
            <p className="text-xs text-white/70 mt-0.5">Acceso rápido, sin necesidad de descargarla de una tienda.</p>
            <button
              onClick={handleInstallClick}
              className="mt-2 bg-[#9C1342] hover:bg-[#800f34] transition-colors text-white text-xs font-bold px-3 py-1.5 rounded-full"
            >
              Instalar
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} className="text-white/50 hover:text-white p-1 shrink-0" aria-label="Cerrar">
        <X size={16} />
      </button>
    </div>
  );
}
