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

async function browserSessionHeaders(page) {
  const xsrfCookie = (await page.context().cookies(apiRoot))
    .find((cookie) => cookie.name === 'XSRF-TOKEN');

  if (!xsrfCookie) throw new Error('Cookie CSRF Sanctum introuvable après inscription.');

  return {
    Accept: 'application/json',
    Origin: 'http://127.0.0.1:4177',
    Referer: 'http://127.0.0.1:4177/',
    'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.value),
  };
}

test.describe('smoke builder avec API Laravel réelle', () => {
  test.skip(!configuredRealApi, 'Définir REAL_API_URL pour activer le smoke réel isolé.');

  test('crée le compte et la classe, publie puis passe réellement l’évaluation', async ({ page }) => {
    test.setTimeout(90_000);
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let classId = process.env.REAL_CLASS_ID ? Number(process.env.REAL_CLASS_ID) : null;
    let quizId = null;
    let draftId = null;
    let authorization;

    if (process.env.REAL_API_TOKEN) {
      authorization = {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.REAL_API_TOKEN}`,
      };
      await page.setExtraHTTPHeaders(authorization);
      await page.goto('/admin');
    } else {
      await page.goto('/register-admin');
      await page.getByLabel('Nom complet').fill('Formatrice Smoke Builder');
      await page.getByLabel('Email').fill(`builder-smoke-${unique}@example.test`);
      await page.getByLabel('Mot de passe').fill('SmokeBuilder123!');
      await page.getByLabel('Confirmer').fill('SmokeBuilder123!');
      await page.getByRole('button', { name: /créer mon compte formateur/i }).click();
      await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
      authorization = await browserSessionHeaders(page);
    }

    if (!classId) {
      const createdClass = await page.request.post(`${apiRoot}/admin/classes`, {
        headers: authorization,
        data: { name: `Cohorte smoke ${unique}`, academic_year: '2026-2027', code: '' },
      });
      await expectOk(createdClass);
      classId = (await createdClass.json()).id;
    }

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

      // Laisser l'auto-sauvegarde finir avant le clic : pendant "saving",
      // le bouton de publication est volontairement désactivé.
      await expect(page.locator('.builder-save-status')).toContainText('Brouillon enregistré', { timeout: 15_000 });
      const publishButton = page.locator('.assessment-builder-header-actions')
        .getByRole('button', { name: /^vérifier et publier$/i });
      await expect(publishButton).toBeEnabled();

      const publishResponsePromise = page.waitForResponse((response) => (
        /\/api\/admin\/quiz-drafts\/\d+\/publish$/.test(new URL(response.url()).pathname)
        && response.request().method() === 'POST'
      ));
      await publishButton.click();
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
      if (draftId) await page.request.delete(`${apiRoot}/admin/quiz-drafts/${draftId}`, { headers: authorization });
      if (quizId) await page.request.delete(`${apiRoot}/admin/quizzes/${quizId}`, { headers: authorization });
      if (!process.env.REAL_CLASS_ID && classId) {
        await page.request.delete(`${apiRoot}/admin/classes/${classId}`, { headers: authorization });
      }
    }
  });
});
