import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSackDollar, faArrowLeft, faRotateRight, faTriangleExclamation,
  faCalendarWeek, faCalendarDay, faCalendarDays, faReceipt, faChartColumn,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

function BarChart({ series }) {
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const width = Math.max(320, series.length * 56);
  const height = 240;
  const padBottom = 34;
  const padTop = 16;
  const barW = Math.min(38, (width / series.length) * 0.6);
  const gap = width / series.length;
  const chartH = height - padBottom - padTop;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} role="img" aria-label="Graphique des revenus">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padTop + chartH * (1 - t);
          return (
            <g key={t}>
              <line x1={0} y1={y} x2={width} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={2} y={y - 3} fontSize="9" fill="#94a3b8">{fmt(max * t)}</text>
            </g>
          );
        })}
        {series.map((s, i) => {
          const barH = (s.revenue / max) * chartH;
          const x = i * gap + (gap - barW) / 2;
          const y = padTop + chartH - barH;
          return (
            <g key={i}>
              {s.revenue > 0 && (
                <text x={x + barW / 2} y={y - 4} fontSize="9" fill="#0f172a" textAnchor="middle">
                  {fmt(s.revenue)}
                </text>
              )}
              <rect x={x} y={y} width={barW} height={Math.max(0, barH)} rx="4" fill="url(#revGrad)" />
              <text x={x + barW / 2} y={height - 12} fontSize="9" fill="#64748b" textAnchor="middle">
                {s.label}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function SuperAdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear());

  async function loadRevenue() {
    try {
      setError('');
      setLoading(true);
      const response = await api.get('/superadmin/revenue', {
        params: { granularity, year },
      });
      setData(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, year]);

  const periodTotal = useMemo(
    () => (data?.series || []).reduce((sum, s) => sum + s.revenue, 0),
    [data]
  );
  const periodCount = useMemo(
    () => (data?.series || []).reduce((sum, s) => sum + s.count, 0),
    [data]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faSackDollar} /> Revenus</span>
          <h1>Statistiques de revenus</h1>
          <p>Suivez les revenus des abonnements par semaine, mois ou année.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="secondary-btn" to="/superadmin"><FontAwesomeIcon icon={faArrowLeft} /> Retour</Link>
          <button className="secondary-btn" type="button" onClick={loadRevenue} disabled={loading}>
            <FontAwesomeIcon icon={faRotateRight} /> Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="alert warning">
          <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
        </div>
      )}

      {data && (
        <section className="stats-grid">
          <div className="stat-card"><FontAwesomeIcon icon={faSackDollar} /><span>{fmt(data.kpis.total_all_time)} F</span><small>Revenus totaux</small></div>
          <div className="stat-card"><FontAwesomeIcon icon={faCalendarWeek} /><span>{fmt(data.kpis.this_week)} F</span><small>Cette semaine</small></div>
          <div className="stat-card"><FontAwesomeIcon icon={faCalendarDays} /><span>{fmt(data.kpis.this_month)} F</span><small>Ce mois</small></div>
          <div className="stat-card"><FontAwesomeIcon icon={faCalendarDay} /><span>{fmt(data.kpis.this_year)} F</span><small>Cette année</small></div>
        </section>
      )}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={granularity === 'week' ? 'primary-btn' : 'secondary-btn'}
              type="button" onClick={() => setGranularity('week')}
            >
              <FontAwesomeIcon icon={faCalendarWeek} /> Semaine
            </button>
            <button
              className={granularity === 'month' ? 'primary-btn' : 'secondary-btn'}
              type="button" onClick={() => setGranularity('month')}
            >
              <FontAwesomeIcon icon={faCalendarDays} /> Mois
            </button>
            <button
              className={granularity === 'year' ? 'primary-btn' : 'secondary-btn'}
              type="button" onClick={() => setGranularity('year')}
            >
              <FontAwesomeIcon icon={faCalendarDay} /> Année
            </button>
          </div>

          {granularity === 'month' && data?.available_years?.length > 0 && (
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {data.available_years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className="score-badge"><FontAwesomeIcon icon={faChartColumn} /> Total période : {fmt(periodTotal)} FCFA</span>
          <span className="score-badge"><FontAwesomeIcon icon={faReceipt} /> {fmt(periodCount)} paiement(s)</span>
        </div>
        {loading ? (
          <div className="empty">Chargement...</div>
        ) : data && data.series.length > 0 ? (
          <BarChart series={data.series} />
        ) : (
          <div className="empty">Aucune donnée de revenu pour cette période.</div>
        )}
      </div>

      {data && data.series.length > 0 && !loading && (
        <div className="panel table-panel" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Période</th>
                <th>Revenus (FCFA)</th>
                <th>Paiements</th>
              </tr>
            </thead>
            <tbody>
              {data.series.map((s, i) => (
                <tr key={i}>
                  <td><strong>{s.label}</strong></td>
                  <td>{fmt(s.revenue)} F</td>
                  <td>{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
