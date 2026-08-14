export const ASSESSMENT_BUILDER_SCHEMA_VERSION = 1;

let localId = 0;

export function createBuilderId(prefix = 'item') {
  localId += 1;
  const randomPart = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${localId}`;
  return `${prefix}-${randomPart}`;
}

export function createChoice(overrides = {}) {
  const hasServerId = overrides.id !== undefined && overrides.id !== null;
  return {
    clientId: overrides.clientId || createBuilderId('choice'),
    ...(hasServerId ? { id: overrides.id } : {}),
    body: overrides.body || '',
    is_correct: Boolean(overrides.is_correct),
  };
}

export function createStandardQuestion(overrides = {}) {
  const choices = (overrides.choices || [createChoice(), createChoice()]).map(createChoice);
  const hasServerId = overrides.id !== undefined && overrides.id !== null;
  return {
    clientId: overrides.clientId || createBuilderId('question'),
    ...(hasServerId ? { id: overrides.id } : {}),
    body: overrides.body || '',
    explanation: overrides.explanation || '',
    points: Number(overrides.points) || 1,
    multiple: overrides.multiple ?? choices.filter((choice) => choice.is_correct).length > 1,
    choices,
  };
}

export function createProgressiveQuestion(overrides = {}) {
  const hasServerId = overrides.id !== undefined && overrides.id !== null;
  return {
    clientId: overrides.clientId || createBuilderId('question'),
    ...(hasServerId ? { id: overrides.id } : {}),
    body: overrides.body || '',
  };
}

export function createStage(index = 0, overrides = {}) {
  const questions = overrides.questions || [createProgressiveQuestion()];
  return {
    clientId: overrides.clientId || createBuilderId('stage'),
    name: overrides.name || `Stade ${index + 1}`,
    questions: questions.map(createProgressiveQuestion),
  };
}

export function createBuilderDocument({ type = 'standard', source = 'manual' } = {}) {
  return {
    schemaVersion: ASSESSMENT_BUILDER_SCHEMA_VERSION,
    type,
    source,
    title: '',
    description: '',
    school_class_id: '',
    starts_at: '',
    ends_at: '',
    show_corrections: false,
    is_published: false,
    stage_threshold: 1,
    require_stage_pass: true,
    questions: type === 'standard' ? [createStandardQuestion()] : [],
    stages: type === 'progressive' ? [createStage(0), createStage(1)] : [],
  };
}

function inputDate(value) {
  return typeof value === 'string' ? value.slice(0, 16) : '';
}

export function normalizeStandardQuiz(quiz = {}, source = 'edit') {
  return {
    ...createBuilderDocument({ type: 'standard', source }),
    title: quiz.title || '',
    description: quiz.description || '',
    school_class_id: quiz.school_class_id ? String(quiz.school_class_id) : '',
    starts_at: inputDate(quiz.starts_at),
    ends_at: inputDate(quiz.ends_at),
    show_corrections: Boolean(quiz.show_corrections),
    is_published: Boolean(quiz.is_published),
    questions: (quiz.questions || []).length
      ? quiz.questions.map(createStandardQuestion)
      : [createStandardQuestion()],
  };
}

export function normalizeProgressiveQuiz(quiz = {}, source = 'edit') {
  const grouped = new Map();
  (quiz.questions || []).forEach((question) => {
    const stageNumber = Number(question.stage) || 1;
    if (!grouped.has(stageNumber)) {
      grouped.set(stageNumber, {
        name: question.stage_name || `Stade ${stageNumber}`,
        questions: [],
      });
    }
    grouped.get(stageNumber).questions.push(createProgressiveQuestion(question));
  });

  const stages = [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, stage], index) => createStage(index, stage));

  return {
    ...createBuilderDocument({ type: 'progressive', source }),
    title: quiz.title || '',
    description: quiz.description || '',
    is_published: Boolean(quiz.is_published),
    stage_threshold: Number(quiz.stage_threshold) || 1,
    require_stage_pass: quiz.require_stage_pass !== false,
    stages: stages.length ? stages : [createStage(0)],
  };
}

export function normalizeParsedQuestions(questions = [], source = 'paste') {
  return {
    ...createBuilderDocument({ type: 'standard', source }),
    show_corrections: true,
    questions: questions.length ? questions.map(createStandardQuestion) : [createStandardQuestion()],
  };
}

export function cloneQuestion(question, type = 'standard') {
  if (type === 'progressive') {
    return createProgressiveQuestion({ body: question.body });
  }
  return createStandardQuestion({
    body: question.body,
    explanation: question.explanation,
    points: question.points,
    multiple: question.multiple,
    choices: question.choices.map((choice) => createChoice({
      body: choice.body,
      is_correct: choice.is_correct,
    })),
  });
}

export function moveItem(items, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function error(id, message, section, itemId = null) {
  return { id, message, section, itemId };
}

export function validateBuilderDocument(document) {
  const errors = [];
  if (!document.title?.trim()) errors.push(error('builder-title', 'Donnez un titre à l’évaluation.', 'cadrage'));

  if (document.type === 'standard') {
    if (!document.school_class_id) errors.push(error('builder-class', 'Choisissez une classe.', 'cadrage'));
    if (!document.starts_at) errors.push(error('builder-starts-at', 'Indiquez une date d’ouverture.', 'cadrage'));
    if (document.ends_at && new Date(document.ends_at).getTime() <= new Date(document.starts_at).getTime()) {
      errors.push(error('builder-ends-at', 'La fermeture doit être postérieure à l’ouverture.', 'cadrage'));
    }
    if (!document.questions.length) errors.push(error('builder-add-question', 'Ajoutez au moins une question.', 'contenu'));

    document.questions.forEach((question, questionIndex) => {
      const label = `Question ${questionIndex + 1}`;
      if (!question.body?.trim()) {
        errors.push(error(`question-${question.clientId}-body`, `${label} : saisissez un énoncé.`, 'contenu', question.clientId));
      }
      const points = Number(question.points);
      if (!Number.isInteger(points) || points < 1 || points > 100) {
        errors.push(error(`question-${question.clientId}-points`, `${label} : les points doivent être compris entre 1 et 100.`, 'contenu', question.clientId));
      }
      if (!Array.isArray(question.choices) || question.choices.length < 2) {
        errors.push(error(`question-${question.clientId}-choices`, `${label} : ajoutez au moins deux réponses.`, 'contenu', question.clientId));
        return;
      }
      const incompleteChoice = question.choices.find((choice) => !choice.body?.trim());
      if (incompleteChoice) {
        errors.push(error(`choice-${incompleteChoice.clientId}-body`, `${label} : complétez toutes les réponses.`, 'contenu', question.clientId));
      }
      if (!question.choices.some((choice) => choice.is_correct)) {
        errors.push(error(`question-${question.clientId}-correct`, `${label} : choisissez au moins une bonne réponse.`, 'contenu', question.clientId));
      }
      const normalized = question.choices.map((choice) => choice.body.trim().toLocaleLowerCase('fr'));
      if (normalized.some(Boolean) && new Set(normalized).size !== normalized.length) {
        errors.push(error(`question-${question.clientId}-choices`, `${label} : deux réponses sont identiques.`, 'contenu', question.clientId));
      }
      if (!question.multiple && question.choices.filter((choice) => choice.is_correct).length > 1) {
        errors.push(error(`question-${question.clientId}-correct`, `${label} : une question simple ne peut avoir qu’une bonne réponse.`, 'contenu', question.clientId));
      }
      if (question.multiple && question.choices.filter((choice) => choice.is_correct).length < 2) {
        errors.push(error(`question-${question.clientId}-correct`, `${label} : une question multiple doit avoir au moins deux bonnes réponses pour rester cohérente après publication.`, 'contenu', question.clientId));
      }
    });
  } else {
    const threshold = Number(document.stage_threshold);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 20) {
      errors.push(error('builder-stage-threshold', 'Le seuil doit être un entier compris entre 1 et 20.', 'cadrage'));
    }
    if (!document.stages.length) errors.push(error('builder-add-stage', 'Ajoutez au moins un stade.', 'contenu'));
    document.stages.forEach((stage, stageIndex) => {
      const stageLabel = `Stade ${stageIndex + 1}`;
      if (!stage.name?.trim()) errors.push(error(`stage-${stage.clientId}-name`, `${stageLabel} : donnez un nom au stade.`, 'contenu', stage.clientId));
      if (!stage.questions.length) errors.push(error(`stage-${stage.clientId}-questions`, `${stageLabel} : ajoutez au moins une question.`, 'contenu', stage.clientId));
      if (threshold > stage.questions.length) {
        errors.push(error(`stage-${stage.clientId}-questions`, `${stageLabel} : le seuil de ${threshold} « Oui » dépasse ses ${stage.questions.length} question(s).`, 'contenu', stage.clientId));
      }
      stage.questions.forEach((question, questionIndex) => {
        if (!question.body?.trim()) {
          errors.push(error(`question-${question.clientId}-body`, `${stageLabel}, question ${questionIndex + 1} : saisissez un énoncé.`, 'contenu', question.clientId));
        }
      });
      const normalized = stage.questions.map((question) => question.body.trim().toLocaleLowerCase('fr'));
      if (normalized.some(Boolean) && new Set(normalized).size !== normalized.length) {
        errors.push(error(`stage-${stage.clientId}-questions`, `${stageLabel} : deux questions sont identiques.`, 'contenu', stage.clientId));
      }
    });
  }

  return { valid: errors.length === 0, errors, firstErrorId: errors[0]?.id || null };
}

export function serializeStandardDocument(document, { publish = false } = {}) {
  return {
    title: document.title.trim(),
    description: document.description.trim(),
    school_class_id: Number(document.school_class_id),
    starts_at: document.starts_at,
    ends_at: document.ends_at || null,
    show_corrections: Boolean(document.show_corrections),
    is_published: Boolean(publish),
    questions: document.questions.map((question) => ({
      ...(question.id !== undefined && question.id !== null ? { id: question.id } : {}),
      body: question.body.trim(),
      explanation: question.explanation?.trim() || '',
      points: Number(question.points) || 1,
      choices: question.choices.map((choice) => ({
        ...(choice.id !== undefined && choice.id !== null ? { id: choice.id } : {}),
        body: choice.body.trim(),
        is_correct: Boolean(choice.is_correct),
      })),
    })),
  };
}

export function serializeProgressiveDocument(document, { publish = false } = {}) {
  return {
    title: document.title.trim(),
    description: document.description.trim(),
    stage_threshold: Number(document.stage_threshold),
    require_stage_pass: Boolean(document.require_stage_pass),
    is_published: Boolean(publish),
    stages: document.stages.map((stage) => ({
      name: stage.name.trim(),
      questions: stage.questions.map((question) => question.body.trim()),
    })),
  };
}

export function serializeDraftDocument(document) {
  if (document.type === 'progressive') {
    return {
      builder_source: document.source || 'manual',
      title: document.title,
      description: document.description,
      stage_threshold: document.stage_threshold,
      require_stage_pass: Boolean(document.require_stage_pass),
      is_published: false,
      stages: document.stages.map((stage) => ({
        name: stage.name,
        questions: stage.questions.map((question) => question.body),
      })),
    };
  }

  return {
    builder_source: document.source || 'manual',
    title: document.title,
    description: document.description,
    school_class_id: document.school_class_id ? Number(document.school_class_id) : null,
    starts_at: document.starts_at || null,
    ends_at: document.ends_at || null,
    show_corrections: Boolean(document.show_corrections),
    is_published: false,
    questions: document.questions.map((question) => ({
      ...(question.id !== undefined && question.id !== null ? { id: question.id } : {}),
      body: question.body,
      explanation: question.explanation || '',
      points: question.points,
      multiple: Boolean(question.multiple),
      choices: question.choices.map((choice) => ({
        ...(choice.id !== undefined && choice.id !== null ? { id: choice.id } : {}),
        body: choice.body,
        is_correct: Boolean(choice.is_correct),
      })),
    })),
  };
}

export function normalizeDraftDocument(draft) {
  const payload = draft?.payload || {};
  if (draft?.mode === 'progressive') {
    return {
      ...createBuilderDocument({ type: 'progressive', source: payload.builder_source || 'draft' }),
      title: payload.title || '',
      description: payload.description || '',
      is_published: false,
      stage_threshold: Number(payload.stage_threshold) || 1,
      require_stage_pass: payload.require_stage_pass !== false,
      stages: (payload.stages || []).length
        ? payload.stages.map((stage, index) => createStage(index, {
          name: stage.name,
          questions: (stage.questions || []).map((body) => createProgressiveQuestion({ body })),
        }))
        : [createStage(0)],
    };
  }
  return {
    ...normalizeStandardQuiz(payload, payload.builder_source || 'draft'),
    is_published: false,
  };
}

export function toParticipantQuestions(document, stageIndex = 0) {
  if (document.type === 'progressive') {
    return (document.stages[stageIndex]?.questions || []).map((question) => ({
      id: question.clientId,
      body: question.body || 'Question sans énoncé',
      multiple: false,
      choices: [
        { id: `${question.clientId}-yes`, body: 'Oui' },
        { id: `${question.clientId}-no`, body: 'Non' },
      ],
    }));
  }
  return document.questions.map((question) => ({
    id: question.clientId,
    body: question.body || 'Question sans énoncé',
    multiple: Boolean(question.multiple),
    choices: question.choices.map((choice, index) => ({
      id: choice.clientId,
      body: choice.body || `Réponse ${index + 1}`,
    })),
  }));
}
