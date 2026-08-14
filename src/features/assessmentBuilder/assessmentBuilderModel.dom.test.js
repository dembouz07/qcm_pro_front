import {
  cloneQuestion,
  createBuilderDocument,
  createChoice,
  createProgressiveQuestion,
  createStage,
  createStandardQuestion,
  moveItem,
  normalizeProgressiveQuiz,
  normalizeStandardQuiz,
  serializeProgressiveDocument,
  serializeDraftDocument,
  serializeStandardDocument,
  toParticipantQuestions,
  validateBuilderDocument,
} from './assessmentBuilderModel.js';

describe('assessmentBuilderModel', () => {
  it('normalise un ancien QCM sans perdre ses identifiants ni ses réponses multiples', () => {
    const document = normalizeStandardQuiz({
      id: 42,
      title: 'Évaluation existante',
      description: 'Description conservée',
      school_class_id: 7,
      starts_at: '2026-09-01T08:30:00.000Z',
      ends_at: '2026-09-01T09:30:00.000Z',
      show_corrections: true,
      is_published: true,
      questions: [{
        id: 10,
        body: 'Sélectionnez les deux réponses exactes',
        explanation: 'Deux réponses sont attendues.',
        points: 3,
        choices: [
          { id: 101, body: 'Réponse A', is_correct: true },
          { id: 102, body: 'Réponse B', is_correct: true },
          { id: 103, body: 'Réponse C', is_correct: false },
        ],
      }],
    });

    expect(document).toMatchObject({
      type: 'standard',
      source: 'edit',
      title: 'Évaluation existante',
      school_class_id: '7',
      starts_at: '2026-09-01T08:30',
      ends_at: '2026-09-01T09:30',
      show_corrections: true,
      is_published: true,
    });
    expect(document.questions[0]).toMatchObject({
      id: 10,
      body: 'Sélectionnez les deux réponses exactes',
      multiple: true,
      points: 3,
    });
    expect(document.questions[0].choices.map(({ id, is_correct }) => ({ id, is_correct }))).toEqual([
      { id: 101, is_correct: true },
      { id: 102, is_correct: true },
      { id: 103, is_correct: false },
    ]);
  });

  it('préserve les identifiants serveur égaux à zéro pendant la normalisation et la sérialisation', () => {
    const document = normalizeStandardQuiz({
      title: 'Identifiants historiques',
      school_class_id: 7,
      starts_at: '2026-09-01T08:30:00.000Z',
      questions: [{
        id: 0,
        body: 'Question zéro',
        points: 1,
        choices: [
          { id: 0, body: 'Choix zéro', is_correct: true },
          { id: 1, body: 'Choix un', is_correct: false },
        ],
      }],
    });

    expect(document.questions[0].id).toBe(0);
    expect(document.questions[0].choices[0].id).toBe(0);
    expect(serializeStandardDocument(document).questions[0]).toMatchObject({
      id: 0,
      choices: [
        expect.objectContaining({ id: 0 }),
        expect.objectContaining({ id: 1 }),
      ],
    });
    expect(serializeDraftDocument(document).questions[0]).toMatchObject({
      id: 0,
      choices: [
        expect.objectContaining({ id: 0 }),
        expect.objectContaining({ id: 1 }),
      ],
    });
  });

  it('sérialise uniquement le contrat API standard existant pour un brouillon ou une publication', () => {
    const document = createBuilderDocument();
    Object.assign(document, {
      title: '  Évaluation sécurité  ',
      description: '  Description utile  ',
      school_class_id: '8',
      starts_at: '2026-09-10T09:00',
      ends_at: '',
      show_corrections: true,
      questions: [createStandardQuestion({
        id: 20,
        body: '  Question unique  ',
        explanation: '  Explication  ',
        points: 2,
        choices: [
          createChoice({ id: 201, body: '  Oui  ', is_correct: true }),
          createChoice({ id: 202, body: '  Non  ', is_correct: false }),
        ],
      })],
    });

    const draft = serializeStandardDocument(document);
    const published = serializeStandardDocument(document, { publish: true });

    expect(draft).toEqual({
      title: 'Évaluation sécurité',
      description: 'Description utile',
      school_class_id: 8,
      starts_at: '2026-09-10T09:00',
      ends_at: null,
      show_corrections: true,
      is_published: false,
      questions: [{
        id: 20,
        body: 'Question unique',
        explanation: 'Explication',
        points: 2,
        choices: [
          { id: 201, body: 'Oui', is_correct: true },
          { id: 202, body: 'Non', is_correct: false },
        ],
      }],
    });
    expect(published).toEqual({ ...draft, is_published: true });
    expect(published).not.toHaveProperty('duration');
    expect(published).not.toHaveProperty('shuffle_questions');
    expect(published).not.toHaveProperty('passing_score');
  });

  it('conserve le type simple ou multiple lors du cycle de sauvegarde et reprise du brouillon', () => {
    const document = createBuilderDocument();
    document.questions = [createStandardQuestion({
      body: 'Une question explicitement multiple',
      multiple: true,
      choices: [
        createChoice({ body: 'A', is_correct: true }),
        createChoice({ body: 'B', is_correct: false }),
      ],
    })];

    const payload = serializeDraftDocument(document);
    const resumed = normalizeStandardQuiz(payload, 'draft');

    expect(payload.questions[0].multiple).toBe(true);
    expect(resumed.questions[0].multiple).toBe(true);
  });

  it('valide les champs dans un ordre exploitable et expose la première cible de focus', () => {
    const document = createBuilderDocument();
    const result = validateBuilderDocument(document);

    expect(result.valid).toBe(false);
    expect(result.firstErrorId).toBe('builder-title');
    expect(result.errors.map(({ id }) => id)).toEqual(expect.arrayContaining([
      'builder-title',
      'builder-class',
      'builder-starts-at',
      `question-${document.questions[0].clientId}-body`,
      `choice-${document.questions[0].choices[0].clientId}-body`,
      `question-${document.questions[0].clientId}-correct`,
    ]));
  });

  it('refuse deux bonnes réponses pour une question déclarée simple', () => {
    const document = createBuilderDocument();
    Object.assign(document, {
      title: 'Question simple',
      school_class_id: '1',
      starts_at: '2026-09-10T09:00',
    });
    document.questions = [createStandardQuestion({
      body: 'Une seule réponse est attendue',
      multiple: false,
      choices: [
        createChoice({ body: 'A', is_correct: true }),
        createChoice({ body: 'B', is_correct: true }),
      ],
    })];

    const result = validateBuilderDocument(document);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      id: `question-${document.questions[0].clientId}-correct`,
      message: expect.stringMatching(/question simple/i),
    }));
  });

  it('refuse une question multiple qui divergerait du type publié faute de deux bonnes réponses', () => {
    const document = createBuilderDocument();
    Object.assign(document, {
      title: 'Question multiple',
      school_class_id: '1',
      starts_at: '2026-09-10T09:00',
    });
    document.questions = [createStandardQuestion({
      body: 'Plusieurs réponses peuvent être attendues',
      multiple: true,
      choices: [
        createChoice({ body: 'A', is_correct: true }),
        createChoice({ body: 'B', is_correct: false }),
      ],
    })];

    const result = validateBuilderDocument(document);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      id: `question-${document.questions[0].clientId}-correct`,
      message: expect.stringMatching(/au moins deux bonnes réponses/i),
    }));
  });

  it('duplique une question sans réutiliser les identifiants client ou serveur', () => {
    const original = createStandardQuestion({
      id: 30,
      body: 'Question à dupliquer',
      explanation: 'Explication',
      points: 4,
      multiple: true,
      choices: [
        createChoice({ id: 301, body: 'A', is_correct: true }),
        createChoice({ id: 302, body: 'B', is_correct: true }),
      ],
    });

    const duplicate = cloneQuestion(original);

    expect(duplicate).toMatchObject({
      body: original.body,
      explanation: original.explanation,
      points: original.points,
      multiple: true,
    });
    expect(duplicate).not.toHaveProperty('id');
    expect(duplicate.clientId).not.toBe(original.clientId);
    expect(duplicate.choices.map((choice) => choice.clientId)).not.toEqual(
      original.choices.map((choice) => choice.clientId),
    );
    expect(duplicate.choices.every((choice) => !('id' in choice))).toBe(true);
  });

  it('réordonne sans muter la liste et ignore les déplacements hors limites', () => {
    const original = ['Question 1', 'Question 2', 'Question 3'];

    expect(moveItem(original, 1, 0)).toEqual(['Question 2', 'Question 1', 'Question 3']);
    expect(original).toEqual(['Question 1', 'Question 2', 'Question 3']);
    expect(moveItem(original, 0, -1)).toBe(original);
    expect(moveItem(original, 2, 3)).toBe(original);
  });

  it('préserve et sérialise le contrat progressif existant', () => {
    const normalized = normalizeProgressiveQuiz({
      title: 'Diagnostic progressif',
      description: 'Deux stades',
      stage_threshold: 2,
      require_stage_pass: false,
      is_published: true,
      questions: [
        { id: 1, stage: 2, stage_name: 'Avancé', body: 'Question B' },
        { id: 2, stage: 1, stage_name: 'Initial', body: 'Question A1' },
        { id: 3, stage: 1, stage_name: 'Initial', body: 'Question A2' },
      ],
    });

    expect(normalized.stages.map((stage) => stage.name)).toEqual(['Initial', 'Avancé']);
    expect(normalized.stages[0].questions.map((question) => question.body)).toEqual(['Question A1', 'Question A2']);
    expect(serializeProgressiveDocument(normalized, { publish: true })).toEqual({
      title: 'Diagnostic progressif',
      description: 'Deux stades',
      stage_threshold: 2,
      require_stage_pass: false,
      is_published: true,
      stages: [
        { name: 'Initial', questions: ['Question A1', 'Question A2'] },
        { name: 'Avancé', questions: ['Question B'] },
      ],
    });
  });

  it('adapte les questions standard et progressives au moteur participant partagé', () => {
    const standard = createBuilderDocument();
    standard.questions = [createStandardQuestion({
      body: 'Choisissez les réponses',
      multiple: true,
      choices: [
        createChoice({ body: 'A' }),
        createChoice({ body: 'B' }),
      ],
    })];
    const progressive = createBuilderDocument({ type: 'progressive' });
    progressive.stages = [createStage(0, {
      name: 'Initial',
      questions: [createProgressiveQuestion({ body: 'Avez-vous défini votre objectif ?' })],
    })];

    expect(toParticipantQuestions(standard)).toEqual([expect.objectContaining({
      id: standard.questions[0].clientId,
      body: 'Choisissez les réponses',
      multiple: true,
      choices: [
        expect.objectContaining({ body: 'A' }),
        expect.objectContaining({ body: 'B' }),
      ],
    })]);
    expect(toParticipantQuestions(progressive)).toEqual([expect.objectContaining({
      body: 'Avez-vous défini votre objectif ?',
      multiple: false,
      choices: [
        expect.objectContaining({ body: 'Oui' }),
        expect.objectContaining({ body: 'Non' }),
      ],
    })]);
  });
});
