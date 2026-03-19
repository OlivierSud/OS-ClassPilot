import { createContext, useContext, useState, useEffect } from 'react';

// Capture globale au niveau du module
if (typeof window !== 'undefined' && !window.pwa_listener_attached) {
  window.pwa_listener_attached = true;
  window.deferredPWAPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPWAPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
    console.log('PWA prompt captured (module level)');
  });
}

const PWAContext = createContext();

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPWAPrompt);
  const [isInstallable, setIsInstallable] = useState(!!window.deferredPWAPrompt);
  const [isInstalled, setIsInstalled] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  });

  useEffect(() => {
    const handlePromptReady = () => {
      setDeferredPrompt(window.deferredPWAPrompt);
      setIsInstallable(true);
      console.log('React: PWA prompt is now ready');
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    const handleAppInstalled = () => {
      window.deferredPWAPrompt = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Si déjà présent au chargement
    if (window.deferredPWAPrompt) {
      setDeferredPrompt(window.deferredPWAPrompt);
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    const promptToUse = deferredPrompt || window.deferredPWAPrompt;
    if (!promptToUse) {
      alert("L'installation n'est pas encore prête. Essayez de naviguer un peu sur le site.");
      return;
    }
    
    try {
      promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      console.log('Outcome:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        window.deferredPWAPrompt = null;
      }
    } catch (err) {
      console.error('Error during PWA install:', err);
      alert("Erreur lors de l'installation: " + err.message);
    }
  };

  return (
    <PWAContext.Provider value={{ isInstallable, installPWA, isInstalled }}>
      {children}
    </PWAContext.Provider>
  );
}

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
