import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircleQuestion, 
  faClock, 
  faLock, 
  faTriangleExclamation,
  faUser,
  faBookOpen,
  faClipboardList,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { countdownTo, formatDateTime } from '../utils/time.js';
import { canAdvanceProgressiveStage } from '../quizFormValidation.js';
import { useAntiCheat } from '../useAntiCheat.js';
import AntiCheatRules from '../components/AntiCheatRules.jsx';
import ParticipantQuizFlow from '../features/participantQuiz/ParticipantQuizFlow.jsx';
import ParticipantQuizResult from '../features/participantQuiz/ParticipantQuizResult.jsx';
import ParticipantQuizState from '../features/participantQuiz/ParticipantQuizState.jsx';

const IN_PROGRESS_TTL_MS = 24 * 60 * 60 * 1000;
const SUBMITTED_TTL_MS = 24 * 60 * 60 * 1000;

export default function PublicQuiz() {
  const { token } = useParams();
  const storageKey = `qcm_public_${token}`;
  const attemptIdRef = useRef(null);
  const resultAccessTokenRef = useRef(null);

  // Étapes : 'loading' | 'info' | 'quiz' | 'progressive' | 'result' | 'error'
  const [step, setStep] = useState('loading');
  const [quizInfo, setQuizInfo] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Formulaire participant
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [referentiel, setReferentiel] = useState('');

  // Réponses
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [autoSubmitError, setAutoSubmitError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Diagnostic progressif
  const [currentStage, setCurrentStage] = useState(0);
  const [progressiveResult, setProgressiveResult] = useState(null);

  // Anti-triche
  const [warning, setWarning] = useState('');
  const [terminationReason, setTerminationReason] = useState('');

  useAntiCheat({
    active: step === 'quiz' && !result,
    onWarn: (msg) => setWarning(msg),
    onTerminate: (reason) => {
      setTerminationReason(reason);
      if (step === 'progressive') {
        submitProgressive();
      } else {
        submitAnswers({ auto: true });
      }
    }
  });

  const answersRef = useRef({});
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const restoredRef = useRef(false);

  // ─── Reprise limitée à l'onglet courant (sessionStorage) ──────────────
  function loadStored() {
    try {
      localStorage.removeItem(storageKey);
      const raw = sessionStorage.getItem(storageKey);
      const stored = raw ? JSON.parse(raw) : null;
      if (stored?.expiresAt && stored.expiresAt < Date.now()) {
        sessionStorage.removeItem(storageKey);
        return null;
      }
      return stored;
    } catch {
      return null;
    }
  }

  function saveStored(patch) {
    try {
      const current = loadStored() || {};
      const ttl = patch.submitted ? SUBMITTED_TTL_MS : IN_PROGRESS_TTL_MS;
      sessionStorage.setItem(storageKey, JSON.stringify({
        ...current,
        ...patch,
        attemptId: attemptIdRef.current,
        resultAccessToken: resultAccessTokenRef.current,
        expiresAt: Date.now() + ttl,
      }));
    } catch {
      // ignore les erreurs de quota / mode privé
    }
  }

  // Sauvegarder l'identité et les réponses en cours
  useEffect(() => {
    if (step === 'quiz' || step === 'progressive') {
      saveStored({ nom, prenom, referentiel, answers, currentStage, inProgress: true });
    }
  }, [answers, currentStage, step, nom, prenom, referentiel]); // eslint-disable-line react-hooks/exhaustive-deps -- saveStored encapsule le contrat sessionStorage existant.

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Charger les infos du quiz
  useEffect(() => {
    setStep('loading');
    api.get(`/public/quiz/${token}`)
      .then((response) => {
        setQuizInfo(response.data);
        restoreState(response.data);
      })
      .catch((err) => {
        setError(getApiError(err));
        setStep('error');
      });
  }, [token, loadAttempt]); // eslint-disable-line react-hooks/exhaustive-deps -- restoreState orchestre volontairement une seule reprise par chargement.

  async function recoverStoredSubmission(stored) {
    const accessToken = stored?.resultAccessToken || resultAccessTokenRef.current;
    if (!accessToken) return false;

    try {
      const response = await api.post('/public/my-results', { access_token: accessToken });
      const recovered = response.data.data?.[0];
      if (!recovered) return false;

      setNom(stored?.nom || '');
      setPrenom(stored?.prenom || '');
      setReferentiel(stored?.referentiel || '');

      if (recovered.quiz_type === 'progressive') {
        const recoveredProgressive = { stade_atteint: recovered.stade_atteint, stage_scores: null };
        setProgressiveResult(recoveredProgressive);
        saveStored({ submitted: true, inProgress: false, progressiveResult: recoveredProgressive });
      } else {
        setResult(recovered);
        saveStored({ submitted: true, inProgress: false, result: recovered });
      }

      setStep('result');
      return true;
    } catch {
      return false;
    }
  }

  // Restaure l'état depuis sessionStorage (résultat déjà obtenu ou quiz en cours)
  async function restoreState(info) {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const stored = loadStored();
    if (stored?.attemptId) attemptIdRef.current = stored.attemptId;
    if (stored?.resultAccessToken) resultAccessTokenRef.current = stored.resultAccessToken;

    // Déjà soumis : on réaffiche directement le résultat (interdit de refaire)
    if (stored?.submitted) {
      setNom(stored.nom || '');
      setPrenom(stored.prenom || '');
      setReferentiel(stored.referentiel || '');
      if (stored.progressiveResult) setProgressiveResult(stored.progressiveResult);
      if (stored.result) setResult(stored.result);
      setStep('result');
      return;
    }

    // Une réponse HTTP peut être perdue après l'enregistrement côté serveur.
    // Le code secret permet alors de récupérer le résultat sans recréer de soumission.
    if (stored?.inProgress && await recoverStoredSubmission(stored)) return;

    // Pré-remplir l'identité si connue
    if (stored?.nom) setNom(stored.nom);
    if (stored?.prenom) setPrenom(stored.prenom);
    if (stored?.referentiel) setReferentiel(stored.referentiel);

    // Reprise d'un quiz en cours (si ouvert et identité connue)
    const hasRequiredIdentity = stored?.nom
      && stored?.prenom
      && (info.type === 'progressive' || stored?.referentiel);

    if (stored?.inProgress && info.is_open && hasRequiredIdentity) {
      try {
        const response = await api.post(`/public/quiz/${token}/start`, {
          attempt_id: attemptIdRef.current,
          nom: stored.nom,
          prenom: stored.prenom,
          ...(info.type === 'progressive' ? {} : { referentiel: stored.referentiel }),
        });
        attemptIdRef.current = response.data.attempt_id || attemptIdRef.current;
        resultAccessTokenRef.current = response.data.result_access_token || resultAccessTokenRef.current;
        setQuiz(response.data);
        setAnswers(stored.answers || {});
        if (response.data.type === 'progressive') {
          setCurrentStage(stored.currentStage || 0);
          setStep('progressive');
        } else {
          setStep('quiz');
        }
        return;
      } catch {
        if (await recoverStoredSubmission(stored)) return;
        // Si la reprise échoue réellement, on retombe sur l'accueil.
      }
    }

    setStep('info');
  }

  // Rafraîchir les infos si le quiz est verrouillé (pour le countdown)
  useEffect(() => {
    if (step !== 'info' || !quizInfo?.is_locked) return;

    const interval = setInterval(() => {
      api.get(`/public/quiz/${token}`)
        .then((response) => {
          setQuizInfo(response.data);
          if (response.data.is_open) {
            // Le quiz vient de s'ouvrir
          }
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [step, quizInfo, token]);

  // Timer pour le quiz ouvert
  useEffect(() => {
    if (!quiz || !quiz.ends_at || result || progressiveResult) return;

    function updateTimer() {
      const endsAt = new Date(quiz.ends_at).getTime();
      const diff = endsAt - Date.now();

      if (diff <= 0) {
        setTimeLeft(0);
        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          if (quiz.type === 'progressive') {
            submitProgressive();
          } else {
            submitAnswers({ auto: true });
          }
        }
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff
      });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quiz, result, progressiveResult]); // eslint-disable-line react-hooks/exhaustive-deps -- les callbacks utilisent les refs de soumission pour éviter les doublons.

  async function handleStart(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post(`/public/quiz/${token}/start`, {
        attempt_id: attemptIdRef.current,
        nom,
        prenom,
        ...(quizInfo?.type === 'progressive' ? {} : { referentiel }),
      });
      attemptIdRef.current = response.data.attempt_id || attemptIdRef.current;
      resultAccessTokenRef.current = response.data.result_access_token || resultAccessTokenRef.current;
      setQuiz(response.data);
      if (response.data.type === 'progressive') {
        setCurrentStage(0);
        setStep('progressive');
      } else {
        setStep('quiz');
      }
    } catch (err) {
      if (err?.response?.status === 409 && await recoverStoredSubmission(loadStored())) return;
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // ─── Diagnostic progressif ─────────────────────────────
  function countOuiForStage(stage) {
    return stage.questions.reduce((count, question) => {
      const chosenId = answers[question.id];
      const ouiChoice = question.choices.find((c) => c.is_oui);
      return count + (ouiChoice && chosenId === ouiChoice.id ? 1 : 0);
    }, 0);
  }

  function stageFullyAnswered(stage) {
    return stage.questions.every((q) => answers[q.id] !== undefined);
  }

  async function handleNextStage() {
    const stages = quiz.stages || [];
    const stage = stages[currentStage];

    if (!stageFullyAnswered(stage)) {
      setError('Veuillez répondre à toutes les questions de ce stade.');
      return;
    }

    setError('');
    const threshold = quiz.stage_threshold;
    const score = countOuiForStage(stage);
    const isLastStage = currentStage >= stages.length - 1;

    // Si le blocage est actif, seul un score strictement inférieur au seuil permet d'avancer.
    if (canAdvanceProgressiveStage(score, threshold, quiz.require_stage_pass !== false) && !isLastStage) {
      setCurrentStage((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    // Sinon : fin du diagnostic, on soumet
    await submitProgressive();
  }

  async function submitProgressive() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError('');
    setAutoSubmitError('');

    const payload = {
      attempt_id: attemptIdRef.current,
      result_access_token: resultAccessTokenRef.current,
      nom,
      prenom,
      answers: Object.entries(answers).map(([questionId, choiceId]) => ({
        question_id: Number(questionId),
        choice_id: Number(choiceId)
      }))
    };

    try {
      const response = await api.post(`/public/quiz/${token}/submit`, payload);
      setProgressiveResult({
        stade_atteint: response.data.stade_atteint,
        stage_scores: response.data.stage_scores
      });
      saveStored({
        submitted: true,
        inProgress: false,
        nom,
        prenom,
        referentiel,
        progressiveResult: {
          stade_atteint: response.data.stade_atteint,
          stage_scores: response.data.stage_scores
        }
      });
      setStep('result');
    } catch (err) {
      if (err?.response?.status === 409 && await recoverStoredSubmission(loadStored())) return;
      setError(getApiError(err));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  function buildPayload(auto = false) {
    const currentAnswers = auto ? answersRef.current : answers;
    return {
      attempt_id: attemptIdRef.current,
      result_access_token: resultAccessTokenRef.current,
      nom,
      prenom,
      referentiel,
      auto_submit: auto,
      answers: Object.entries(currentAnswers).map(([questionId, value]) => (
        Array.isArray(value)
          ? { question_id: Number(questionId), choice_ids: value.map(Number) }
          : { question_id: Number(questionId), choice_id: Number(value) }
      ))
    };
  }

  async function submitAnswers({ auto = false } = {}) {
    if (submittingRef.current || result || !quiz) return;

    if (!auto) {
      const answeredCount = Object.keys(answers).length;
      const totalQuestions = quiz.questions.length;
      if (answeredCount !== totalQuestions) {
        setError(`Veuillez répondre à toutes les questions. (${answeredCount}/${totalQuestions} répondues)`);
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');
    setAutoSubmitError('');

    if (auto) setAutoSubmitting(true);

    try {
      const response = await api.post(`/public/quiz/${token}/submit`, buildPayload(auto));
      setResult(response.data.submission);
      setStep('result');
      saveStored({
        submitted: true,
        inProgress: false,
        nom,
        prenom,
        referentiel,
        result: response.data.submission
      });
    } catch (err) {
      if (err?.response?.status === 409 && await recoverStoredSubmission(loadStored())) return;
      const message = getApiError(err);
      if (auto) setAutoSubmitError(message);
      else setError(message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
      setAutoSubmitting(false);
    }
  }

  function updateAnswers(nextAnswers) {
    if (timeLeft === 0 || loading || autoSubmitting) return;
    setAnswers(nextAnswers);
  }

  function formatTimeLeftDisplay() {
    if (!quiz?.ends_at) return <div className="timer"><FontAwesomeIcon icon={faClock} /> Pas de limite de temps</div>;
    if (!timeLeft) return null;
    if (timeLeft === 0) return <div className="timer urgent"><FontAwesomeIcon icon={faClock} /> Temps écoulé</div>;

    const { hours, minutes, seconds, total } = timeLeft;
    const isUrgent = total < 5 * 60 * 1000;
    const className = isUrgent ? 'timer urgent' : 'timer';

    let text = '';
    if (hours > 0) text += `${hours}h `;
    if (minutes > 0 || hours > 0) text += `${minutes}m `;
    text += `${seconds}s`;

    return <div className={className}><FontAwesomeIcon icon={faClock} /> Temps restant : {text}</div>;
  }

  // ─── ÉTAPE : Erreur ─────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="page narrow public-quiz-page">
        <ParticipantQuizState
          type="error"
          message={error}
          onRetry={() => {
            restoredRef.current = false;
            setLoadAttempt((attempt) => attempt + 1);
          }}
        />
      </div>
    );
  }

  // ─── ÉTAPE : Chargement ──────────────────────────────────
  if (step === 'loading') {
    return <ParticipantQuizState type="loading" />;
  }

  // ─── ÉTAPE : Résultat ────────────────────────────────────
  if (step === 'result' && progressiveResult) {
    return (
      <ParticipantQuizResult
        title="Diagnostic terminé"
        announcement="Votre diagnostic est terminé et vos réponses ont été enregistrées."
        actions={(
          <Link className="secondary-btn" to={`/mes-notes#access=${encodeURIComponent(resultAccessTokenRef.current)}`}>
            <FontAwesomeIcon icon={faClipboardList} /> Consulter ce résultat
          </Link>
        )}
      >
        {terminationReason && <div className="alert error">{terminationReason}</div>}
        <p>Merci <strong>{prenom} {nom}</strong>, vos réponses ont été enregistrées.</p>
        <div className="stade-result">
          <small>Stade atteint</small>
          <div className="final-score">
            {quiz?.stages?.find((stage) => Number(stage.stage) === Number(progressiveResult.stade_atteint))?.name || `Stade ${progressiveResult.stade_atteint}`}
          </div>
        </div>
        {progressiveResult.stage_scores && (
          <div className="stage-scores">
            {Object.entries(progressiveResult.stage_scores).map(([stage, score]) => (
              <div className="stage-score-item" key={stage}>
                <span>{quiz?.stages?.find((item) => Number(item.stage) === Number(stage))?.name || `Stade ${stage}`}</span>
                <strong>{score} Oui</strong>
              </div>
            ))}
          </div>
        )}
      </ParticipantQuizResult>
    );
  }

  if (step === 'result' && result) {
    return (
      <ParticipantQuizResult
        title={terminationReason ? 'Test terminé' : 'Réponses envoyées'}
        announcement="Vos réponses ont été envoyées et votre résultat est disponible."
        actions={(
          <Link className="secondary-btn" to={`/mes-notes#access=${encodeURIComponent(resultAccessTokenRef.current)}`}>
            <FontAwesomeIcon icon={faClipboardList} /> Consulter ce résultat
          </Link>
        )}
      >
        {terminationReason && <div className="alert error">{terminationReason}</div>}
        <p>Merci <strong>{prenom} {nom}</strong>, votre note a été enregistrée.</p>
        <div className="final-score">{result.note_sur_20}/20</div>
        <p className="muted">Score : {result.score}/{result.total_points} · {result.percentage}%</p>
      </ParticipantQuizResult>
    );
  }

  // ─── ÉTAPE : Formulaire d'identification + info quiz ─────
  if (step === 'info') {
    return (
      <div className="page narrow public-quiz-page">
        <div className="panel center public-hero">
          <div className="big-icon"><FontAwesomeIcon icon={faBookOpen} /></div>
          <h1>{quizInfo.title}</h1>
          {quizInfo.description && <p className="quiz-description">{quizInfo.description}</p>}

          <div className="quiz-meta-grid">
            {quizInfo.type === 'progressive' ? (
              <div className="quiz-meta-item">
                <FontAwesomeIcon icon={faLayerGroup} />
                <div>
                  <small>Accès</small>
                  <strong>Public et immédiat</strong>
                </div>
              </div>
            ) : (
              <>
                <div className="quiz-meta-item">
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <small>Ouverture</small>
                    <strong>{formatDateTime(quizInfo.starts_at)}</strong>
                  </div>
                </div>
                {quizInfo.ends_at && (
                  <div className="quiz-meta-item">
                    <FontAwesomeIcon icon={faClock} />
                    <div>
                      <small>Fermeture</small>
                      <strong>{formatDateTime(quizInfo.ends_at)}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="quiz-meta-item">
              <FontAwesomeIcon icon={faCircleQuestion} />
              <div>
                <small>Questions</small>
                <strong>{quizInfo.questions_count}</strong>
              </div>
            </div>
          </div>

          {quizInfo.is_closed && (
            <div className="public-status closed">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>Ce QCM est fermé.</span>
            </div>
          )}

          {quizInfo.is_locked && (
            <div className="public-status locked">
              <FontAwesomeIcon icon={faLock} />
              <span>Ouvre dans {countdownTo(quizInfo.starts_at)}</span>
            </div>
          )}
        </div>

        {quizInfo.is_open && (
          <form className="panel form-grid public-form" onSubmit={handleStart}>
            <h2 className="span-2"><FontAwesomeIcon icon={faUser} /> Identification</h2>
            <p className="span-2 muted">Renseignez vos informations pour accéder au QCM.</p>

            {quizInfo.type !== 'progressive' && (
              <div className="span-2"><AntiCheatRules /></div>
            )}

            {error && <div className="alert error span-2">{error}</div>}

            <label>
              Nom *
              <input 
                value={nom} 
                onChange={(e) => setNom(e.target.value)} 
                placeholder="Votre nom" 
                required 
              />
            </label>

            <label>
              Prénom *
              <input 
                value={prenom} 
                onChange={(e) => setPrenom(e.target.value)} 
                placeholder="Votre prénom" 
                required 
              />
            </label>

            {quizInfo.type !== 'progressive' && (
              <label className="span-2">
                Référentiel *
                <input
                  value={referentiel}
                  onChange={(e) => setReferentiel(e.target.value)}
                  placeholder="Votre référentiel (ex: Développement Web, Réseaux...)"
                  required
                />
              </label>
            )}

            <p className="span-2 muted collection-notice">
              Votre identité, vos réponses et votre résultat seront accessibles à l’organisateur de cette évaluation. Un code secret temporaire vous permettra de rouvrir le résultat pendant 30 jours. <Link to="/confidentialite#informations-par-public">Comment vos données sont utilisées</Link>.
            </p>

            <button className="primary-btn span-2" disabled={loading}>
              <FontAwesomeIcon icon={faCircleQuestion} /> {loading ? 'Chargement...' : 'Accéder au QCM'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ─── ÉTAPE : Quiz en cours ───────────────────────────────
  if (step === 'quiz' && quiz) {
    if (!quiz.questions?.length) {
      return (
        <div className="page narrow public-quiz-page">
          <ParticipantQuizState type="empty" message="Cette évaluation ne contient pas encore de question." />
        </div>
      );
    }

    return (
      <div className="page narrow public-quiz-page no-select participant-quiz-page">
        <div className="page-header participant-quiz-header">
          <div>
            <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Test en cours</span>
            <h1>{quiz.title}</h1>
            <p>{quiz.description}</p>
            <p className="muted">Participant : {prenom} {nom} · {referentiel}</p>
            <div className="alert warning anticheat-notice">
              <FontAwesomeIcon icon={faTriangleExclamation} /> Anti-triche actif : quitter la page, copier ou capturer l'écran mettra fin au test.
            </div>
          </div>
        </div>

        <ParticipantQuizFlow
          questions={quiz.questions}
          answers={answers}
          onAnswersChange={updateAnswers}
          onSubmit={() => submitAnswers({ auto: false })}
          disabled={timeLeft === 0}
          submitting={loading && !autoSubmitting}
          autoSubmitting={autoSubmitting}
          error={error}
          warning={warning}
          autoSubmitError={autoSubmitError}
          onRetryAutoSubmit={() => submitAnswers({ auto: true })}
          timer={formatTimeLeftDisplay()}
        />
      </div>
    );
  }

  // ─── ÉTAPE : Diagnostic progressif (par stade) ──────────
  if (step === 'progressive' && quiz) {
    const stages = quiz.stages || [];
    const stage = stages[currentStage];
    const isLastStage = currentStage >= stages.length - 1;
    const requiresStagePass = quiz.require_stage_pass !== false;

    if (!stage?.questions?.length) {
      return (
        <div className="page narrow public-quiz-page">
          <ParticipantQuizState type="empty" message="Ce stade ne contient pas encore de question." />
        </div>
      );
    }

    return (
      <div className="page narrow public-quiz-page no-select">
        <div className="page-header">
          <div>
            <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Diagnostic en cours</span>
            <h1>{quiz.title}</h1>
            <p className="muted">Participant : {prenom} {nom}</p>
          </div>
        </div>

        <div className="stage-progress">
          {stages.map((_, i) => (
            <div
              key={i}
              className={`stage-dot ${i === currentStage ? 'active' : ''} ${i < currentStage ? 'done' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="stage-banner">
          <FontAwesomeIcon icon={faLayerGroup} /> {stage.name || `Stade ${stage.stage}`} · {stage.questions.length} question(s)
        </div>

        {!requiresStagePass && (
          <div className="alert info">
            Le blocage par seuil est désactivé : vous pourrez continuer au stade suivant même si le seuil de « Oui » est atteint.
          </div>
        )}

        <ParticipantQuizFlow
          key={`stage-${stage.stage}-${currentStage}`}
          questions={stage.questions}
          answers={answers}
          onAnswersChange={updateAnswers}
          onSubmit={handleNextStage}
          submitting={loading}
          error={error}
          warning={warning}
          reviewLabel="Relire ce stade"
          submitLabel={isLastStage
            ? 'Terminer le diagnostic'
            : (requiresStagePass ? 'Vérifier ce stade' : 'Passer au stade suivant')}
        />
      </div>
    );
  }

  return null;
}
