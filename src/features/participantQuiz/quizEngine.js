export function isAnswered(value) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
}

export function toggleAnswer(answers, questionId, choiceId, multiple = false) {
  if (!multiple) return { ...answers, [questionId]: choiceId };

  const current = Array.isArray(answers[questionId])
    ? answers[questionId]
    : (isAnswered(answers[questionId]) ? [answers[questionId]] : []);
  const next = current.includes(choiceId)
    ? current.filter((id) => id !== choiceId)
    : [...current, choiceId];

  return { ...answers, [questionId]: next };
}

export function countAnswered(questions = [], answers = {}) {
  return questions.reduce(
    (count, question) => count + (isAnswered(answers[question.id]) ? 1 : 0),
    0,
  );
}

export function firstUnansweredIndex(questions = [], answers = {}) {
  const index = questions.findIndex((question) => !isAnswered(answers[question.id]));
  return index === -1 ? Math.max(questions.length - 1, 0) : index;
}

export function answerLabels(question, value) {
  const selected = Array.isArray(value) ? value : (isAnswered(value) ? [value] : []);
  return (question?.choices || [])
    .filter((choice) => selected.includes(choice.id))
    .map((choice) => choice.body);
}

export function sanitizeAnswers(questions = [], answers = {}) {
  return questions.reduce((sanitized, question) => {
    const value = answers[question.id];
    const validChoiceIds = new Set((question.choices || []).map((choice) => String(choice.id)));

    if (question.multiple) {
      const selected = Array.isArray(value) ? value : (isAnswered(value) ? [value] : []);
      const validSelected = selected.filter((choiceId) => validChoiceIds.has(String(choiceId)));
      if (validSelected.length > 0) sanitized[question.id] = validSelected;
    } else if (!Array.isArray(value) && isAnswered(value) && validChoiceIds.has(String(value))) {
      sanitized[question.id] = value;
    }

    return sanitized;
  }, {});
}

export function reorderBySavedIds(items = [], savedIds = []) {
  if (!Array.isArray(savedIds) || savedIds.length === 0) return items;

  const byId = new Map(items.map((item) => [String(item.id), item]));
  const ordered = savedIds.map((id) => byId.get(String(id))).filter(Boolean);
  const present = new Set(ordered.map((item) => String(item.id)));
  return [...ordered, ...items.filter((item) => !present.has(String(item.id)))];
}

export function restoreQuizOrder(quiz, savedOrder) {
  if (!quiz || !savedOrder) return quiz;
  const questions = reorderBySavedIds(quiz.questions, savedOrder.questionIds);

  return {
    ...quiz,
    questions: questions.map((question) => ({
      ...question,
      choices: reorderBySavedIds(
        question.choices,
        savedOrder.choiceIdsByQuestion?.[question.id],
      ),
    })),
  };
}

export function captureQuizOrder(quiz) {
  return {
    questionIds: (quiz?.questions || []).map((question) => question.id),
    choiceIdsByQuestion: Object.fromEntries(
      (quiz?.questions || []).map((question) => [
        question.id,
        (question.choices || []).map((choice) => choice.id),
      ]),
    ),
  };
}
