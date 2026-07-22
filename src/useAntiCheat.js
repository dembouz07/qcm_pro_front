import { useEffect, useRef } from 'react';

/**
 * Hook anti-triche pour les pages de test.
 *
 * @param {boolean} active   Activer la surveillance (test en cours).
 * @param {(msg:string)=>void} onWarn       Appelé pour un avertissement.
 * @param {(reason:string)=>void} onTerminate Appelé quand le test doit être terminé d'office.
 *
 * Politique :
 *  - Quitter l'onglet / minimiser  -> terminaison immédiate
 *  - Copier / couper               -> avertissement, puis terminaison à la 2e tentative
 *  - PrintScreen / Ctrl+P/S/U      -> terminaison immédiate (capture/impression)
 *  - Clic droit                    -> bloqué
 */
export function useAntiCheat({ active, onWarn, onTerminate }) {
  const copyStrikes = useRef(0);
  const terminatedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const terminate = (reason) => {
      if (terminatedRef.current) return;
      terminatedRef.current = true;
      onTerminate?.(reason);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        terminate('Vous avez quitté la page : le test a été terminé automatiquement.');
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      copyStrikes.current += 1;
      if (copyStrikes.current >= 2) {
        terminate('Copie détectée à plusieurs reprises : le test a été terminé.');
      } else {
        onWarn?.('⚠️ La copie est interdite pendant le test. Une nouvelle tentative mettra fin au test.');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      onWarn?.('⚠️ Le clic droit est désactivé pendant le test.');
    };

    const handleKey = (e) => {
      // Touche Impr. écran (capture d'écran) -> élimination immédiate
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        terminate("Tentative de capture d'écran détectée : le test a été terminé.");
        return;
      }
      // Ctrl/Cmd + P (imprimer), S (enregistrer), U (source) -> élimination
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes((e.key || '').toLowerCase())) {
        e.preventDefault();
        terminate('Action non autorisée détectée : le test a été terminé.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('keyup', handleKey);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('keyup', handleKey);
    };
  }, [active, onWarn, onTerminate]);
}
