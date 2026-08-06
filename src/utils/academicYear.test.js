import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatClassLabel,
  getAcademicYearOptions,
  getCurrentAcademicYear,
  isValidAcademicYear,
} from './academicYear.js';

test('l’année scolaire change au premier août', () => {
  assert.equal(getCurrentAcademicYear(new Date(2026, 6, 31)), '2025-2026');
  assert.equal(getCurrentAcademicYear(new Date(2026, 7, 1)), '2026-2027');
});

test('le libellé de classe inclut une année scolaire valide', () => {
  assert.equal(formatClassLabel({ name: 'Licence 1', academic_year: '2026-2027' }), 'Licence 1 · 2026-2027');
  assert.equal(formatClassLabel({ name: 'Licence 1' }), 'Licence 1');
  assert.equal(isValidAcademicYear('2026-2028'), false);
});

test('les années proposées sont uniques et triées de la plus récente à la plus ancienne', () => {
  assert.deepEqual(
    getAcademicYearOptions([
      { academic_year: '2024-2025' },
      { academic_year: '2026-2027' },
      { academic_year: '2024-2025' },
    ], '2025-2026'),
    ['2026-2027', '2025-2026', '2024-2025'],
  );
});
