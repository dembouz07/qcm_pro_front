import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCompass, faUser, faLock, faFloppyDisk, faCircleCheck, faTriangleExclamation, faDownload, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Account() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', current_password: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dataErr, setDataErr] = useState('');
  const [exportPassword, setExportPassword] = useState('');

  async function saveProfile(e) {
    e.preventDefault();
    setProfileErr(''); setProfileMsg(''); setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profile);
      setUser(res.data.user);
      setProfile((current) => ({ ...current, current_password: '' }));
      setProfileMsg('Profil mis à jour avec succès.');
    } catch (err) {
      setProfileErr(getApiError(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwdErr(''); setPwdMsg(''); setSavingPwd(true);
    try {
      await api.put('/auth/password', pwd);
      setPwdMsg('Mot de passe modifié avec succès.');
      setPwd({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setPwdErr(getApiError(err));
    } finally {
      setSavingPwd(false);
    }
  }

  async function exportData() {
    setDataErr('');
    setExporting(true);
    try {
      const response = await api.post('/auth/export', { current_password: exportPassword });
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `check-performance-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportPassword('');
    } catch (err) {
      setDataErr(getApiError(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faUser} /> Mon compte</span>
          <h1>Paramètres du compte</h1>
          <p>Modifiez vos informations personnelles et votre mot de passe.</p>
        </div>
      </div>

      <motion.section
        className="account-guide-panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <span><FontAwesomeIcon icon={faCompass} /></span>
        <div>
          <h2>Besoin d’un repère ?</h2>
          <p>Consultez le parcours et les modes d’emploi adaptés à votre formule.</p>
        </div>
        <Link className="secondary-btn" to="/guide">Ouvrir le guide <FontAwesomeIcon icon={faArrowRight} /></Link>
      </motion.section>

      <motion.form
        className="panel form-grid"
        onSubmit={saveProfile}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
        <h2 className="span-2" style={{ margin: 0 }}><FontAwesomeIcon icon={faUser} /> Informations</h2>
        {profileErr && <div className="alert error span-2"><FontAwesomeIcon icon={faTriangleExclamation} /> {profileErr}</div>}
        {profileMsg && <div className="alert success span-2"><FontAwesomeIcon icon={faCircleCheck} /> {profileMsg}</div>}
        <label className="span-2">
          Nom complet
          <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
        </label>
        <label className="span-2">
          Adresse email
          <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
        </label>
        <label className="span-2">
          Mot de passe actuel <small className="muted">(requis uniquement pour changer l’email)</small>
          <input type="password" value={profile.current_password} onChange={(e) => setProfile({ ...profile, current_password: e.target.value })} autoComplete="current-password" />
        </label>
        <div className="span-2">
          <button className="primary-btn" disabled={savingProfile}>
            <FontAwesomeIcon icon={faFloppyDisk} /> {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </motion.form>

      <motion.form
        className="panel form-grid"
        onSubmit={savePassword}
        style={{ marginTop: 18 }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="span-2" style={{ margin: 0 }}><FontAwesomeIcon icon={faLock} /> Mot de passe</h2>
        {pwdErr && <div className="alert error span-2"><FontAwesomeIcon icon={faTriangleExclamation} /> {pwdErr}</div>}
        {pwdMsg && <div className="alert success span-2"><FontAwesomeIcon icon={faCircleCheck} /> {pwdMsg}</div>}
        <label className="span-2">
          Mot de passe actuel
          <input type="password" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} required />
        </label>
        <label>
          Nouveau mot de passe
          <input type="password" value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} required />
        </label>
        <label>
          Confirmer le nouveau
          <input type="password" value={pwd.password_confirmation} onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })} required />
        </label>
        <div className="span-2">
          <button className="primary-btn" disabled={savingPwd}>
            <FontAwesomeIcon icon={faLock} /> {savingPwd ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </div>
      </motion.form>

      <motion.section
        className="panel account-data-panel"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}
      >
        <div><span className="eyebrow"><FontAwesomeIcon icon={faShieldHalved} /> Mes données</span><h2>Export, correction et suppression</h2><p>Téléchargez une copie structurée des données liées à votre compte. Pour une suppression ou une opposition, suivez la procédure adaptée à votre rôle.</p></div>
        {dataErr && <div className="alert error"><FontAwesomeIcon icon={faTriangleExclamation} /> {dataErr}</div>}
        <label className="account-export-password">Confirmez votre mot de passe pour générer l’export<input type="password" value={exportPassword} onChange={(event) => setExportPassword(event.target.value)} autoComplete="current-password" required /></label>
        <div className="account-data-actions">
          <button className="primary-btn" type="button" onClick={exportData} disabled={exporting || !exportPassword}><FontAwesomeIcon icon={faDownload} /> {exporting ? 'Préparation...' : 'Exporter mes données'}</button>
          <Link className="secondary-btn" to="/confidentialite#exercer-vos-droits">Procédure de suppression <FontAwesomeIcon icon={faArrowRight} /></Link>
        </div>
      </motion.section>
    </div>
  );
}
