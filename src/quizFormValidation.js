const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMPORT_EXTENSIONS = ['csv', 'json', 'doc', 'docx', 'pdf'];

function validateBasics(form, label = 'QCM', options = {}) {
  const { requireClass = true, requireSchedule = true } = options;
  if (!form.title?.trim()) return `Donnez un titre au ${label}.`;
  if (requireClass && !form.school_class_id) return 'Choisissez une classe.';
  if (requireSchedule && !form.starts_at) return "Indiquez une date d'ouverture.";

  if (requireSchedule && form.ends_at && new Date(form.ends_at).getTime() <= new Date(form.starts_at).getTime()) {
    return "La fermeture doit être postérieure à l'ouverture.";
  }

  return '';
}

export function validateStandardQuiz(form) {
  const basicError = validateBasics(form);
  if (basicError) return basicError;
  if (!Array.isArray(form.questions) || form.questions.length === 0) {
    return 'Ajoutez au moins une question.';
  }

  for (let questionIndex = 0; questionIndex < form.questions.length; questionIndex += 1) {
    const question = form.questions[questionIndex];
    const number = questionIndex + 1;
    if (!question.body?.trim()) return `Question ${number} : saisissez un énoncé.`;
    if (!Number.isInteger(Number(question.points)) || Number(question.points) < 1 || Number(question.points) > 100) {
      return `Question ${number} : les points doivent être compris entre 1 et 100.`;
    }
    if (!Array.isArray(question.choices) || question.choices.length < 2) {
      return `Question ${number} : ajoutez au moins deux choix.`;
    }
    if (question.choices.some((choice) => !choice.body?.trim())) {
      return `Question ${number} : complétez tous les choix.`;
    }
    if (!question.choices.some((choice) => choice.is_correct)) {
      return `Question ${number} : cochez au moins une bonne réponse.`;
    }

    const normalizedChoices = question.choices.map((choice) => choice.body.trim().toLocaleLowerCase('fr'));
    if (new Set(normalizedChoices).size !== normalizedChoices.length) {
      return `Question ${number} : deux choix sont identiques.`;
    }
  }

  return '';
}

export function validateProgressiveQuiz(form, stages) {
  const basicError = validateBasics(form, 'diagnostic', { requireClass: false, requireSchedule: false });
  if (basicError) return basicError;

  const threshold = Number(form.stage_threshold);
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 20) {
    return 'Le seuil doit être un nombre entier compris entre 1 et 20.';
  }
  if (!Array.isArray(stages) || stages.length === 0) return 'Ajoutez au moins un stade.';

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
    const stage = stages[stageIndex];
    const number = stageIndex + 1;
    if (!stage.name?.trim()) return `Stade ${number} : donnez un nom au stade.`;

    const questions = (stage.questions || []).map((question) => question.trim()).filter(Boolean);
    if (questions.length === 0) return `Stade ${number} : ajoutez au moins une question.`;
    if (threshold > questions.length) {
      return `Stade ${number} : le seuil de ${threshold} « Oui » dépasse ses ${questions.length} question(s).`;
    }
    if (new Set(questions.map((question) => question.toLocaleLowerCase('fr'))).size !== questions.length) {
      return `Stade ${number} : deux questions sont identiques.`;
    }
  }

  return '';
}

export function canAdvanceProgressiveStage(score, threshold, requireStagePass = true) {
  return !requireStagePass || Number(score) < Number(threshold);
}

export function validateQuizImport(form) {
  const basicError = validateBasics(form);
  if (basicError) return basicError;
  if (!form.file) return 'Choisissez un fichier à importer.';
  if (form.file.size > MAX_FILE_SIZE) return 'Le fichier ne doit pas dépasser 10 Mo.';

  const extension = form.file.name?.split('.').pop()?.toLowerCase();
  if (!IMPORT_EXTENSIONS.includes(extension)) {
    return 'Format non pris en charge. Utilisez CSV, JSON, DOC, DOCX ou PDF.';
  }

  return '';
}
