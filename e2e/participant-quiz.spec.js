import path from 'node:path';
import { expect, test } from '@playwright/test';

const artifacts = path.resolve(process.cwd(), '..', 'artifacts', 'quiz-engine');

test.describe('moteur QCM participant', () => {
  test('démo : clavier, revue, résultat et correction accessibles', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/demo-qcm');

    const answers = [
      'Une réponse à une situation d’application',
      'Établir le niveau initial',
      'Environ six mois après le diagnostic initial',
      'Non, jamais sans analyse humaine et éléments complémentaires',
      'Une comparaison documentée avant/après',
    ];

    for (let index = 0; index < answers.length; index += 1) {
      const radio = page.getByRole('radio', { name: answers[index] });
      if (index === 0) {
        await radio.focus();
        await page.keyboard.press('Space');
      } else {
        await radio.check();
      }
      await expect(radio).toBeChecked();
      const label = index === answers.length - 1 ? /relire mes réponses/i : /suivant/i;
      await page.getByRole('button', { name: label }).click();
    }

    await expect(page.getByRole('heading', { name: 'Vérifiez vos réponses' })).toBeFocused();
    await page.getByRole('button', { name: /voir mon résultat/i }).click();
    const resultHeading = page.getByRole('heading', { name: 'Évaluation terminée' });
    await expect(resultHeading).toBeFocused();
    await expect(page.getByText('5/5')).toBeVisible();

    const correctionTrigger = page.getByRole('button', { name: /voir ma correction/i });
    await correctionTrigger.click();
    await expect(page.getByRole('heading', { name: 'Correction détaillée' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(correctionTrigger).toBeFocused();
    await expect(correctionTrigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('rendu responsive sans débordement à 360, 768 et 1440 px', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const viewports = [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1440, height: 1000 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/demo-qcm');
      expect(pageErrors).toEqual([]);
      await expect(page.getByRole('heading', { name: 'Testez une évaluation comme un participant.' })).toBeVisible();
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(hasOverflow).toBe(false);
      await page.screenshot({
        path: path.join(artifacts, `after-${viewport.width}.png`),
        fullPage: true,
      });
    }
  });

  test('le bouton Modifier reste identifiable et tactile aux trois largeurs', async ({ page }) => {
    test.setTimeout(90_000);
    const viewports = [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1440, height: 1000 },
    ];
    const answers = [
      'Une réponse à une situation d’application',
      'Établir le niveau initial',
      'Environ six mois après le diagnostic initial',
      'Non, jamais sans analyse humaine et éléments complémentaires',
      'Une comparaison documentée avant/après',
    ];
    await page.addInitScript(() => sessionStorage.clear());

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/demo-qcm');

      for (let index = 0; index < answers.length; index += 1) {
        await page.getByRole('radio', { name: answers[index] }).check();
        await page.getByRole('button', {
          name: index === answers.length - 1 ? /relire mes réponses/i : /suivant/i,
        }).click();
      }

      const editButton = page.getByRole('button', { name: 'Modifier la réponse à la question 1' });
      await expect(editButton).toBeVisible();
      const box = await editButton.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
      if (viewport.width === 360) expect(box?.width).toBeGreaterThan(250);

      const style = await editButton.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          display: computed.display,
          borderRadius: computed.borderRadius,
          color: computed.color,
        };
      });
      expect(['flex', 'inline-flex']).toContain(style.display);
      expect(style.borderRadius).toBe('12px');
      expect(style.color).toBe('rgb(91, 92, 246)');

      await page.screenshot({
        path: path.join(artifacts, `review-button-${viewport.width}.png`),
        fullPage: true,
      });
      await editButton.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: /quel indicateur permet/i })).toBeFocused();
    }
  });

  test('prefers-reduced-motion neutralise les mouvements du parcours', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demo-qcm');
    await expect(page.locator('.participant-quiz-flow')).toHaveAttribute('data-reduced-motion', 'true');
    const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    expect(scrollBehavior).toBe('auto');
  });

  test('variante publique : identification, étapes, revue et payload inchangé', async ({ page }) => {
    let submittedPayload;
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname === '/api/auth/me') {
        await route.fulfill({ status: 401, json: { message: 'Non authentifié' } });
      } else if (pathname === '/api/public/quiz/e2e' && request.method() === 'GET') {
        await route.fulfill({ json: {
          title: 'QCM public E2E', description: 'Test public', type: 'standard', is_open: true,
          is_closed: false, is_locked: false, starts_at: null, ends_at: null, questions_count: 1,
        } });
      } else if (pathname === '/api/public/quiz/e2e/start') {
        await route.fulfill({ json: {
          type: 'standard', title: 'QCM public E2E', description: 'Test public',
          attempt_id: 'attempt-e2e', result_access_token: 'secret-e2e', ends_at: null,
          questions: [{ id: 7, body: 'Question publique E2E', choices: [{ id: 71, body: 'Réponse publique' }] }],
        } });
      } else if (pathname === '/api/public/quiz/e2e/submit') {
        submittedPayload = request.postDataJSON();
        await route.fulfill({ json: { submission: { note_sur_20: 20, score: 1, total_points: 1, percentage: 100 } } });
      } else {
        await route.fulfill({ status: 404, json: { message: 'Route mock absente' } });
      }
    });

    await page.goto('/quiz/e2e');
    await page.getByLabel(/^Nom/).fill('Martin');
    await page.getByLabel(/^Prénom/).fill('Lina');
    await page.getByLabel(/^Référentiel/).fill('Management');
    await page.getByRole('button', { name: /accéder au QCM/i }).click();
    await page.getByRole('radio', { name: 'Réponse publique' }).check();
    await page.getByRole('button', { name: /relire mes réponses/i }).click();
    await page.getByRole('button', { name: /envoyer mes réponses/i }).click();

    await expect(page.getByRole('heading', { name: 'Réponses envoyées' })).toBeFocused();
    expect(submittedPayload).toEqual({
      attempt_id: 'attempt-e2e', result_access_token: 'secret-e2e', nom: 'Martin', prenom: 'Lina',
      referentiel: 'Management', auto_submit: false, answers: [{ question_id: 7, choice_id: 71 }],
    });
  });

  test('variante connectée : route protégée et résultat avec correction', async ({ page }) => {
    let submittedPayload;
    await page.addInitScript(() => localStorage.setItem('qcm_token', 'e2e'));
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname === '/api/auth/me') {
        await route.fulfill({ json: { id: 3, role: 'student', name: 'Lina Martin' } });
      } else if (pathname === '/api/student/quizzes/42' && request.method() === 'GET') {
        await route.fulfill({ json: {
          id: 42, title: 'QCM connecté E2E', description: 'Test connecté', ends_at: null,
          questions: [{ id: 8, body: 'Question connectée E2E', multiple: false, choices: [{ id: 81, body: 'Réponse connectée' }] }],
        } });
      } else if (pathname === '/api/student/quizzes/42/submit') {
        submittedPayload = request.postDataJSON();
        await route.fulfill({ json: {
          submission: { note_sur_20: 20, score: 1, total_points: 1, percentage: 100 },
          show_corrections: true,
          correction: {
            questions: [{
              id: 8, body: 'Question connectée E2E', is_correct: true,
              choices: [{ id: 81, body: 'Réponse connectée', is_correct: true, chosen: true }],
            }],
          },
        } });
      } else {
        await route.fulfill({ status: 404, json: { message: 'Route mock absente' } });
      }
    });

    await page.goto('/student/quizzes/42');
    await page.getByRole('button', { name: /commencer le test/i }).click();
    await page.getByRole('radio', { name: 'Réponse connectée' }).check();
    await page.getByRole('button', { name: /relire mes réponses/i }).click();
    await page.getByRole('button', { name: /envoyer mes réponses/i }).click();

    await expect(page.getByRole('heading', { name: 'Réponses envoyées' })).toBeFocused();
    expect(submittedPayload).toEqual({
      auto_submit: false,
      answers: [{ question_id: 8, choice_id: 81 }],
    });
    await page.getByRole('button', { name: /afficher la correction détaillée/i }).click();
    await expect(page.getByRole('heading', { name: 'Correction détaillée' })).toBeFocused();
  });
});
