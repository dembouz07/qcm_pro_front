import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faListCheck, faCircleCheck, faStar, faArrowUp, faArrowDown,
  faUsersGear, faSackDollar, faRotateRight, faTriangleExclamation,
  faClipboardCheck, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const CAT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#c7d2fe'];
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

function Trend({ value }) {
  const up = (value ?? 0) >= 0;
  return (
    <span className={`sa-trend ${up ? 'up' : 'down'}`}>
      <FontAwesomeIcon icon={up ? faArrowUp : faArrowDown} /> {Math.abs(value ?? 0)}%
      <small> ce mois</small>
    </span>
  );
}

function LineChart({ series }) {
  const w = 580, h = 240, padL = 34, padR = 14, padT = 16, padB = 30;
  const max = Math.max(1, ...series.map((s) => s.value));
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;
  const pts = series.map((s, i) => ({
    x: padL + i * stepX,
    y: padT + innerH * (1 - s.value / max),
    ...s,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = pts.length
    ? `${line} L${pts[pts.length - 1].x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sa-linechart" role="img" aria-label="Performance">
      <defs>
        <linearGradient id="lcArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const y = padT + innerH * t;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={4} y={y + 3} fontSize="9" fill="#94a3b8">{Math.round(max * (1 - t))}</text>
          </g>
        );
      })}
      {area && <path d={area} fill="url(#lcArea)" />}
      {line && <path d={line} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
          <text x={p.x} y={h - 10} fontSize="10" fill="#64748b" textAnchor="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 62, cx = 80, cy = 80, stroke = 24;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="sa-donut-wrap">
      <svg viewBox="0 0 160 160" className="sa-donut" role="img" aria-label="Catégories">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2ff" strokeWidth={stroke} />
        {total > 0 && data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circ;
          const seg = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r} fill="none"
              stroke={CAT_COLORS[i % CAT_COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-acc * circ}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
          acc += frac;
          return seg;
        })}
        <text x={cx} y={cy - 4} fontSize="26" fontWeight="800" fill="#0f172a" textAnchor="middle">{fmt(total)}</text>
        <text x={cx} y={cy + 16} fontSize="11" fill="#64748b" textAnchor="middle">Total</text>
      </svg>
      <ul className="sa-legend">
        {data.map((d, i) => (
          <li key={i}>
            <span className="dot" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
            <span className="lbl">{d.label}</span>
            <span className="val">{fmt(d.value)}</span>
          </li>
        ))}
        {data.length === 0 && <li className="muted">Aucune donnée</li>}
      </ul>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStats() {
    try {
      setError('');
      setLoading(true);
      const response = await api.get('/superadmin/stats');
      setStats(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  const k = stats?.kpis;

  return (
    <div className="page sa-dashboard">
      <div className="page-header">
        <div>
          <h1>Bon retour, {user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p>Voici l'activité de la plateforme QCM Pro aujourd'hui.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-btn" to="/superadmin/revenue"><FontAwesomeIcon icon={faSackDollar} /> Revenus</Link>
          <Link className="secondary-btn" to="/superadmin/users"><FontAwesomeIcon icon={faUsersGear} /> Utilisateurs</Link>
          <button className="secondary-btn" type="button" onClick={loadStats} disabled={loading}>
            <FontAwesomeIcon icon={faRotateRight} /> Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="alert warning"><FontAwesomeIcon icon={faTriangleExclamation} /> {error}</div>
      )}

      {loading ? (
        <div className="empty">Chargement du tableau de bord...</div>
      ) : stats && k ? (
        <>
          <section className="sa-kpis">
            <div className="sa-kpi highlight">
              <span className="sa-kpi-ico"><FontAwesomeIcon icon={faListCheck} /></span>
              <small>Total QCM</small>
              <strong>{fmt(k.total_assessments)}</strong>
              <Trend value={k.total_assessments_change} />
            </div>
            <div className="sa-kpi">
              <span className="sa-kpi-ico"><FontAwesomeIcon icon={faCircleCheck} /></span>
              <small>Tests passés</small>
              <strong>{fmt(k.completed)}</strong>
              <Trend value={k.completed_change} />
            </div>
            <div className="sa-kpi">
              <span className="sa-kpi-ico"><FontAwesomeIcon icon={faStar} /></span>
              <small>Score moyen</small>
              <strong>{k.avg_score}%</strong>
              <Trend value={k.avg_score_change} />
            </div>
          </section>

          <section className="sa-grid">
            <div className="panel sa-perf">
              <div className="sa-panel-head">
                <h3>Performance (7 jours)</h3>
                <span className="badge">{fmt(stats.submissions.last_7_days)} tests</span>
              </div>
              <LineChart series={stats.performance || []} />
            </div>

            <div className="panel sa-cat">
              <div className="sa-panel-head"><h3>QCM par classe</h3></div>
              <Donut data={stats.categories || []} />
            </div>
          </section>

          <section className="panel sa-activity">
            <div className="sa-panel-head">
              <h3>Activité récente</h3>
              <Link className="sa-link" to="/superadmin/users">Tout voir <FontAwesomeIcon icon={faArrowRight} /></Link>
            </div>
            {(stats.recent_activity || []).length === 0 ? (
              <div className="empty">Aucune activité récente.</div>
            ) : (
              <ul className="sa-feed">
                {stats.recent_activity.map((a, i) => (
                  <li key={i}>
                    <span className="sa-feed-ico"><FontAwesomeIcon icon={faClipboardCheck} /></span>
                    <div className="sa-feed-body">
                      <strong>{a.title}</strong>
                      <small>{a.participant}{a.note != null ? ` · ${a.note}/20` : ''}</small>
                    </div>
                    <span className="sa-feed-time">{a.time_ago}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
