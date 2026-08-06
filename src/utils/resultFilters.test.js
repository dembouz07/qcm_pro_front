import test from 'node:test';
import assert from 'node:assert/strict';
import { filterGradeResults, toLocalDateValue } from './resultFilters.js';

test('une date est convertie selon le jour local du navigateur', () => {
  assert.equal(toLocalDateValue(new Date(2026, 7, 5, 23, 45)), '2026-08-05');
  assert.equal(toLocalDateValue('date-invalide'), '');
  assert.equal(toLocalDateValue(null), '');
});

test('le filtre date inclut toute la journée locale et exclut les autres jours', () => {
  const results = [
    { id: 1, submitted_at: new Date(2026, 7, 5, 0, 0).toISOString() },
    { id: 2, submitted_at: new Date(2026, 7, 5, 23, 59, 59).toISOString() },
    { id: 3, submitted_at: new Date(2026, 7, 6, 0, 0).toISOString() },
    { id: 4, submitted_at: null },
  ];

  assert.deepEqual(
    filterGradeResults(results, { submittedDate: '2026-08-05' }).map((result) => result.id),
    [1, 2],
  );
});

test('les filtres classe, QCM et date se combinent', () => {
  const selectedDay = new Date(2026, 7, 5, 12, 0).toISOString();
  const results = [
    { id: 1, submitted_at: selectedDay, quiz: { id: 8, school_class: { id: 3 } } },
    { id: 2, submitted_at: selectedDay, quiz: { id: 9, school_class: { id: 3 } } },
    { id: 3, submitted_at: selectedDay, quiz: { id: 8, school_class: { id: 4 } } },
  ];

  assert.deepEqual(
    filterGradeResults(results, { classId: '3', quizId: '8', submittedDate: '2026-08-05' })
      .map((result) => result.id),
    [1],
  );
});

test('sans filtre, tous les résultats valides sont conservés', () => {
  const results = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(filterGradeResults(results), results);
  assert.deepEqual(filterGradeResults(null), []);
});
