import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../api.js', () => ({
  default: apiMocks,
  getApiError: (error) => error?.message || 'Erreur réseau',
}));

vi.mock('../useAntiCheat.js', () => ({
  useAntiCheat: vi.fn(),
}));

import TakeQuiz from './TakeQuiz.jsx';

const QUIZ = {
  id: 42,
  title: 'Évaluation test',
  description: 'Deux formats de réponse',
  ends_at: null,
  questions: [
    {
      id: 1,
      body: 'Choisissez une réponse',
      multiple: false,
      choices: [{ id: 11, body: 'Simple A' }, { id: 12, body: 'Simple B' }],
    },
    {
      id: 2,
      body: 'Choisissez plusieurs réponses',
      multiple: true,
      choices: [{ id: 21, body: 'Multiple A' }, { id: 22, body: 'Multiple B' }],
    },
  ],
};

const SUBMISSION = {
  note_sur_20: 20,
  score: 3,
  total_points: 3,
  percentage: 100,
};

function renderTakeQuiz() {
  return render(
    <MemoryRouter initialEntries={['/student/quizzes/42']}>
      <Routes>
        <Route path="/student/quizzes/:id" element={<TakeQuiz />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('adaptateur QCM connecté', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.post.mockReset();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  it('affiche loading, error avec relance, puis empty sans soumission', async () => {
    let rejectRequest;
    apiMocks.get.mockReturnValueOnce(new Promise((_, reject) => { rejectRequest = reject; }));
    renderTakeQuiz();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du QCM');

    rejectRequest(new Error('Chargement impossible'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Chargement impossible');

    apiMocks.get.mockResolvedValueOnce({ data: { ...QUIZ, questions: [] } });
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));
    expect(await screen.findByText('Cette évaluation ne contient pas encore de question.')).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('reprend les réponses sauvegardées sur la première question incomplète', async () => {
    localStorage.setItem('qcm_progress_42', JSON.stringify({
      answers: { 1: 11 },
      order: {
        questionIds: [1, 2],
        choiceIdsByQuestion: { 1: [11, 12], 2: [21, 22] },
      },
    }));
    apiMocks.get.mockResolvedValue({ data: QUIZ });
    renderTakeQuiz();

    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Question 2 sur 2');
    expect(screen.getByRole('heading', { name: 'Choisissez plusieurs réponses' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('qcm_progress_42')).answers).toEqual({ 1: 11 });
  });

  it('soumet séparément choice_id et choice_ids depuis la revue, puis focalise le résultat et la correction', async () => {
    const user = userEvent.setup();
    apiMocks.get.mockResolvedValue({ data: QUIZ });
    apiMocks.post.mockResolvedValue({
      data: {
        submission: SUBMISSION,
        show_corrections: true,
        correction: {
          questions: [{
            id: 1,
            body: 'Choisissez une réponse',
            is_correct: true,
            choices: [{ id: 11, body: 'Simple A', is_correct: true, chosen: true }],
          }],
        },
      },
    });
    renderTakeQuiz();

    await user.click(await screen.findByRole('button', { name: /commencer le test/i }));
    await user.click(screen.getByRole('radio', { name: 'Simple A' }));
    await user.click(screen.getByRole('button', { name: /suivant/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Multiple A' }));
    await user.click(screen.getByRole('checkbox', { name: 'Multiple B' }));
    await user.click(screen.getByRole('button', { name: /relire mes réponses/i }));
    expect(screen.getByRole('heading', { name: 'Vérifiez vos réponses' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: /envoyer mes réponses/i }));

    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(1));
    expect(apiMocks.post).toHaveBeenCalledWith('/student/quizzes/42/submit', {
      auto_submit: false,
      answers: [
        { question_id: 1, choice_id: 11 },
        { question_id: 2, choice_ids: [21, 22] },
      ],
    });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Réponses envoyées' })).toHaveFocus());
    expect(localStorage.getItem('qcm_progress_42')).toBeNull();

    await user.click(screen.getByRole('button', { name: /afficher la correction détaillée/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Correction détaillée' })).toHaveFocus());
  });

  it('auto-soumet à l’échéance, expose l’erreur dédiée puis relance le même payload', async () => {
    const expiredQuiz = { ...QUIZ, ends_at: new Date(Date.now() - 1_000).toISOString() };
    apiMocks.get.mockResolvedValue({ data: expiredQuiz });
    apiMocks.post
      .mockRejectedValueOnce(new Error('Connexion interrompue'))
      .mockResolvedValueOnce({ data: { submission: SUBMISSION } });
    renderTakeQuiz();

    const retry = await screen.findByRole('button', { name: /réessayer l’envoi automatique/i });
    expect(screen.getByRole('alert')).toHaveTextContent('Connexion interrompue');
    expect(apiMocks.post.mock.calls[0][1]).toEqual({ auto_submit: true, answers: [] });

    await userEvent.click(retry);
    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(2));
    expect(apiMocks.post.mock.calls[1][1]).toEqual({ auto_submit: true, answers: [] });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Réponses envoyées' })).toHaveFocus());
  });
});
