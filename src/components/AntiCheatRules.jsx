import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faRightFromBracket, faCopy, faCamera, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const rules = [
  { icon: faRightFromBracket, text: "Si vous quittez la page ou changez d'onglet, le test est terminé automatiquement." },
  { icon: faCopy, text: 'Copier le texte est interdit : un avertissement, puis fin du test à la 2ᵉ tentative.' },
  { icon: faCamera, text: "Toute tentative de capture d'écran (PrintScreen) met fin au test immédiatement." }
];

export default function AntiCheatRules() {
  return (
    <div className="anticheat-rules">
      <div className="anticheat-rules-head">
        <FontAwesomeIcon icon={faShieldHalved} />
        <h3>Règles anti-triche</h3>
      </div>
      <ul>
        {rules.map((r, i) => (
          <li key={i}>
            <FontAwesomeIcon icon={r.icon} />
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
      <p className="anticheat-rules-note">
        <FontAwesomeIcon icon={faCircleInfo} /> Assurez-vous d'avoir une bonne connexion et de ne pas être dérangé avant de commencer.
      </p>
    </div>
  );
}
