import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CorrectionView from '../../components/CorrectionView.jsx';
import ParticipantQuizFlow from './ParticipantQuizFlow.jsx';
import ParticipantQuizResult from './ParticipantQuizResult.jsx';
import ParticipantQuizState from './ParticipantQuizState.jsx';
import {
  answerLabels,
  captureQuizOrder,
  countAnswered,
  firstUnansweredIndex,
  isAnswered,
  restoreQuizOrder,
  sanitizeAnswers,
  toggleAnswer,
} from './quizEngine.js';

const QUESTIONS = [
  {
    id: 0,
    body: 'Question simple',
    multiple: false,
    choices: [{ id: 0, body: 'Alpha' }, { id: 1, body: 'Bêta' }],
  },
  {
    id: 2,
    body: 'Question multiple',
    multiple: true,
    choices: [{ id: 20, body: 'Deux' }, { id: 30, body: 'Trois' }],
  },
];

function ControlledFlow({ initialAnswers = {}, onSubmit = () => {}, ...props }) {
  const [answers, setAnswers] = useState(initialAnswers);
  return (
    <ParticipantQuizFlow
      questions={QUESTIONS}
      answers={answers}
      onAnswersChange={setAnswers}
      onSubmit={onSubmit}
      {...props}
    />
  );
}

describe('quizEngine', () => {
  it('distingue les réponses vides et accepte l’identifiant zéro', () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered(null)).toBe(false);
    expect(isAnswered([])).toBe(false);
    expect(isAnswered(0)).toBe(true);
    expect(countAnswered(QUESTIONS, { 0: 0, 2: [] })).toBe(1);
    expect(firstUnansweredIndex(QUESTIONS, { 0: 0 })).toBe(1);
  });

  it('remplace une réponse simple et ajoute ou retire les réponses multiples', () => {
    expect(toggleAnswer({ 0: 0 }, 0, 1, false)).toEqual({ 0: 1 });
    expect(toggleAnswer({}, 2, 20, true)).toEqual({ 2: [20] });
    expect(toggleAnswer({ 2: [20, 30] }, 2, 20, true)).toEqual({ 2: [30] });
    expect(answerLabels(QUESTIONS[1], [20, 30])).toEqual(['Deux', 'Trois']);
  });

  it('restaure un ordre de questions et de choix sauvegardé par identifiants', () => {
    const reversed = {
      questions: [
        { ...QUESTIONS[1], choices: [...QUESTIONS[1].choices].reverse() },
        { ...QUESTIONS[0], choices: [...QUESTIONS[0].choices].reverse() },
      ],
    };
    const order = captureQuizOrder({ questions: QUESTIONS });
    const restored = restoreQuizOrder(reversed, order);
    expect(restored.questions.map((question) => question.id)).toEqual([0, 2]);
    expect(restored.questions[0].choices.map((choice) => choice.id)).toEqual([0, 1]);
  });

  it('ignore les anciennes questions et les choix devenus invalides à la reprise', () => {
    expect(sanitizeAnswers(QUESTIONS, {
      0: 99,
      2: [20, 999],
      404: 1,
    })).toEqual({ 2: [20] });
  });
});
describe('ParticipantQuizFlow', () => {
  it('n’affiche qu’une question, navigue et conserve les réponses simples et multiples', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ControlledFlow onSubmit={onSubmit} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Question 1 sur 2');
    expect(screen.getByRole('heading', { name: 'Question simple' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Question multiple' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: /suivant/i }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Question 2 sur 2');
    expect(screen.getByRole('heading', { name: 'Question multiple' })).toHaveFocus();

    await user.click(screen.getByRole('checkbox', { name: 'Deux' }));
    await user.click(screen.getByRole('checkbox', { name: 'Trois' }));
    await user.click(screen.getByRole('button', { name: /relire mes réponses/i }));

    expect(screen.getByRole('heading', { name: 'Vérifiez vos réponses' })).toHaveFocus();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Deux, Trois')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Modifier' })[0]);
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: /suivant/i }));
    await user.click(screen.getByRole('button', { name: /relire mes réponses/i }));
    await user.click(screen.getByRole('button', { name: /envoyer mes réponses/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('reprend à la première question sans réponse et ouvre la revue si tout est rempli', () => {
    const { unmount } = render(<ControlledFlow initialAnswers={{ 0: 1 }} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Question 2 sur 2');
    unmount();

    render(<ControlledFlow initialAnswers={{ 0: 0, 2: [20] }} />);
    expect(screen.getByRole('heading', { name: 'Vérifiez vos réponses' })).toBeInTheDocument();
  });

  it('permet la navigation native au clavier et conserve le focus à chaque étape', async () => {
    const user = userEvent.setup();
    render(<ControlledFlow />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Question simple' })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveFocus();
    await user.keyboard('[Space]');
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    await user.keyboard('[ArrowRight]');
    expect(screen.getByRole('radio', { name: 'Bêta' })).toBeChecked();
  });

  it('expose les états submitting et auto-submit error sans déverrouiller les réponses', () => {
    const retry = vi.fn();
    const { container } = render(
      <ControlledFlow
        submitting
        disabled
        autoSubmitError="Réseau indisponible"
        onRetryAutoSubmit={retry}
      />,
    );
    expect(container.querySelector('.participant-quiz-flow')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Réseau indisponible');
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeDisabled();
  });

  it('neutralise les transitions lorsque la préférence de réduction est active', () => {
    const { container } = render(<ControlledFlow reducedMotionOverride />);
    expect(container.querySelector('.participant-quiz-flow')).toHaveAttribute('data-reduced-motion', 'true');
    expect(container.querySelector('.participant-question-step')).not.toHaveStyle({ transform: 'translateX(16px)' });
  });
});

describe('états et résultat accessibles', () => {
  it('rend les états loading, empty et error avec les rôles attendus', async () => {
    const retry = vi.fn();
    const { rerender } = render(<ParticipantQuizState type="loading" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');

    rerender(<ParticipantQuizState type="empty" message="Aucune question" />);
    expect(screen.getByRole('status')).toHaveTextContent('Aucune question');

    rerender(<ParticipantQuizState type="error" message="Échec" onRetry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Échec');
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('focalise et annonce le succès puis gère la correction avec Échap et retour de focus', async () => {
    const correction = {
      questions: [{
        id: 1,
        body: 'Question corrigée',
        is_correct: true,
        explanation: 'Parce que.',
        choices: [{ id: 1, body: 'Bonne réponse', is_correct: true, chosen: true }],
      }],
    };
    render(
      <ParticipantQuizResult
        title="Réponses envoyées"
        announcement="Succès confirmé"
        correction={<CorrectionView correction={correction} />}
      >
        <p>Score final</p>
      </ParticipantQuizResult>,
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Réponses envoyées' })).toHaveFocus());
    expect(screen.getByRole('status')).toHaveTextContent('Succès confirmé');

    const trigger = screen.getByRole('button', { name: /afficher la correction/i });
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Correction détaillée' })).toHaveFocus());
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Réponse correcte')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('heading', { name: 'Correction détaillée' }), { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
