import { expect, test } from '@playwright/test';

const configuredRealApi = process.env.REAL_API_URL?.replace(/\/$/, '') || '';
const apiRoot = configuredRealApi.endsWith('/api') ? configuredRealApi : `${configuredRealApi}/api`;

function localDateTime(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

async function expectOk(response) {
  if (!response.ok()) {
    throw new Error(`Réponse API ${response.status()} : ${await response.text()}`);
  }
}

test.describe('smoke builder avec API Laravel réelle', () => {
  test.skip(!configuredRealApi, 'Définir REAL_API_URL pour activer le smoke réel isolé.');

  test('crée le compte et la classe, publie puis passe réellement l’évaluation', async ({ page, request }) => {
    test.setTimeout(90_000);
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let token = process.env.REAL_API_TOKEN || '';
    let classId = process.env.REAL_CLASS_ID ? Number(process.env.REAL_CLASS_ID) : null;
    let quizId = null;
    let draftId = null;

    if (!token) {
      const registration = await request.post(`${apiRoot}/auth/register-admin`, {
        data: {
          name: 'Formatrice Smoke Builder',
          email: `builder-smoke-${unique}@example.test`,
          password: 'SmokeBuilder123!',
          password_confirmation: 'SmokeBuilder123!',
        },
      });
      await expectOk(registration);
      token = (await registration.json()).token;
    }

    const authorization = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    if (!classId) {
      const createdClass = await request.post(`${apiRoot}/admin/classes`, {
        headers: authorization,
        data: { name: `Cohorte smoke ${unique}`, academic_year: '2026-2027', code: '' },
      });
      await expectOk(createdClass);
      classId = (await createdClass.json()).id;
    }

    await page.addInitScript((storedToken) => localStorage.setItem('qcm_token', storedToken), token);

    try {
      await page.goto('/admin/quizzes/new');
      await expect(page.getByRole('heading', { name: /créer une évaluation/i })).toBeVisible({ timeout: 20_000 });
      await page.getByLabel(/titre de l’évaluation/i).fill(`Évaluation smoke ${unique}`);
      await page.getByLabel(/classe ou cohorte/i).selectOption(String(classId));
      await page.getByLabel(/^ouverture/i).fill(localDateTime(new Date(Date.now() - 60_000)));
      await page.getByLabel(/^énoncé/i).fill('Quel comportement est sûr ?');
      await page.getByRole('textbox', { name: 'Réponse 1' }).fill('Vérifier avant d’agir');
      await page.getByRole('textbox', { name: 'Réponse 2' }).fill('Agir sans contrôle');
      await page.getByRole('radio', { name: /bonne réponse 1/i }).check();

      await page.getByRole('button', { name: /^ajouter une question$/i }).click();
      await page.getByLabel(/^énoncé/i).fill('Quelles vérifications sont nécessaires ?');
      await page.getByLabel(/type de question/i).selectOption('multiple');
      await page.getByRole('textbox', { name: 'Réponse 1' }).fill('Contrôler le contexte');
      await page.getByRole('textbox', { name: 'Réponse 2' }).fill('Demander confirmation');
      await page.getByRole('button', { name: /ajouter une réponse/i }).click();
      await page.getByRole('textbox', { name: 'Réponse 3' }).fill('Ignorer les consignes');
      await page.getByRole('checkbox', { name: /bonne réponse 1/i }).check();
      await page.getByRole('checkbox', { name: /bonne réponse 2/i }).check();

      const previewTrigger = page.getByRole('button', { name: /aperçu participant/i }).first();
      await previewTrigger.click();
      const preview = page.getByRole('dialog');
      await expect(preview.getByRole('heading', { name: 'Quel comportement est sûr ?' })).toBeVisible();
      await preview.getByRole('radio', { name: 'Vérifier avant d’agir' }).check();
      await preview.getByRole('button', { name: /suivant/i }).click();
      await expect(preview.getByRole('heading', { name: 'Quelles vérifications sont nécessaires ?' })).toBeVisible();
      await expect(preview.getByRole('checkbox')).toHaveCount(3);
      await page.keyboard.press('Escape');
      await expect(preview).toBeHidden();
      await expect(previewTrigger).toBeFocused();

      const publishResponsePromise = page.waitForResponse((response) => (
        /\/api\/admin\/quiz-drafts\/\d+\/publish$/.test(new URL(response.url()).pathname)
        && response.request().method() === 'POST'
      ));
      await page.getByRole('button', { name: /vérifier et publier/i }).first().click();
      const publishResponse = await publishResponsePromise;
      await expectOk(publishResponse);
      const published = await publishResponse.json();
      quizId = published.quiz.id;
      draftId = published.draft.id;
      await expect(page.locator('.assessment-builder-success [role="status"]')).toBeFocused();

      await page.goto(`/quiz/${published.quiz.access_token}`);
      await page.getByLabel(/^nom/i).fill('Smoke');
      await page.getByLabel(/^prénom/i).fill('Participant');
      await page.getByLabel(/^référentiel/i).fill('Sécurité');
      await page.getByRole('button', { name: /accéder au QCM/i }).click();
      await page.getByRole('radio', { name: 'Vérifier avant d’agir' }).check();
      await page.getByRole('button', { name: /suivant/i }).click();
      await page.getByRole('checkbox', { name: 'Contrôler le contexte' }).check();
      await page.getByRole('checkbox', { name: 'Demander confirmation' }).check();
      await page.getByRole('button', { name: /relire mes réponses/i }).click();
      const submitRequestPromise = page.waitForRequest((request) => (
        /\/api\/public\/quiz\/[^/]+\/submit$/.test(new URL(request.url()).pathname)
        && request.method() === 'POST'
      ));
      await page.getByRole('button', { name: /envoyer mes réponses/i }).click();
      const submitPayload = (await submitRequestPromise).postDataJSON();
      expect(submitPayload.answers[0]).toEqual(expect.objectContaining({ choice_id: expect.any(Number) }));
      expect(submitPayload.answers[0]).not.toHaveProperty('choice_ids');
      expect(submitPayload.answers[1]).toEqual(expect.objectContaining({ choice_ids: expect.arrayContaining([expect.any(Number)]) }));
      expect(submitPayload.answers[1].choice_ids).toHaveLength(2);
      await expect(page.getByRole('heading', { name: 'Réponses envoyées' })).toBeFocused();
    } finally {
      if (draftId) await request.delete(`${apiRoot}/admin/quiz-drafts/${draftId}`, { headers: authorization });
      if (quizId) await request.delete(`${apiRoot}/admin/quizzes/${quizId}`, { headers: authorization });
      if (!process.env.REAL_CLASS_ID && classId) {
        await request.delete(`${apiRoot}/admin/classes/${classId}`, { headers: authorization });
      }
    }
  });
});
