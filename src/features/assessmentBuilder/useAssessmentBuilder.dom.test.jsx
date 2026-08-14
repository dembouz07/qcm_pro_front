import { useState } from 'react';
import { Link, MemoryRouter, useLocation } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBuilderDocument } from './assessmentBuilderModel.js';

const draftApiMocks = vi.hoisted(() => ({
  createAssessmentDraft: vi.fn(),
  readDraftConflict: vi.fn(() => null),
  updateAssessmentDraft: vi.fn(),
}));

vi.mock('./assessmentBuilderApi.js', () => draftApiMocks);

import useAssessmentBuilder from './useAssessmentBuilder.js';

function HookHarness({ initialDraft = null, quizId = null, sourceQuizVersion = null }) {
  const initialDocument = useState(() => {
    const document = createBuilderDocument();
    document.title = 'Titre initial';
    return document;
  })[0];
  const builder = useAssessmentBuilder({ initialDocument, initialDraft, quizId, sourceQuizVersion });
  const location = useLocation();

  return (
    <>
      <label>
        Titre du brouillon
        <input
          value={builder.document.title}
          onChange={(event) => builder.setDocument((current) => ({ ...current, title: event.target.value }))}
        />
      </label>
      <button type="button" onClick={() => builder.saveDraft().catch(() => {})}>Enregistrer</button>
      <button type="button" onClick={() => builder.duplicateDraft().catch(() => {})}>Dupliquer le brouillon</button>
      <Link to="/destination">Aller à la destination</Link>
      <output data-testid="save-status">{builder.saveStatus}</output>
      <output data-testid="blocker-state">{builder.blocker.state}</output>
      <output data-testid="pathname">{location.pathname}</output>
      {builder.blocker.state === 'blocked' && (
        <div role="alertdialog">
          <button type="button" onClick={builder.blocker.reset}>Rester</button>
          <button type="button" onClick={builder.blocker.proceed}>Quitter</button>
        </div>
      )}
    </>
  );
}

function renderHookHarness(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/builder']}>
      <HookHarness {...props} />
    </MemoryRouter>,
  );
}

describe('useAssessmentBuilder', () => {
  beforeEach(() => {
    draftApiMocks.createAssessmentDraft.mockReset();
    draftApiMocks.updateAssessmentDraft.mockReset();
    draftApiMocks.readDraftConflict.mockReset().mockReturnValue(null);
  });

  it('ne relance pas en boucle une autosauvegarde après une erreur API', async () => {
    const user = userEvent.setup();
    draftApiMocks.createAssessmentDraft.mockRejectedValue(new Error('Réseau indisponible'));
    renderHookHarness();

    await user.clear(screen.getByLabelText('Titre du brouillon'));
    await user.type(screen.getByLabelText('Titre du brouillon'), 'Brouillon modifié');

    await waitFor(() => expect(draftApiMocks.createAssessmentDraft).toHaveBeenCalledTimes(1), { timeout: 2500 });
    expect(screen.getByTestId('save-status')).toHaveTextContent('error');
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 1400)));
    expect(draftApiMocks.createAssessmentDraft).toHaveBeenCalledTimes(1);
  });

  it('détache une duplication de son quiz source et conserve quiz_id null pour les PUT suivants', async () => {
    const user = userEvent.setup();
    const linkedDraft = {
      id: 12,
      mode: 'standard',
      quiz_id: 42,
      revision: 3,
      payload: {},
      updated_at: '2026-08-14T10:00:00Z',
    };
    const duplicatedDraft = {
      ...linkedDraft,
      id: 13,
      quiz_id: null,
      revision: 1,
      updated_at: '2026-08-14T10:01:00Z',
    };
    draftApiMocks.createAssessmentDraft.mockResolvedValue(duplicatedDraft);
    draftApiMocks.updateAssessmentDraft.mockImplementation(async (draft) => ({
      ...draft,
      revision: draft.revision + 1,
      updated_at: '2026-08-14T10:02:00Z',
    }));
    renderHookHarness({ initialDraft: linkedDraft, quizId: 42 });

    await user.click(screen.getByRole('button', { name: 'Dupliquer le brouillon' }));
    await waitFor(() => expect(draftApiMocks.createAssessmentDraft).toHaveBeenCalledTimes(1));
    expect(draftApiMocks.createAssessmentDraft.mock.calls[0][1]).toBeNull();

    await user.type(screen.getByLabelText('Titre du brouillon'), ' version');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(draftApiMocks.updateAssessmentDraft).toHaveBeenCalledTimes(1));
    expect(draftApiMocks.updateAssessmentDraft.mock.calls[0][0]).toMatchObject({ id: 13, quiz_id: null });
    expect(draftApiMocks.updateAssessmentDraft.mock.calls[0][2]).toBeNull();
  });

  it('lie le premier brouillon à la version opaque du quiz chargé', async () => {
    const user = userEvent.setup();
    draftApiMocks.createAssessmentDraft.mockResolvedValue({
      id: 14,
      mode: 'standard',
      quiz_id: 42,
      revision: 1,
      payload: {},
    });
    renderHookHarness({ quizId: 42, sourceQuizVersion: 'sha256-version-chargee' });

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(draftApiMocks.createAssessmentDraft).toHaveBeenCalledTimes(1));
    expect(draftApiMocks.createAssessmentDraft.mock.calls[0][1]).toBe(42);
    expect(draftApiMocks.createAssessmentDraft.mock.calls[0][2]).toBe('sha256-version-chargee');
  });

  it('garde la navigation demandée jusqu’au choix explicite de rester ou quitter', async () => {
    const user = userEvent.setup();
    renderHookHarness();

    await user.type(screen.getByLabelText('Titre du brouillon'), ' modifié');
    await user.click(screen.getByRole('link', { name: 'Aller à la destination' }));

    expect(screen.getByTestId('pathname')).toHaveTextContent('/builder');
    expect(screen.getByTestId('blocker-state')).toHaveTextContent('blocked');
    await user.click(screen.getByRole('button', { name: 'Rester' }));
    expect(screen.getByTestId('blocker-state')).toHaveTextContent('unblocked');

    await user.click(screen.getByRole('link', { name: 'Aller à la destination' }));
    await user.click(screen.getByRole('button', { name: 'Quitter' }));
    expect(screen.getByTestId('pathname')).toHaveTextContent('/destination');
  });
});
