export const ASSESSMENT_TYPE_LABELS = {
  initial: 'Diagnostic initial · T0',
  follow_up: 'Entretien de suivi · T+6 mois',
};

export function formatAssessmentType(type) {
  return ASSESSMENT_TYPE_LABELS[type] || type;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = String(value).slice(0, 10);
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`));
}

export function seniorityLabel(months) {
  if (months === null || months === undefined || months === '') return 'Non renseignée';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];
  if (years) parts.push(`${years} an${years > 1 ? 's' : ''}`);
  if (remainingMonths || !parts.length) parts.push(`${remainingMonths} mois`);
  return parts.join(' ');
}

export function signedScore(value) {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${value}`;
}

export function todayInputValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
