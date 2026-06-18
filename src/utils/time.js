export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function countdownTo(value) {
  const target = new Date(value).getTime();
  const diff = Math.max(0, target - Date.now());
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 60000) % 60;
  const hours = Math.floor(diff / 3600000) % 24;
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}j ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
