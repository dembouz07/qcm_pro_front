import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faChartLine,
  faCircleCheck,
  faClipboardQuestion,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { PublicFooter, PublicHeader, bookingUrl, trackPublicIntent } from '../components/PublicChrome.jsx';

const QUESTIONS = [
  {
    body: 'Quel indicateur permet le mieux de vérifier un acquis après une formation ?',
    choices: ['Le nombre de diapositives', 'Une réponse à une situation d’application', 'La durée de la pause'],
    answer: 1,
    explanation: 'Une situation d’application vérifie si le participant sait mobiliser l’acquis, pas seulement le reconnaître.',
  },
  {
    body: 'À quoi sert une mesure T0 ?',
    choices: ['Établir le niveau initial', 'Remplacer le suivi', 'Classer définitivement les participants'],
    answer: 0,
    explanation: 'Le T0 fournit un point de référence avant l’action de formation pour interpréter la progression.',
  },
  {
    body: 'Quand programmer un suivi T+6 ?',
    choices: ['Six heures après', 'À la fin de la présentation', 'Environ six mois après le diagnostic initial'],
    answer: 2,
    explanation: 'Le suivi à six mois observe l’ancrage dans la durée et les évolutions depuis le diagnostic initial.',
  },
  {
    body: 'Un score Mindset doit-il décider seul d’une promotion ou d’un recrutement ?',
    choices: ['Oui, automatiquement', 'Non, jamais sans analyse humaine et éléments complémentaires', 'Seulement si le score dépasse 80'],
    answer: 1,
    explanation: 'Un score est un support de dialogue. Il ne doit jamais produire, à lui seul, une décision RH.',
  },
  {
    body: 'Quelle preuve est la plus utile à un commanditaire de formation ?',
    choices: ['Une comparaison documentée avant/après', 'Une liste de présence seule', 'Le nombre de couleurs du support'],
    answer: 0,
    explanation: 'Une comparaison documentée relie le niveau initial, les acquis et le suivi aux objectifs de la formation.',
  },
];

export default function DemoQuiz() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(
    () => QUESTIONS.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0),
    [answers],
  );

  function restart() {
    setAnswers({});
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function finishDemo() {
    setSubmitted(true);
    trackPublicIntent('demo_completed', 'demo');
  }

  return (
    <div className="public-page public-demo-page">
      <PublicHeader />
      <main>
        <section className="public-page-hero compact">
          <Link className="back-link" to="/"><FontAwesomeIcon icon={faArrowLeft} /> Retour à l’accueil</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardQuestion} /> Démonstration publique · sans compte</span>
          <h1>Testez une évaluation comme un participant.</h1>
          <p>Cinq questions, une correction immédiate et aucun compte à créer. Les réponses restent uniquement dans votre navigateur pendant cette démonstration.</p>
          <div className="demo-progress" aria-label={`${answeredCount} questions répondues sur ${QUESTIONS.length}`}>
            <span style={{ width: `${submitted ? 100 : (answeredCount / QUESTIONS.length) * 100}%` }} />
          </div>
          <small>{submitted ? 'Évaluation terminée' : `${answeredCount}/${QUESTIONS.length} réponses`}</small>
        </section>

        <section className="demo-quiz-shell" aria-live="polite">
          {submitted && (
            <div className="demo-result-card">
              <span><FontAwesomeIcon icon={faChartLine} /></span>
              <div><small>Votre résultat de démonstration</small><strong>{score}/{QUESTIONS.length}</strong><p>{score >= 4 ? 'Les principes essentiels sont maîtrisés.' : 'La correction ci-dessous vous permet de revoir chaque principe.'}</p></div>
            </div>
          )}

          <div className="demo-question-list">
            {QUESTIONS.map((question, questionIndex) => (
              <article className={`demo-question-card ${submitted ? 'corrected' : ''}`} key={question.body}>
                <div className="demo-question-heading"><span>{questionIndex + 1}</span><h2>{question.body}</h2></div>
                <div className="demo-choice-list">
                  {question.choices.map((choice, choiceIndex) => {
                    const selected = answers[questionIndex] === choiceIndex;
                    const correct = submitted && choiceIndex === question.answer;
                    const wrong = submitted && selected && choiceIndex !== question.answer;
                    return (
                      <button
                        type="button"
                        className={`${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
                        onClick={() => !submitted && setAnswers((current) => ({ ...current, [questionIndex]: choiceIndex }))}
                        disabled={submitted}
                        key={choice}
                      >
                        <span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}{correct && <FontAwesomeIcon icon={faCircleCheck} />}
                      </button>
                    );
                  })}
                </div>
                {submitted && <p className="demo-explanation"><strong>Pourquoi ?</strong> {question.explanation}</p>}
              </article>
            ))}
          </div>

          <div className="demo-actions">
            {!submitted ? (
              <button className="primary-btn large" type="button" disabled={answeredCount !== QUESTIONS.length} onClick={finishDemo}>
                Voir ma correction <FontAwesomeIcon icon={faArrowRight} />
              </button>
            ) : (
              <>
                <button className="secondary-btn large" type="button" onClick={restart}><FontAwesomeIcon icon={faRotateRight} /> Recommencer</button>
                <a className="primary-btn large" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'demo')}>Réserver une démo formateur <FontAwesomeIcon icon={faArrowRight} /></a>
              </>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
