import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function ParticipantQuizResult({
  title,
  announcement,
  children,
  actions,
  correction,
  correctionLabel = 'Afficher la correction détaillée',
}) {
  const headingRef = useRef(null);
  const correctionHeadingRef = useRef(null);
  const triggerRef = useRef(null);
  const correctionId = useId();
  const reducedMotion = useReducedMotion();
  const [correctionOpen, setCorrectionOpen] = useState(false);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (correctionOpen) correctionHeadingRef.current?.focus({ preventScroll: true });
  }, [correctionOpen]);

  function closeCorrection() {
    setCorrectionOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }

  return (
    <div
      className="page narrow participant-result-page"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <section className="panel center success-panel participant-result-card">
        <div className="big-icon success" aria-hidden="true"><FontAwesomeIcon icon={faCheckCircle} /></div>
        <h1 ref={headingRef} tabIndex="-1">{title}</h1>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement || title}
        </p>
        {children}
        {actions && <div className="participant-result-actions">{actions}</div>}
      </section>

      {correction && (
        <section className="panel participant-correction-panel">
          <button
            ref={triggerRef}
            type="button"
            className="secondary-btn participant-correction-trigger"
            aria-expanded={correctionOpen}
            aria-controls={correctionId}
            onClick={() => setCorrectionOpen((open) => !open)}
          >
            {correctionLabel}
            <FontAwesomeIcon className={correctionOpen ? 'is-open' : ''} icon={faChevronDown} />
          </button>

          <AnimatePresence initial={false}>
            {correctionOpen && (
              <motion.div
                id={correctionId}
                className="participant-correction-content"
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeCorrection();
                }}
              >
                <div className="participant-correction-heading">
                  <h2 ref={correctionHeadingRef} tabIndex="-1">Correction détaillée</h2>
                  <button className="icon-btn" type="button" onClick={closeCorrection} aria-label="Fermer la correction">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
                {correction}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
