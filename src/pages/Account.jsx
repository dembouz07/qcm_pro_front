import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faFloppyDisk, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Account() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileErr(''); setProfileMsg(''); setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profile);
      setUser(res.data.user);
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

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faUser} /> Mon compte</span>
          <h1>Paramètres du compte</h1>
          <p>Modifiez vos informations personnelles et votre mot de passe.</p>
        </div>
      </div>

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
    </div>
  );
}
