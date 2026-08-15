import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faClipboardQuestion, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import AuthTopbar from '../components/AuthTopbar.jsx';
import CorrectionView from '../components/CorrectionView.jsx';
import ParticipantQuizFlow from '../features/participantQuiz/ParticipantQuizFlow.jsx';
import ParticipantQuizResult from '../features/participantQuiz/ParticipantQuizResult.jsx';

const STORAGE_KEY = 'qcm_demo_progress';

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
].map((question, questionIndex) => ({
  id: questionIndex,
  body: question.body,
  multiple: false,
  answer: question.answer,
  explanation: question.explanation,
  choices: question.choices.map((body, choiceIndex) => ({ id: choiceIndex, body })),
}));

function loadDemoAnswers() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    return stored?.answers && typeof stored.answers === 'object' ? stored.answers : {};
  } catch {
    return {};
  }
}

export default function DemoQuiz() {
  const [answers, setAnswers] = useState(loadDemoAnswers);
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(
    () => QUESTIONS.reduce(
      (total, question) => total + (answers[question.id] === question.answer ? 1 : 0),
      0,
    ),
    [answers],
  );

  const correction = useMemo(() => ({
    questions: QUESTIONS.map((question) => ({
      id: question.id,
      body: question.body,
      explanation: question.explanation,
      is_correct: answers[question.id] === question.answer,
      choices: question.choices.map((choice) => ({
        id: choice.id,
        body: choice.body,
        is_correct: choice.id === question.answer,
        chosen: answers[question.id] === choice.id,
      })),
    })),
  }), [answers]);

  useEffect(() => {
    if (submitted) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers }));
    } catch {
      // La démo reste utilisable si le stockage de session est désactivé.
    }
  }, [answers, submitted]);

  function restart() {
    setAnswers({});
    setSubmitted(false);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* non bloquant */ }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function finishDemo() {
    setSubmitted(true);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* non bloquant */ }
  }

  return (
    <div className="public-demo-page">
      <AuthTopbar active="demo" />
      <main className="public-demo-main">
        {submitted ? (
          <ParticipantQuizResult
            title="Évaluation terminée"
            announcement={`Votre résultat de démonstration est de ${score} sur ${QUESTIONS.length}.`}
            correction={<CorrectionView correction={correction} />}
            correctionLabel="Voir ma correction"
            actions={(
              <>
                <button className="secondary-btn" type="button" onClick={restart}>
                  <FontAwesomeIcon icon={faRotateRight} /> Recommencer
                </button>
                <Link className="primary-btn" to="/register-admin">
                  Créer un espace formateur <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </>
            )}
          >
            <p>Votre résultat de démonstration</p>
            <div className="final-score">{score}/{QUESTIONS.length}</div>
            <p>{score >= 4 ? 'Les principes essentiels sont maîtrisés.' : 'La correction vous permet de revoir chaque principe.'}</p>
          </ParticipantQuizResult>
        ) : (
          <>
            <section className="page narrow participant-demo-hero">
              <Link className="back-link" to="/"><FontAwesomeIcon icon={faArrowLeft} /> Retour à l’accueil</Link>
              <span className="eyebrow"><FontAwesomeIcon icon={faClipboardQuestion} /> Démonstration publique · sans compte</span>
              <h1>Testez un QCM en ligne sans créer de compte.</h1>
              <p>Cinq questions, une revue finale et aucun compte à créer. Vos réponses restent dans cet onglet pendant la démonstration.</p>
            </section>

            <section className="page narrow participant-demo-shell">
              <ParticipantQuizFlow
                questions={QUESTIONS}
                answers={answers}
                onAnswersChange={setAnswers}
                onSubmit={finishDemo}
                submitLabel="Voir mon résultat"
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
