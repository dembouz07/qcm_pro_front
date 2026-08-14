import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faLightbulb } from '@fortawesome/free-solid-svg-icons';

/**
 * Affiche la correction d'un QCM : chaque question avec la bonne réponse,
 * la réponse de l'élève, et l'explication du formateur.
 */
export default function CorrectionView({ correction, answerLabel = 'votre réponse' }) {
  if (!correction?.questions?.length) return null;

  return (
    <div className="correction">
      {correction.questions.map((q, i) => (
        <div className={`corr-q ${q.is_correct ? 'ok' : 'ko'}`} key={q.id}>
          <div className="corr-q-head">
            <span className={`corr-badge ${q.is_correct ? 'ok' : 'ko'}`}>
              <FontAwesomeIcon icon={q.is_correct ? faCheck : faXmark} />
              <span className="sr-only">{q.is_correct ? 'Réponse correcte' : 'Réponse incorrecte'}</span>
            </span>
            <strong>Question {i + 1}. {q.body}</strong>
          </div>
          <ul className="corr-choices">
            {q.choices.map((c) => {
              const cls = [
                c.is_correct ? 'correct' : '',
                c.chosen && !c.is_correct ? 'wrong' : '',
                c.chosen ? 'chosen' : '',
              ].filter(Boolean).join(' ');
              return (
                <li key={c.id} className={cls}>
                  <span className="corr-mark">
                    {c.is_correct ? <FontAwesomeIcon icon={faCheck} /> : (c.chosen ? <FontAwesomeIcon icon={faXmark} /> : null)}
                    {(c.is_correct || c.chosen) && (
                      <span className="sr-only">
                        {c.is_correct ? 'Bonne réponse' : 'Réponse sélectionnée incorrecte'}
                      </span>
                    )}
                  </span>
                  <span className="corr-body">{c.body}</span>
                  {c.chosen && <span className="corr-tag">{answerLabel}</span>}
                </li>
              );
            })}
          </ul>
          {q.explanation && (
            <div className="corr-explain">
              <FontAwesomeIcon icon={faLightbulb} /> <strong>Explication :</strong> {q.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
