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

import PublicQuiz from './PublicQuiz.jsx';

const INFO = {
  title: 'QCM public',
  description: 'Évaluation ouverte',
  type: 'standard',
  is_open: true,
  is_closed: false,
  is_locked: false,
  starts_at: null,
  ends_at: null,
  questions_count: 2,
};

const STARTED_QUIZ = {
  type: 'standard',
  title: 'QCM public',
  description: 'Évaluation ouverte',
  attempt_id: 'attempt-1',
  result_access_token: 'secret-1',
  ends_at: null,
  questions: [
    { id: 1, body: 'Question publique une', choices: [{ id: 11, body: 'Public A' }, { id: 12, body: 'Public B' }] },
    { id: 2, body: 'Question publique deux', choices: [{ id: 21, body: 'Public C' }, { id: 22, body: 'Public D' }] },
  ],
};

const RESULT = { note_sur_20: 15, score: 3, total_points: 4, percentage: 75 };

function renderPublicQuiz() {
  return render(
    <MemoryRouter initialEntries={['/quiz/token-test']}>
      <Routes>
        <Route path="/quiz/:token" element={<PublicQuiz />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function identifyAndStart(user) {
  await user.type(await screen.findByLabelText(/^Nom/), 'Martin');
  await user.type(screen.getByLabelText(/^Prénom/), 'Lina');
  await user.type(screen.getByLabelText(/^Référentiel/), 'Management');
  await user.click(screen.getByRole('button', { name: /accéder au QCM/i }));
}

describe('adaptateur QCM public', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.post.mockReset();
  });

  it('conserve le contrat choice_id, la revue et le secret dans le fragment résultat', async () => {
    const user = userEvent.setup();
    apiMocks.get.mockResolvedValue({ data: INFO });
    apiMocks.post
      .mockResolvedValueOnce({ data: STARTED_QUIZ })
      .mockResolvedValueOnce({ data: { submission: RESULT } });
    renderPublicQuiz();
    await identifyAndStart(user);

    await user.click(await screen.findByRole('radio', { name: 'Public A' }));
    await user.click(screen.getByRole('button', { name: /suivant/i }));
    await user.click(screen.getByRole('radio', { name: 'Public C' }));
    await user.click(screen.getByRole('button', { name: /relire mes réponses/i }));
    await user.click(screen.getByRole('button', { name: /envoyer mes réponses/i }));

    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(2));
    expect(apiMocks.post.mock.calls[1]).toEqual([
      '/public/quiz/token-test/submit',
      {
        attempt_id: 'attempt-1',
        result_access_token: 'secret-1',
        nom: 'Martin',
        prenom: 'Lina',
        referentiel: 'Management',
        auto_submit: false,
        answers: [
          { question_id: 1, choice_id: 11 },
          { question_id: 2, choice_id: 21 },
        ],
      },
    ]);
    expect(JSON.stringify(apiMocks.post.mock.calls[1][1])).not.toContain('choice_ids');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Réponses envoyées' })).toHaveFocus());
    expect(screen.getByRole('link', { name: /consulter ce résultat/i })).toHaveAttribute('href', '/mes-notes#access=secret-1');
  });

  it('sérialise une réponse multiple avec choice_ids tout en gardant les réponses simples en choice_id', async () => {
    const user = userEvent.setup();
    apiMocks.get.mockResolvedValue({ data: INFO });
    apiMocks.post
      .mockResolvedValueOnce({
        data: {
          ...STARTED_QUIZ,
          questions: [
            { ...STARTED_QUIZ.questions[0], multiple: false },
            { ...STARTED_QUIZ.questions[1], multiple: true },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { submission: RESULT } });
    renderPublicQuiz();
    await identifyAndStart(user);

    await user.click(await screen.findByRole('radio', { name: 'Public A' }));
    await user.click(screen.getByRole('button', { name: /suivant/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Public C' }));
    await user.click(screen.getByRole('checkbox', { name: 'Public D' }));
    await user.click(screen.getByRole('button', { name: /relire mes réponses/i }));
    await user.click(screen.getByRole('button', { name: /envoyer mes réponses/i }));

    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(2));
    expect(apiMocks.post.mock.calls[1][1].answers).toEqual([
      { question_id: 1, choice_id: 11 },
      { question_id: 2, choice_ids: [21, 22] },
    ]);
  });

  it('reprend les réponses et conserve un ancien secret si /start renvoie null', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('qcm_public_token-test', JSON.stringify({
      nom: 'Martin',
      prenom: 'Lina',
      referentiel: 'Management',
      answers: { 1: 11 },
      attemptId: 'attempt-old',
      resultAccessToken: 'secret-old',
      inProgress: true,
      expiresAt: Date.now() + 60_000,
    }));
    apiMocks.get.mockResolvedValue({ data: INFO });
    apiMocks.post
      .mockRejectedValueOnce(new Error('Aucun résultat soumis'))
      .mockResolvedValueOnce({ data: { ...STARTED_QUIZ, attempt_id: 'attempt-old', result_access_token: null } })
      .mockResolvedValueOnce({ data: { submission: RESULT } });
    renderPublicQuiz();

    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Question 2 sur 2');
    expect(apiMocks.post.mock.calls[1][1].attempt_id).toBe('attempt-old');
    await user.click(screen.getByRole('radio', { name: 'Public C' }));
    await user.click(screen.getByRole('button', { name: /relire mes réponses/i }));
    await user.click(screen.getByRole('button', { name: /envoyer mes réponses/i }));
    await waitFor(() => expect(screen.getByRole('link', { name: /consulter ce résultat/i })).toHaveAttribute('href', '/mes-notes#access=secret-old'));
  });

  it('auto-soumet une seule fois avec les dernières réponses à l’échéance', async () => {
    const user = userEvent.setup();
    apiMocks.get.mockResolvedValue({ data: INFO });
    apiMocks.post
      .mockResolvedValueOnce({
        data: { ...STARTED_QUIZ, ends_at: new Date(Date.now() - 1_000).toISOString() },
      })
      .mockResolvedValueOnce({ data: { submission: RESULT } });
    renderPublicQuiz();
    await identifyAndStart(user);

    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(2));
    expect(apiMocks.post.mock.calls[1][1]).toMatchObject({
      auto_submit: true,
      answers: [],
      attempt_id: 'attempt-1',
      result_access_token: 'secret-1',
    });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Réponses envoyées' })).toHaveFocus());
  });

  it('présente le diagnostic progressif question par question sans modifier les règles de stade', async () => {
    const user = userEvent.setup();
    apiMocks.get.mockResolvedValue({ data: { ...INFO, type: 'progressive' } });
    apiMocks.post
      .mockResolvedValueOnce({
        data: {
          type: 'progressive',
          title: 'Diagnostic progressif',
          attempt_id: 'progressive-attempt',
          result_access_token: 'progressive-secret',
          stage_threshold: 5,
          require_stage_pass: true,
          stages: [
            {
              stage: 1,
              name: 'Stade découverte',
              questions: [{
                id: 31,
                body: 'Question du stade un',
                choices: [
                  { id: 311, body: 'Oui stade un', is_oui: true },
                  { id: 312, body: 'Non stade un', is_oui: false },
                ],
              }],
            },
            {
              stage: 2,
              name: 'Stade ancrage',
              questions: [{
                id: 32,
                body: 'Question du stade deux',
                choices: [
                  { id: 321, body: 'Oui stade deux', is_oui: true },
                  { id: 322, body: 'Non stade deux', is_oui: false },
                ],
              }],
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { stade_atteint: 2, stage_scores: { 1: 1, 2: 0 } } });
    renderPublicQuiz();

    await user.type(await screen.findByLabelText(/^Nom/), 'Martin');
    await user.type(screen.getByLabelText(/^Prénom/), 'Lina');
    await user.click(screen.getByRole('button', { name: /accéder au QCM/i }));
    await user.click(await screen.findByRole('radio', { name: 'Oui stade un' }));
    await user.click(screen.getByRole('button', { name: /relire ce stade/i }));
    await user.click(screen.getByRole('button', { name: /vérifier ce stade/i }));

    expect(await screen.findByRole('heading', { name: 'Question du stade deux' })).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('radio', { name: 'Non stade deux' }));
    await user.click(screen.getByRole('button', { name: /relire ce stade/i }));
    await user.click(screen.getByRole('button', { name: /terminer le diagnostic/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Diagnostic terminé' })).toHaveFocus());
    expect(apiMocks.post.mock.calls[1]).toEqual([
      '/public/quiz/token-test/submit',
      {
        attempt_id: 'progressive-attempt',
        result_access_token: 'progressive-secret',
        nom: 'Martin',
        prenom: 'Lina',
        answers: [
          { question_id: 31, choice_id: 311 },
          { question_id: 32, choice_id: 322 },
        ],
      },
    ]);
  });
});
