import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AssessmentBuilder from './AssessmentBuilder.jsx';
import {
  createBuilderDocument,
  createChoice,
  createProgressiveQuestion,
  createStage,
  createStandardQuestion,
  validateBuilderDocument,
} from './assessmentBuilderModel.js';

function validDocument() {
  const document = createBuilderDocument();
  Object.assign(document, {
    title: 'Évaluation prévention',
    description: 'Validez les acquis essentiels.',
    school_class_id: '7',
    starts_at: '2026-09-10T09:00',
    show_corrections: true,
    questions: [
      createStandardQuestion({
        body: 'Première question',
        choices: [
          createChoice({ body: 'Réponse exacte', is_correct: true }),
          createChoice({ body: 'Réponse incorrecte', is_correct: false }),
        ],
      }),
      createStandardQuestion({
        body: 'Deuxième question',
        choices: [
          createChoice({ body: 'Choix A', is_correct: true }),
          createChoice({ body: 'Choix B', is_correct: false }),
        ],
      }),
    ],
  });
  return document;
}

function validProgressiveDocument(requireStagePass) {
  const document = createBuilderDocument({ type: 'progressive' });
  Object.assign(document, {
    title: 'Diagnostic progressif',
    stage_threshold: 1,
    require_stage_pass: requireStagePass,
    stages: [
      createStage(0, {
        name: 'Stade initial',
        questions: [createProgressiveQuestion({ body: 'Question du stade initial' })],
      }),
      createStage(1, {
        name: 'Stade avancé',
        questions: [createProgressiveQuestion({ body: 'Question du stade avancé' })],
      }),
    ],
  });
  return document;
}

function BuilderHarness({ initialDocument = validDocument(), onPublished = vi.fn(), ...props }) {
  const [document, setDocument] = useState(initialDocument);
  const [validationErrors, setValidationErrors] = useState([]);

  function publish() {
    const validation = validateBuilderDocument(document);
    setValidationErrors(validation.errors);
    if (validation.valid) onPublished(document);
  }

  return (
    <>
      <AssessmentBuilder
        document={document}
        onDocumentChange={setDocument}
        classes={[{ id: 7, name: 'Cohorte E2E', academic_year: '2026-2027' }]}
        saveStatus="saved"
        lastSavedAt="2026-08-14T20:00:00Z"
        onSaveDraft={vi.fn()}
        onUseRemoteDraft={vi.fn()}
        onDuplicateDraft={vi.fn()}
        onPublish={publish}
        validationErrors={validationErrors}
        {...props}
      />
      <output data-testid="builder-document">{JSON.stringify(document)}</output>
    </>
  );
}

