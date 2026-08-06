const ACADEMIC_YEAR_PATTERN = /^(\d{4})-(\d{4})$/;

export function isValidAcademicYear(value) {
  const match = String(value ?? '').trim().match(ACADEMIC_YEAR_PATTERN);
  return Boolean(match) && Number(match[2]) === Number(match[1]) + 1;
}

export function getCurrentAcademicYear(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('Une date valide est requise.');
  }

  const calendarYear = date.getFullYear();
  const startYear = date.getMonth() >= 7 ? calendarYear : calendarYear - 1;
  return `${startYear}-${startYear + 1}`;
}

export function formatClassLabel(schoolClass, fallback = 'Sans classe') {
  const name = String(schoolClass?.name ?? '').trim() || fallback;
  const academicYear = String(schoolClass?.academic_year ?? '').trim();

  return isValidAcademicYear(academicYear) ? `${name} · ${academicYear}` : name;
}

export function getAcademicYearOptions(classes = [], currentAcademicYear = getCurrentAcademicYear()) {
  const years = new Set();

  if (isValidAcademicYear(currentAcademicYear)) {
    years.add(currentAcademicYear);
  }

  classes.forEach((schoolClass) => {
    const academicYear = String(schoolClass?.academic_year ?? '').trim();
    if (isValidAcademicYear(academicYear)) {
      years.add(academicYear);
    }
  });

  return [...years].sort((a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4)));
}
