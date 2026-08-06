export function toLocalDateValue(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function filterGradeResults(results, { classId = '', quizId = '', submittedDate = '' } = {}) {
  if (!Array.isArray(results)) return [];

  return results.filter((result) => {
    if (classId !== '') {
      const resultClassId = result.quiz?.school_class?.id ?? result.quiz?.school_class_id;
      if (Number(resultClassId) !== Number(classId)) return false;
    }

    if (quizId !== '' && Number(result.quiz?.id) !== Number(quizId)) {
      return false;
    }

    if (submittedDate !== '' && toLocalDateValue(result.submitted_at) !== submittedDate) {
      return false;
    }

    return true;
  });
}
