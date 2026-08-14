import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const draftApiMocks = vi.hoisted(() => ({
  createAssessmentDraft: vi.fn(),
  getAssessmentDraft: vi.fn(),
  parseAssessmentImport: vi.fn(),
  publishAssessmentDraft: vi.fn(),
}));

vi.mock('../api.js', () => ({
  getApiError: (error) => error?.message || 'Erreur API',
}));

vi.mock('../features/assessmentBuilder/assessmentBuilderApi.js', () => draftApiMocks);

vi.mock('../features/assessmentBuilder/AssessmentBuilderPage.jsx', () => ({
  default: ({ source, initialDocument, initialDraft }) => (
    <output data-testid="builder-seed">
      {JSON.stringify({ source, initialDocument, initialDraft })}
    </output>
  ),
}));

import ImportQuiz from './ImportQuiz.jsx';
import SmartCreateQuiz from './SmartCreateQuiz.jsx';

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>;
}

function renderSource(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<>{element}<LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('sources du builder', () => {
  beforeEach(() => {
    Object.values(draftApiMocks).forEach((mock) => mock.mockReset());
  });

  it('analyse un import via l’endpoint parse-only puis ouvre un brouillon sans publier', async () => {
    const user = userEvent.setup();
    draftApiMocks.parseAssessmentImport.mockResolvedValue({
      schema_version: 1,
      data: {
        title: 'Import contrôlé',
        questions: [{
          body: 'Question importée',
          points: 1,
          choices: [
            { body: 'Oui', is_correct: true },
            { body: 'Non', is_correct: false },
          ],
        }],
      },
    });
    const savedDraft = {
      id: 71,
      mode: 'standard',
      quiz_id: null,
      revision: 1,
      payload: {
        title: 'Import contrôlé',
        questions: [{
          body: 'Question importée',
          points: 1,
          choices: [
            { body: 'Oui', is_correct: true },
            { body: 'Non', is_correct: false },
          ],
        }],
      },
    };
    draftApiMocks.createAssessmentDraft.mockResolvedValue(savedDraft);
    draftApiMocks.getAssessmentDraft.mockResolvedValue(savedDraft);
    renderSource('/admin/quizzes/import', <ImportQuiz />);

    const file = new File(['question,choice,is_correct'], 'evaluation.csv', { type: 'text/csv' });
    await user.upload(screen.getByLabelText(/choisir un fichier csv/i), file);
    await user.click(screen.getByRole('button', { name: /analyser et ouvrir le builder/i }));

    await waitFor(() => expect(draftApiMocks.parseAssessmentImport).toHaveBeenCalledWith(file));
    expect(draftApiMocks.createAssessmentDraft).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Import contrôlé', source: 'import', is_published: false }),
      null,
    );
    expect(draftApiMocks.publishAssessmentDraft).not.toHaveBeenCalled();
    const builderSeed = await screen.findByTestId('builder-seed');
    expect(JSON.parse(builderSeed.textContent)).toMatchObject({
      source: 'import',
      initialDraft: { id: 71, quiz_id: null },
      initialDocument: { title: 'Import contrôlé', source: 'draft', is_published: false },
    });
    expect(screen.getByTestId('location')).toHaveTextContent('?draft=71');
  });

  it('transforme le texte collé en brouillon et rejoint le même builder partagé', async () => {
    const user = userEvent.setup();
    const savedDraft = {
      id: 72,
      mode: 'standard',
      quiz_id: null,
      revision: 1,
      payload: {
        title: '',
        questions: [{
          body: 'Capitale du Sénégal ?',
          points: 1,
          choices: [
            { body: 'Dakar', is_correct: true },
            { body: 'Paris', is_correct: false },
          ],
        }],
      },
    };
    draftApiMocks.createAssessmentDraft.mockResolvedValue(savedDraft);
    draftApiMocks.getAssessmentDraft.mockResolvedValue(savedDraft);
    renderSource('/admin/quizzes/smart', <SmartCreateQuiz />);

    await user.type(screen.getByLabelText(/collez votre qcm ici/i), `1. Capitale du Sénégal ?
A) Dakar
B) Paris
Réponse : A`);
    await user.click(screen.getByRole('button', { name: /analyser et ouvrir le builder/i }));

    await waitFor(() => expect(draftApiMocks.createAssessmentDraft).toHaveBeenCalledTimes(1));
    const [document, quizId] = draftApiMocks.createAssessmentDraft.mock.calls[0];
    expect(quizId).toBeNull();
    expect(document).toMatchObject({ type: 'standard', source: 'paste' });
    expect(document.questions[0]).toMatchObject({ body: 'Capitale du Sénégal ?' });
    expect(screen.getByTestId('builder-seed')).toHaveTextContent('"source":"paste"');
    expect(screen.getByTestId('location')).toHaveTextContent('?draft=72');
    expect(draftApiMocks.parseAssessmentImport).not.toHaveBeenCalled();
    expect(draftApiMocks.publishAssessmentDraft).not.toHaveBeenCalled();
  });
});
