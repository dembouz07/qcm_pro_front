import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({ get: vi.fn() }));
const draftApiMocks = vi.hoisted(() => ({
  createAssessmentDraft: vi.fn(),
  findAssessmentDraft: vi.fn(),
  publishAssessmentDraft: vi.fn(),
  readDraftConflict: vi.fn(() => null),
  updateAssessmentDraft: vi.fn(),
}));

vi.mock('../../api.js', () => ({
  default: apiMocks,
  getApiError: (error) => error?.message || 'Erreur API',
}));

vi.mock('./assessmentBuilderApi.js', () => draftApiMocks);

import AssessmentBuilderPage from './AssessmentBuilderPage.jsx';

function renderBuilderPage({ path, route, type, mode }) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={<AssessmentBuilderPage type={type} mode={mode} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AssessmentBuilderPage', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    Object.values(draftApiMocks).forEach((mock) => mock.mockReset?.());
    draftApiMocks.findAssessmentDraft.mockResolvedValue(null);
    draftApiMocks.readDraftConflict.mockReturnValue(null);
  });

  it('charge une édition standard historique et conserve sa question multiple dans l’aperçu partagé', async () => {
    const user = userEvent.setup();
    apiMocks.get.mockImplementation(async (url) => {
      if (url === '/admin/classes') return { data: [{ id: 7, name: 'Cohorte historique' }] };
      if (url === '/admin/quizzes/42') {
        return {
          data: {
            id: 42,
            type: 'standard',
            title: 'QCM historique',
            school_class_id: 7,
            starts_at: '2026-09-01T08:30:00Z',
            questions: [{
              id: 100,
              body: 'Deux réponses historiques',
              points: 2,
              choices: [
                { id: 1001, body: 'Historique A', is_correct: true },
                { id: 1002, body: 'Historique B', is_correct: true },
                { id: 1003, body: 'Historique C', is_correct: false },
              ],
            }],
          },
        };
      }
      throw new Error(`GET inattendu ${url}`);
    });

    renderBuilderPage({
      path: '/admin/quizzes/42/edit',
      route: '/admin/quizzes/:id/edit',
      type: 'standard',
      mode: 'edit',
    });

    expect(await screen.findByLabelText(/titre de l’évaluation/i)).toHaveValue('QCM historique');
    expect(screen.getByLabelText(/type de question/i)).toHaveValue('multiple');
    await user.click(screen.getAllByRole('button', { name: /aperçu participant/i })[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Deux réponses historiques' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(3);
  });

  it('charge une édition progressive et préserve seuil, règle et stades historiques', async () => {
    apiMocks.get.mockResolvedValue({
      data: {
        id: 51,
        type: 'progressive',
        title: 'Diagnostic historique',
        stage_threshold: 2,
        require_stage_pass: false,
        questions: [
          { id: 501, stage: 1, stage_name: 'Découverte', body: 'Question découverte une' },
          { id: 502, stage: 1, stage_name: 'Découverte', body: 'Question découverte deux' },
          { id: 503, stage: 2, stage_name: 'Maîtrise', body: 'Question maîtrise' },
        ],
      },
    });

    renderBuilderPage({
      path: '/admin/quizzes/51/progressive/edit',
      route: '/admin/quizzes/:id/progressive/edit',
      type: 'progressive',
      mode: 'edit',
    });

    expect(await screen.findByLabelText(/titre de l’évaluation/i)).toHaveValue('Diagnostic historique');
    expect(screen.getByLabelText(/seuil de « oui » par stade/i)).toHaveValue(2);
    expect(screen.getByRole('checkbox', { name: /blocage par seuil/i })).not.toBeChecked();
    expect(screen.getByRole('button', { name: /^Stade 1Découverte$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Stade 2Maîtrise$/i })).toBeInTheDocument();
  });

  it('initialise aussi la création progressive dans le builder partagé', async () => {
    renderBuilderPage({
      path: '/admin/quizzes/progressive',
      route: '/admin/quizzes/progressive',
      type: 'progressive',
      mode: 'create',
    });

    expect(await screen.findByLabelText(/titre de l’évaluation/i)).toHaveValue('');
    expect(screen.getByLabelText(/seuil de « oui » par stade/i)).toHaveValue(1);
    expect(screen.getByRole('button', { name: /^Stade 1Stade 1$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Stade 2Stade 2$/i })).toBeInTheDocument();
    expect(draftApiMocks.findAssessmentDraft).toHaveBeenCalledWith({ mode: 'progressive', quizId: null });
  });

  it('annonce le chargement tant que l’évaluation historique n’est pas disponible', () => {
    apiMocks.get.mockReturnValue(new Promise(() => {}));

    renderBuilderPage({
      path: '/admin/quizzes/51/progressive/edit',
      route: '/admin/quizzes/:id/progressive/edit',
      type: 'progressive',
      mode: 'edit',
    });

    const loading = screen.getByRole('status');
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveTextContent(/chargement du builder/i);
  });

  it('affiche un état vide lorsque l’évaluation demandée n’existe plus', async () => {
    apiMocks.get.mockResolvedValue({ data: null });

    renderBuilderPage({
      path: '/admin/quizzes/404/progressive/edit',
      route: '/admin/quizzes/:id/progressive/edit',
      type: 'progressive',
      mode: 'edit',
    });

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/cette évaluation est introuvable/i));
  });

  it('affiche l’erreur API puis recharge le builder avec l’action Réessayer', async () => {
    const user = userEvent.setup();
    apiMocks.get
      .mockRejectedValueOnce(new Error('Service des évaluations indisponible'))
      .mockResolvedValueOnce({
        data: {
          id: 51,
          type: 'progressive',
          title: 'Diagnostic rechargé',
          stage_threshold: 1,
          require_stage_pass: true,
          questions: [{ id: 501, stage: 1, stage_name: 'Initial', body: 'Question reprise' }],
        },
      });

    renderBuilderPage({
      path: '/admin/quizzes/51/progressive/edit',
      route: '/admin/quizzes/:id/progressive/edit',
      type: 'progressive',
      mode: 'edit',
    });

    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent(/service des évaluations indisponible/i);
    await user.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(await screen.findByLabelText(/titre de l’évaluation/i)).toHaveValue('Diagnostic rechargé');
    expect(apiMocks.get).toHaveBeenCalledTimes(2);
  });
});