describe('AssessmentBuilder', () => {
  it('place le focus sur la première erreur après une validation échouée', async () => {
    const user = userEvent.setup();
    const empty = createBuilderDocument();
    render(<BuilderHarness initialDocument={empty} />);

    await user.click(screen.getAllByRole('button', { name: /vérifier et publier/i })[0]);

    await waitFor(() => expect(screen.getByLabelText(/titre de l’évaluation/i)).toHaveFocus());
    expect(screen.getByLabelText(/titre de l’évaluation/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('alert').some((alert) => /donnez un titre/i.test(alert.textContent))).toBe(true);
  });

  it('ne vole pas le focus pendant la correction d’un champ après une validation échouée', async () => {
    const user = userEvent.setup();
    render(<BuilderHarness initialDocument={createBuilderDocument()} />);

    await user.click(screen.getAllByRole('button', { name: /vérifier et publier/i })[0]);
    const title = screen.getByLabelText(/titre de l’évaluation/i);
    await waitFor(() => expect(title).toHaveFocus());
    await user.type(title, 'Titre corrigé');

    expect(title).toHaveFocus();
    expect(title).toHaveValue('Titre corrigé');
  });

  it('réordonne, duplique et supprime une question entièrement au clavier', async () => {
    const user = userEvent.setup();
    render(<BuilderHarness />);

    await user.click(screen.getByRole('button', { name: /Deuxième question/i }));
    const moveUp = screen.getByRole('button', { name: /^Monter$/i });
    moveUp.focus();
    await user.keyboard('{Enter}');

    let state = JSON.parse(screen.getByTestId('builder-document').textContent);
    expect(state.questions.map((question) => question.body)).toEqual(['Deuxième question', 'Première question']);
    expect(screen.getByTestId('builder-reorder-announcement')).toHaveTextContent('Question déplacée en position 1 sur 2.');

    const duplicate = screen.getByRole('button', { name: /^Dupliquer$/i });
    duplicate.focus();
    await user.keyboard('{Enter}');
    state = JSON.parse(screen.getByTestId('builder-document').textContent);
    expect(state.questions).toHaveLength(3);
    expect(state.questions[1].body).toBe('Deuxième question');
    expect(state.questions[1].clientId).not.toBe(state.questions[0].clientId);

    const remove = screen.getByRole('button', { name: /^Supprimer$/i });
    remove.focus();
    await user.keyboard('{Enter}');
    state = JSON.parse(screen.getByTestId('builder-document').textContent);
    expect(state.questions).toHaveLength(2);
  });

  it('pilote une question multiple au clavier et la transmet à l’aperçu participant partagé', async () => {
    const user = userEvent.setup();
    const document = validDocument();
    document.questions = [document.questions[0]];
    render(<BuilderHarness initialDocument={document} />);

    const typeSelect = screen.getByLabelText(/type de question/i);
    typeSelect.focus();
    await user.selectOptions(typeSelect, 'multiple');
    await user.click(screen.getByRole('checkbox', { name: /bonne réponse 2/i }));

    const previewTrigger = screen.getAllByRole('button', { name: /aperçu participant/i })[0];
    await user.click(previewTrigger);
    const dialog = screen.getByRole('dialog', { name: 'Évaluation prévention' });

    expect(within(dialog).getByRole('heading', { name: 'Première question' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(2);
  });

  it('ferme l’aperçu avec Échap et rend le focus au déclencheur utilisé', async () => {
    const user = userEvent.setup();
    const rects = vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}]);
    try {
      render(<BuilderHarness />);

      const trigger = screen.getAllByRole('button', { name: /aperçu participant/i })[0];
      await user.click(trigger);
      const dialog = screen.getByRole('dialog');
      expect(screen.getByRole('button', { name: /fermer l’aperçu/i })).toHaveFocus();
      await user.tab({ shift: true });
      expect(dialog).toContainElement(window.document.activeElement);

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    } finally {
      rects.mockRestore();
    }
  });

  it('arrête l’aperçu progressif lorsque le seuil actif est atteint et focalise le résultat', async () => {
    const user = userEvent.setup();
    render(<BuilderHarness initialDocument={validProgressiveDocument(true)} />);

    await user.click(screen.getAllByRole('button', { name: /aperçu participant/i })[0]);
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'Oui' }));
    await user.click(within(dialog).getByRole('button', { name: /relire ce stade/i }));
    await user.click(within(dialog).getByRole('button', { name: /vérifier ce stade/i }));

    const result = await within(dialog).findByText(/seuil atteint : le parcours s’arrête au stade 1/i);
    expect(result).toHaveAttribute('role', 'status');
    await waitFor(() => expect(result).toHaveFocus());
    expect(result).toHaveTextContent(/s’arrête au stade 1/i);
    expect(within(dialog).queryByRole('heading', { name: 'Question du stade avancé' })).not.toBeInTheDocument();
  });

  it('avance dans l’aperçu progressif lorsque le seuil bloquant est désactivé', async () => {
    const user = userEvent.setup();
    render(<BuilderHarness initialDocument={validProgressiveDocument(false)} />);

    await user.click(screen.getAllByRole('button', { name: /aperçu participant/i })[0]);
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'Oui' }));
    await user.click(within(dialog).getByRole('button', { name: /relire ce stade/i }));
    await user.click(within(dialog).getByRole('button', { name: /vérifier ce stade/i }));

    expect(await within(dialog).findByRole('heading', { name: 'Question du stade avancé' })).toBeInTheDocument();
    expect(within(dialog).getByText(/stade 2 sur 2/i)).toBeInTheDocument();
  });

  it('expose les états saving, erreur API, conflit et succès avec des rôles accessibles', () => {
    const { rerender } = render(<BuilderHarness saveStatus="saving" />);
    expect(screen.getAllByRole('status').some((status) => /enregistrement du brouillon/i.test(status.textContent))).toBe(true);

    rerender(<BuilderHarness saveStatus="error" saveError="Réseau indisponible" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/réseau indisponible/i);

    rerender(<BuilderHarness saveStatus="conflict" conflict={{ message: 'Version distante', canDuplicate: true }} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/une version plus récente existe/i);

    rerender(<BuilderHarness saveStatus="saved" successMessage="Évaluation publiée" />);
    expect(screen.getAllByRole('status').some((status) => /évaluation publiée/i.test(status.textContent))).toBe(true);
  });

  it('conserve les modifications locales quand le rechargement après conflit source est annulé', async () => {
    const user = userEvent.setup();
    const onReloadSource = vi.fn();
    const confirm = vi.spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    try {
      render(
        <BuilderHarness
          conflict={{ kind: 'source', message: 'Le quiz a changé.', canDuplicate: true }}
          onReloadSource={onReloadSource}
        />,
      );
      const title = screen.getByLabelText(/titre de l’évaluation/i);
      await user.type(title, ' — version locale');
      const reload = screen.getByRole('button', { name: /recharger l’évaluation/i });

      await user.click(reload);
      expect(onReloadSource).not.toHaveBeenCalled();
      expect(title).toHaveValue('Évaluation prévention — version locale');
      expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/modifications locales non enregistrées seront abandonnées/i));

      await user.click(reload);
      expect(onReloadSource).toHaveBeenCalledTimes(1);
    } finally {
      confirm.mockRestore();
    }
  });

  it('rend tous les contrôles d’édition inertes pendant la publication', () => {
    const { container } = render(<BuilderHarness publishing />);
    const editingScope = container.querySelector('.assessment-builder-layout');

    expect(editingScope).toHaveAttribute('inert');
    expect(editingScope).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('button', { name: /publication/i })[0]).toBeDisabled();
  });
});
