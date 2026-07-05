import { useEffect } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';

const nf = new Intl.NumberFormat('fr-FR');

/**
 * Compteur animé de 0 vers `value`.
 * Props: value (number), suffix (string), duration (s)
 */
export default function CountUp({ value = 0, suffix = '', duration = 1.1 }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => nf.format(Math.round(v)) + suffix);

  useEffect(() => {
    const controls = animate(mv, value || 0, { duration, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <motion.span>{text}</motion.span>;
}
