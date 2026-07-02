/**
 * Graphique en barres léger et sans dépendance (SVG pur).
 * props:
 *  - data: [{ label, total, count }]
 *  - height: hauteur en px (défaut 260)
 *  - color: couleur des barres
 *  - format: fonction de formatage de la valeur (tooltip / axe)
 */
export default function BarChart({ data = [], height = 260, color = '#6366f1', format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const barGap = 8;
  const chartHeight = height - 40; // espace pour les labels
  const barCount = data.length || 1;

  return (
    <div className="barchart" style={{ width: '100%', overflowX: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: barGap,
          height,
          minWidth: barCount * 34,
          padding: '8px 4px 0',
        }}
      >
        {data.map((d, i) => {
          const h = Math.round((d.total / max) * chartHeight);
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 26 }}
              title={`${d.label} : ${format(d.total)} (${d.count} paiement${d.count > 1 ? 's' : ''})`}
            >
              <span style={{ fontSize: 10, color: '#64748b', marginBottom: 4, whiteSpace: 'nowrap' }}>
                {d.total > 0 ? format(d.total) : ''}
              </span>
              <div
                style={{
                  width: '100%',
                  height: Math.max(2, h),
                  background: d.total > 0 ? color : '#e2e8f0',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height .3s ease',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: '#475569',
                  marginTop: 6,
                  whiteSpace: 'nowrap',
                  transform: data.length > 12 ? 'rotate(-45deg)' : 'none',
                }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
