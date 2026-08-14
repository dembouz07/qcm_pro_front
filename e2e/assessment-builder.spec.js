import path from 'node:path';
import { expect, test } from '@playwright/test';

const artifacts = path.resolve(process.cwd(), '..', 'artifacts', 'assessment-builder');

function adminUser() {
  return {
    id: 12,
    name: 'Formatrice E2E',
    role: 'admin',
    is_subscription_active: true,
    is_super_admin: false,
    plan_features: ['quiz_smart', 'surveys'],
  };
}

function publicQuestions(payload) {
  return (payload?.questions || []).map((question, questionIndex) => ({
    id: 100 + questionIndex,
    body: question.body,
    multiple: question.choices.filter((choice) => choice.is_correct).length > 1,
    choices: question.choices.map((choice, choiceIndex) => ({
      id: ((questionIndex + 1) * 1000) + choiceIndex + 1,
      body: choice.body,
    })),
  }));
}

async function mockAssessmentApi(page, options = {}) {
  const state = {
    draft: options.initialDraft || null,
    draftRequests: [],
    updateRequests: [],
    publishRequests: [],
    importRequests: [],
    submittedPayload: null,
    conflictOnNextUpdate: Boolean(options.conflictOnNextUpdate),
  };

  await page.addInitScript(() => localStorage.setItem('qcm_token', 'builder-e2e'));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const method = request.method();

    if (pathname === '/api/auth/me') {
      await route.fulfill({ json: adminUser() });
      return;
    }
    if (pathname === '/api/admin/classes' && method === 'GET') {
      await route.fulfill({ json: [{ id: 7, name: 'Cohorte E2E', academic_year: '2026-2027' }] });
      return;
    }
    if (/^\/api\/admin\/quizzes\/\d+$/.test(pathname) && method === 'GET') {
      const quizId = pathname.split('/').at(-1);
      const quiz = options.quizzes?.[quizId];
      await route.fulfill(quiz
        ? { json: quiz }
        : { status: 404, json: { message: 'Évaluation introuvable.' } });
      return;
    }
    if (pathname === '/api/admin/quiz-drafts' && method === 'GET') {
      await route.fulfill({ json: { data: state.draft ? [state.draft] : [] } });
      return;
    }
    if (pathname === '/api/admin/quiz-drafts/import' && method === 'POST') {
      state.importRequests.push({ contentType: request.headers()['content-type'], body: request.postData() });
      await route.fulfill({ json: options.importResult || {
        schema_version: 1,
        source: { filename: 'evaluation.csv', format: 'csv' },
        data: {
          title: 'Évaluation importée',
          questions: [{
            body: 'Question importée',
            points: 1,
            choices: [
              { body: 'Oui', is_correct: true },
              { body: 'Non', is_correct: false },
            ],
          }],
        },
        counts: { questions: 1, choices: 2 },
        warnings: [],
      } });
      return;
    }
    if (pathname === '/api/admin/quiz-drafts' && method === 'POST') {
      const body = request.postDataJSON();
      state.draftRequests.push(body);
      state.draft = {
        id: state.draft?.id || 501,
        mode: body.mode,
        schema_version: body.schema_version,
        quiz_id: body.quiz_id,
        payload: body.payload,
        revision: 1,
        published_at: null,
        updated_at: '2026-08-14T20:30:00.000Z',
      };
      await route.fulfill({ status: 201, json: state.draft });
      return;
    }
    if (/^\/api\/admin\/quiz-drafts\/\d+$/.test(pathname) && method === 'GET') {
      await route.fulfill(state.draft
        ? { json: state.draft }
        : { status: 404, json: { message: 'Brouillon introuvable.' } });
      return;
    }
    if (/^\/api\/admin\/quiz-drafts\/\d+$/.test(pathname) && method === 'PUT') {
      const body = request.postDataJSON();
      state.updateRequests.push(body);
      if (state.conflictOnNextUpdate) {
        state.conflictOnNextUpdate = false;
        const remoteDraft = {
          ...state.draft,
          revision: Number(state.draft.revision) + 1,
          payload: { ...state.draft.payload, title: 'Version distante reprise' },
          updated_at: '2026-08-14T20:31:00.000Z',
        };
        state.draft = remoteDraft;
        await route.fulfill({ status: 409, json: {
          code: 'draft_revision_conflict',
          message: 'Le brouillon a été modifié ailleurs.',
          expected_revision: body.revision,
          current_revision: remoteDraft.revision,
          draft: remoteDraft,
          can_duplicate: true,
        } });
        return;
      }
      state.draft = {
        ...state.draft,
        mode: body.mode,
        quiz_id: body.quiz_id,
        payload: body.payload,
        revision: Number(state.draft.revision) + 1,
        published_at: null,
        updated_at: '2026-08-14T20:32:00.000Z',
      };
      await route.fulfill({ json: state.draft });
      return;
    }
    if (/^\/api\/admin\/quiz-drafts\/\d+\/publish$/.test(pathname) && method === 'POST') {
      state.publishRequests.push(request.postDataJSON());
      const quiz = {
        id: 88,
        title: state.draft.payload.title,
        description: state.draft.payload.description,
        type: state.draft.mode,
        access_token: 'builder-e2e',
        is_published: true,
      };
      state.draft = {
        ...state.draft,
        quiz_id: quiz.id,
        revision: Number(state.draft.revision) + 1,
        published_at: '2026-08-14T20:33:00.000Z',
      };
      await route.fulfill({ status: 201, json: {
        message: 'Évaluation publiée.',
        already_published: false,
        quiz,
        draft: state.draft,
      } });
      return;
    }
    if (pathname === '/api/public/quiz/builder-e2e' && method === 'GET') {
      await route.fulfill({ json: {
        title: state.draft.payload.title,
        description: state.draft.payload.description,
        type: 'standard',
        is_open: true,
        is_closed: false,
        is_locked: false,
        starts_at: null,
        ends_at: null,
        questions_count: state.draft.payload.questions.length,
      } });
      return;
    }
    if (pathname === '/api/public/quiz/builder-e2e/start' && method === 'POST') {
      await route.fulfill({ json: {
        type: 'standard',
        title: state.draft.payload.title,
        description: state.draft.payload.description,
        attempt_id: 'attempt-builder-e2e',
        result_access_token: 'result-builder-e2e',
        ends_at: null,
        questions: publicQuestions(state.draft.payload),
      } });
      return;
    }
    if (pathname === '/api/public/quiz/builder-e2e/submit' && method === 'POST') {
      state.submittedPayload = request.postDataJSON();
      await route.fulfill({ json: {
        submission: { note_sur_20: 20, score: 3, total_points: 3, percentage: 100 },
      } });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Route mock absente : ${method} ${pathname}` } });
  });

  return state;
}

async function fillStandardAssessment(page) {
  await page.getByLabel(/titre de l’évaluation/i).fill('Évaluation gestes sûrs');
  await page.getByLabel(/classe ou cohorte/i).selectOption('7');
  await page.getByLabel(/^ouverture/i).fill('2026-09-10T09:00');
  await page.getByLabel(/^description/i).fill('Parcours de validation E2E.');

  await page.getByLabel(/^énoncé/i).fill('Quel est le premier geste ?');
  await page.getByRole('textbox', { name: 'Réponse 1' }).fill('Sécuriser');
  await page.getByRole('textbox', { name: 'Réponse 2' }).fill('Ignorer');
  await page.getByRole('radio', { name: /bonne réponse 1/i }).check();

  await page.getByRole('button', { name: /^ajouter une question$/i }).click();
  await page.getByLabel(/^énoncé/i).fill('Sélectionnez les bonnes pratiques');
  await page.getByLabel(/type de question/i).selectOption('multiple');
  await page.getByRole('textbox', { name: 'Réponse 1' }).fill('Préparer');
  await page.getByRole('textbox', { name: 'Réponse 2' }).fill('Vérifier');
  await page.getByRole('button', { name: /ajouter une réponse/i }).click();
  await page.getByRole('textbox', { name: 'Réponse 3' }).fill('Contourner');
  await page.getByRole('checkbox', { name: /bonne réponse 1/i }).check();
  await page.getByRole('checkbox', { name: /bonne réponse 2/i }).check();

  const moveUp = page.getByRole('button', { name: /^monter$/i });
  await moveUp.focus();
  await page.keyboard.press('Enter');
}

test.describe('builder d’évaluation formateur', () => {
  test('création, aperçu partagé, publication puis participation simple et multiple', async ({ page }) => {
    const state = await mockAssessmentApi(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/admin/quizzes/new');
    await expect(page.getByRole('heading', { name: /créer une évaluation/i })).toBeVisible();

    await fillStandardAssessment(page);

    const previewTrigger = page.getByRole('button', { name: /aperçu participant/i });
    await previewTrigger.click();
    const preview = page.getByRole('dialog', { name: 'Évaluation gestes sûrs' });
    await expect(preview.getByRole('heading', { name: 'Sélectionnez les bonnes pratiques' })).toBeVisible();
    await expect(preview.getByRole('checkbox')).toHaveCount(3);
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
    await expect(previewTrigger).toBeFocused();

    await page.getByRole('button', { name: /enregistrer le brouillon/i }).click();
    await expect(page.getByText(/brouillon enregistré/i)).toBeVisible();
    await page.getByRole('button', { name: /vérifier et publier/i }).first().click();

    const published = page.locator('.assessment-builder-success [role="status"]');
    await expect(published).toContainText('Évaluation gestes sûrs');
    await expect(published).toBeFocused();
    expect(state.draftRequests[0]).toMatchObject({
      mode: 'standard',
      schema_version: 1,
      quiz_id: null,
    });
    expect(state.draft.payload.questions.map((question) => question.body)).toEqual([
      'Sélectionnez les bonnes pratiques',
      'Quel est le premier geste ?',
    ]);
    expect(state.draft.payload.questions[0]).toMatchObject({ multiple: true });
    expect(state.publishRequests).toHaveLength(1);

    await page.goto('/quiz/builder-e2e');
    await page.getByLabel(/^nom/i).fill('Martin');
    await page.getByLabel(/^prénom/i).fill('Lina');
    await page.getByLabel(/^référentiel/i).fill('Sécurité');
    await page.getByRole('button', { name: /accéder au QCM/i }).click();
    await page.getByRole('checkbox', { name: 'Préparer' }).check();
    await page.getByRole('checkbox', { name: 'Vérifier' }).check();
    await page.getByRole('button', { name: /suivant/i }).click();
    await page.getByRole('radio', { name: 'Sécuriser' }).check();
    await page.getByRole('button', { name: /relire mes réponses/i }).click();
    await page.getByRole('button', { name: /envoyer mes réponses/i }).click();
    await expect(page.getByRole('heading', { name: 'Réponses envoyées' })).toBeFocused();

    expect(state.submittedPayload.answers).toEqual([
      { question_id: 100, choice_ids: [1001, 1002] },
      { question_id: 101, choice_id: 2001 },
    ]);
  });

  test('reprend automatiquement un brouillon, détecte le conflit et charge la version distante', async ({ page }) => {
    const initialDraft = {
      id: 601,
      mode: 'standard',
      schema_version: 1,
      quiz_id: null,
      revision: 3,
      published_at: null,
      updated_at: '2026-08-14T20:00:00.000Z',
      payload: {
        title: 'Brouillon à reprendre',
        description: 'Version locale',
        school_class_id: 7,
        starts_at: '2026-09-10T09:00',
        ends_at: null,
        show_corrections: false,
        is_published: false,
        questions: [{
          body: 'Question reprise',
          explanation: '',
          points: 1,
          multiple: false,
          choices: [
            { body: 'Oui', is_correct: true },
            { body: 'Non', is_correct: false },
          ],
        }],
      },
    };
    const state = await mockAssessmentApi(page, { initialDraft, conflictOnNextUpdate: true });
    await page.goto('/admin/quizzes/new');

    await expect(page.getByLabel(/titre de l’évaluation/i)).toHaveValue('Brouillon à reprendre');
    await expect(page.getByText(/brouillon repris automatiquement/i)).toBeVisible();
    await page.getByLabel(/^description/i).fill('Modification concurrente');

    await expect.poll(() => state.updateRequests.length, { timeout: 5_000 }).toBe(1);
    const conflict = page.getByRole('alert').filter({ hasText: /version plus récente/i });
    await expect(conflict).toBeVisible();
    await conflict.getByRole('button', { name: /charger la version distante/i }).click();
    await expect(page.getByLabel(/titre de l’évaluation/i)).toHaveValue('Version distante reprise');
    await expect(page.getByText(/brouillon enregistré/i)).toBeVisible();
  });

  test('édite sans perte un QCM standard multiple et un diagnostic progressif historiques', async ({ page }) => {
    const state = await mockAssessmentApi(page, {
      quizzes: {
        42: {
          id: 42,
          type: 'standard',
          builder_version: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          title: 'QCM historique multiple',
          school_class_id: 7,
          starts_at: '2026-09-01T08:30:00Z',
          questions: [{
            id: 420,
            body: 'Sélection historique multiple',
            points: 2,
            choices: [
              { id: 4201, body: 'Historique A', is_correct: true },
              { id: 4202, body: 'Historique B', is_correct: true },
              { id: 4203, body: 'Historique C', is_correct: false },
            ],
          }],
        },
        51: {
          id: 51,
          type: 'progressive',
          title: 'Diagnostic progressif historique',
          stage_threshold: 1,
          require_stage_pass: true,
          questions: [
            { id: 5101, stage: 1, stage_name: 'Initial', body: 'Question progressive initiale' },
            { id: 5102, stage: 2, stage_name: 'Avancé', body: 'Question progressive avancée' },
          ],
        },
      },
    });

    await page.goto('/admin/quizzes/42/edit');
    await expect(page.getByLabel(/titre de l’évaluation/i)).toHaveValue('QCM historique multiple');
    await expect(page.getByLabel(/type de question/i)).toHaveValue('multiple');
    await page.getByLabel(/^description/i).fill('Modification liée à la version chargée');
    await page.getByRole('button', { name: /enregistrer le brouillon/i }).click();
    await expect.poll(() => state.draftRequests.length).toBe(1);
    expect(state.draftRequests[0]).toMatchObject({
      quiz_id: 42,
      base_quiz_version: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    await page.getByRole('button', { name: /aperçu participant/i }).first().click();
    await expect(page.getByRole('dialog').getByRole('checkbox')).toHaveCount(3);
    await page.keyboard.press('Escape');

    await page.goto('/admin/quizzes/51/progressive/edit');
    await expect(page.getByLabel(/titre de l’évaluation/i)).toHaveValue('Diagnostic progressif historique');
    await expect(page.getByLabel(/seuil de « oui » par stade/i)).toHaveValue('1');
    await page.getByRole('button', { name: /aperçu participant/i }).first().click();
    const preview = page.getByRole('dialog');
    await preview.getByRole('radio', { name: 'Oui' }).check();
    await preview.getByRole('button', { name: /relire ce stade/i }).click();
    await preview.getByRole('button', { name: /vérifier ce stade/i }).click();
    const stoppedResult = preview.getByRole('status').filter({ hasText: /s’arrête au stade 1/i });
    await expect(stoppedResult).toBeVisible();
    await expect(stoppedResult).toBeFocused();
  });

  test('fait passer import parse-only et collage par un brouillon avant le builder partagé', async ({ page }) => {
    const state = await mockAssessmentApi(page);

    await page.goto('/admin/quizzes/import');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'evaluation.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('question,choice,is_correct\nQuestion importée,Oui,1'),
    });
    await page.getByRole('button', { name: /analyser et ouvrir le builder/i }).click();
    await expect(page).toHaveURL(/\/admin\/quizzes\/import\?draft=501$/);
    await expect(page.getByLabel(/titre de l’évaluation/i)).toHaveValue('Évaluation importée');
    expect(state.importRequests).toHaveLength(1);
    expect(state.importRequests[0].contentType).toContain('multipart/form-data');
    expect(state.publishRequests).toHaveLength(0);

    await page.goto('/admin/quizzes/smart');
    await page.getByLabel(/collez votre qcm ici/i).fill(`1. Question collée ?
A) Oui
B) Non
Réponse : A`);
    await page.getByRole('button', { name: /analyser et ouvrir le builder/i }).click();
    await expect(page).toHaveURL(/\/admin\/quizzes\/smart\?draft=501$/);
    await expect(page.getByLabel(/^énoncé/i)).toHaveValue('Question collée ?');
    expect(state.draftRequests).toHaveLength(2);
    expect(state.draftRequests[1]).toMatchObject({ mode: 'standard', quiz_id: null });
    expect(state.publishRequests).toHaveLength(0);
  });

  test('reste linéaire à 360 px, escamotable à 768 px et en trois panneaux à 1440 px', async ({ page }) => {
    await mockAssessmentApi(page);
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const viewport of [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/admin/quizzes/new');
      await expect(page.getByRole('heading', { name: /créer une évaluation/i })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);

      if (viewport.width === 360) {
        await expect(page.getByRole('navigation', { name: /étapes du builder/i }).getByRole('button')).toHaveCount(4);
        await expect(page.getByRole('button', { name: /1\. cadrage/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /afficher le plan/i })).toBeHidden();
      } else if (viewport.width === 768) {
        const planToggle = page.getByRole('button', { name: /afficher le plan/i });
        const plan = page.getByRole('complementary', { name: /plan des questions/i });
        await expect(planToggle).toBeVisible();
        await expect(planToggle).toHaveAttribute('aria-expanded', 'false');
        await expect(plan).toBeHidden();
        await planToggle.click();
        const closePlanToggle = page.getByRole('button', { name: /masquer le plan/i });
        await expect(closePlanToggle).toHaveAttribute('aria-expanded', 'true');
        await expect(plan).toBeVisible();
        await closePlanToggle.click();
        await expect(plan).toBeHidden();
      } else {
        await expect(page.getByRole('complementary', { name: /plan des questions/i })).toBeVisible();
        await expect(page.getByRole('complementary', { name: /réglages contextuels/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /afficher le plan/i })).toBeHidden();
      }

      await page.screenshot({
        path: path.join(artifacts, `after-${viewport.width}.png`),
        fullPage: true,
      });
    }

    expect(pageErrors).toEqual([]);
  });

  test('respecte prefers-reduced-motion dans le builder et son aperçu participant', async ({ page }) => {
    await mockAssessmentApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/admin/quizzes/new');
    await page.getByRole('button', { name: /aperçu participant/i }).click();

    await expect(page.getByRole('dialog').locator('.participant-quiz-flow')).toHaveAttribute('data-reduced-motion', 'true');
    const runningAnimations = await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length);
    expect(runningAnimations).toBe(0);
  });
});
