import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faCircleInfo, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const DialogContext = createContext(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog doit être utilisé dans <DialogProvider>');
  return ctx;
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const close = useCallback((result) => {
    setDialog((d) => {
      d?.resolve?.(result);
      return null;
    });
  }, []);

  const confirm = useCallback((opts = {}) => {
    const o = typeof opts === 'string' ? { message: opts } : opts;
    return new Promise((resolve) => {
      setDialog({
        mode: 'confirm',
        title: o.title || 'Confirmation',
        message: o.message || 'Êtes-vous sûr ?',
        confirmText: o.confirmText || 'Confirmer',
        cancelText: o.cancelText || 'Annuler',
        danger: o.danger ?? true,
        resolve,
      });
    });
  }, []);

  const alert = useCallback((opts = {}) => {
    const o = typeof opts === 'string' ? { message: opts } : opts;
    return new Promise((resolve) => {
      setDialog({
        mode: 'alert',
        title: o.title || 'Information',
        message: o.message || '',
        confirmText: o.confirmText || 'OK',
        variant: o.variant || 'info',
        resolve,
      });
    });
  }, []);

  // Fermeture au clavier (Échap / Entrée)
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(dialog.mode === 'alert');
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  const isDanger = dialog?.mode === 'confirm' && dialog?.danger;
  const isError = dialog?.mode === 'alert' && dialog?.variant === 'error';
  const icon = isDanger ? faTrashCan : (isError ? faTriangleExclamation : faCircleInfo);
  const toneClass = isDanger || isError ? 'danger' : 'info';

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div
            className="dlg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => close(dialog.mode === 'alert')}
          >
            <motion.div
              className="dlg-card"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`dlg-icon ${toneClass}`}>
                <FontAwesomeIcon icon={icon} />
              </div>
              <h3 className="dlg-title">{dialog.title}</h3>
              {dialog.message && <p className="dlg-msg">{dialog.message}</p>}
              <div className="dlg-actions">
                {dialog.mode === 'confirm' && (
                  <button className="secondary-btn" type="button" onClick={() => close(false)}>
                    {dialog.cancelText}
                  </button>
                )}
                <button
                  className={`primary-btn ${isDanger ? 'btn-danger' : ''}`}
                  type="button"
                  autoFocus
                  onClick={() => close(true)}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
