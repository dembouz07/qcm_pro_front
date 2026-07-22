import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuiz } from './quizParser.js';
import {
  canAdvanceProgressiveStage,
  validateProgressiveQuiz,
  validateQuizImport,
  validateStandardQuiz,
} from './quizFormValidation.js';

const metadata = {
  title: 'QCM test',
  school_class_id: '1',
  starts_at: '2026-07-20T10:00',
  ends_at: '2026-07-20T11:00',
};

test('le collage reconnaît les réponses explicites et multiples', () => {
  const result = parseQuiz(`1. Quels langages sont web ?
A) JavaScript
B) HTML
C) Cobol
D) Python
E) Java
Réponses : A et B

2. La capitale du Sénégal ?
- Dakar (bonne)
- Thiès`);

  assert.equal(result.questions.length, 2);
  assert.deepEqual(result.questions[0].choices.map((choice) => choice.is_correct), [true, true, false, false, false]);
  assert.deepEqual(result.questions[1].choices.map((choice) => choice.is_correct), [true, false]);
  assert.equal(result.questions.some((question) => question.uncertain), false);
});

test('le collage ne choisit jamais silencieusement la première réponse', () => {
  const result = parseQuiz(`1. Question sans corrigé ?
A) Premier choix
B) Deuxième choix`);

  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].uncertain, true);
  assert.equal(result.questions[0].choices.some((choice) => choice.is_correct), false);
  assert.equal(result.warnings.length, 1);
});

test('la validation standard bloque une question sans bonne réponse et les doublons', () => {
  const base = {
    ...metadata,
    questions: [{
      body: 'Question ?',
      points: 1,
      choices: [
        { body: 'Oui', is_correct: false },
        { body: 'Non', is_correct: false },
      ],
    }],
  };

  assert.match(validateStandardQuiz(base), /bonne réponse/i);
  assert.match(validateStandardQuiz({
    ...base,
    questions: [{ ...base.questions[0], choices: [
      { body: 'Même choix', is_correct: true },
      { body: ' même choix ', is_correct: false },
    ] }],
  }), /identiques/i);
});

test('la validation progressive garantit que le seuil est atteignable', () => {
  const { school_class_id: _schoolClassId, ...publicMetadata } = metadata;

  assert.match(validateProgressiveQuiz(
    { ...publicMetadata, stage_threshold: 2 },
    [{ name: 'Stade 1', questions: ['Une question ?'] }],
  ), /dépasse/i);

  assert.equal(validateProgressiveQuiz(
    { ...publicMetadata, stage_threshold: 1 },
    [{ name: 'Stade 1', questions: ['Une question ?'] }],
  ), '');
});

test('la progression peut autoriser ou bloquer le passage après un échec', () => {
  assert.equal(canAdvanceProgressiveStage(0, 1, false), true);
  assert.equal(canAdvanceProgressiveStage(0, 1, true), false);
  assert.equal(canAdvanceProgressiveStage(1, 1, true), true);
});

test('la validation d’import contrôle le format, la taille et les dates', () => {
  assert.match(validateQuizImport({ ...metadata, file: { name: 'quiz.exe', size: 10 } }), /Format/i);
  assert.match(validateQuizImport({ ...metadata, file: { name: 'quiz.csv', size: 11 * 1024 * 1024 } }), /10 Mo/i);
  assert.equal(validateQuizImport({ ...metadata, file: { name: 'quiz.pdf', size: 1024 } }), '');
  assert.match(validateQuizImport({ ...metadata, ends_at: metadata.starts_at, file: { name: 'quiz.csv', size: 10 } }), /postérieure/i);
});
