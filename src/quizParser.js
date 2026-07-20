// Parseur de QCM tolérant : accepte la plupart des formats (IA, Word, PDF, listes...).
// Deux stratégies sont essayées (blob "A. B. C. D." et ligne par ligne), on garde la meilleure.
// Retour : { questions: [{ body, points, explanation, choices:[{body,is_correct}], uncertain }], warnings: [] }

function cleanInline(s) {
  return String(s || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAnswerLetters(value) {
  return [...String(value || '').matchAll(/(?<![A-Za-zÀ-ÿ])([A-E])(?![A-Za-zÀ-ÿ])/gi)]
    .map((match) => match[1].toUpperCase());
}

// Détecte et retire un marqueur de bonne réponse dans le texte d'un choix
function stripCorrectMarker(raw) {
  let body = String(raw || '');
  let correct = false;
  const trailing = [
    /\s*\(\s*(?:bonne(?:\s*r[ée]ponse)?|correcte?|correct|vrai|true|juste)\s*\)\s*$/i,
    /\s*\[\s*(?:bonne(?:\s*r[ée]ponse)?|correcte?|correct|vrai|true|juste)\s*\]\s*$/i,
    /\s*<-+\s*(?:correct|bonne)?\s*$/i,
    /\s*=+>\s*$/, /\s*✓\s*$/, /\s*✔\s*$/, /\s*☑\s*$/, /\s*✅\s*$/, /\s*\*\s*$/,
  ];
  for (const re of trailing) if (re.test(body)) { correct = true; body = body.replace(re, ''); }
  const leading = [/^✓\s*/, /^✔\s*/, /^☑\s*/, /^✅\s*/, /^\*\s*/];
  for (const re of leading) if (re.test(body)) { correct = true; body = body.replace(re, ''); }
  return { body: body.trim(), correct };
}

// Découpe un bloc en { body, choices[] } en cherchant des libellés A/B/C/D/E séquentiels.
function splitChoicesFromChunk(chunk) {
  const re = /([A-Ea-e])[.)]\s+/g;
  const marks = [...chunk.matchAll(re)];
  // ne garder que les libellés séquentiels A,B,C... (évite les faux positifs)
  const seq = [];
  let expected = 0;
  for (const m of marks) {
    const idx = m[1].toUpperCase().charCodeAt(0) - 65;
    if (idx === expected) { seq.push(m); expected++; }
  }
  if (seq.length < 2) return null;
  const body = chunk.slice(0, seq[0].index).trim();
  const choices = [];
  for (let i = 0; i < seq.length; i++) {
    const start = seq[i].index + seq[i][0].length;
    const end = i + 1 < seq.length ? seq[i + 1].index : chunk.length;
    const b = chunk.slice(start, end).trim();
    if (b) choices.push(b);
  }
  return { body, choices };
}

function applyAnswerKey(chunk) {
  const ak = chunk.match(
    /(?:bonnes?\s*r[ée]ponses?|r[ée]ponses?(?:\s*correctes?)?|correct[e]?s?|answers?|solutions?)\s*[:=]\s*([A-Ea-e](?:\s*(?:,|;|\/|et|ou|and|or|&)\s*[A-Ea-e])*)/i,
  );
  if (!ak) return { chunk, letters: [] };
  const letters = extractAnswerLetters(ak[1]);
  return { chunk: chunk.slice(0, ak.index).trim(), letters };
}

// Stratégie "blob" : tout le texte -> découpe par numéros de question séquentiels.
function parseCollapsed(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return { questions: [] };

  const numRe = /(\d{1,2})[.)]\s+/g;
  const all = [...s.matchAll(numRe)];
  const qmarks = [];
  let exp = 1;
  for (const m of all) {
    if (parseInt(m[1], 10) === exp) { qmarks.push(m); exp++; }
  }
  if (qmarks.length === 0) return { questions: [] };

  const questions = [];
  for (let i = 0; i < qmarks.length; i++) {
    const start = qmarks[i].index + qmarks[i][0].length;
    const end = i + 1 < qmarks.length ? qmarks[i + 1].index : s.length;
    let chunk = s.slice(start, end).trim();

    const ak = applyAnswerKey(chunk);
    chunk = ak.chunk;

    const parsed = splitChoicesFromChunk(chunk);
    if (!parsed) {
      questions.push({ body: cleanInline(chunk), points: 1, explanation: '', choices: [], uncertain: true });
      continue;
    }
    const choices = parsed.choices.map((b) => {
      const c = stripCorrectMarker(b);
      return { body: cleanInline(c.body), is_correct: c.correct };
    });
    ak.letters.forEach((L) => {
      const idx = L.charCodeAt(0) - 65;
      if (idx >= 0 && idx < choices.length) choices[idx].is_correct = true;
    });
    questions.push({ body: cleanInline(parsed.body), points: 1, explanation: '', choices, uncertain: false });
  }
  return { questions };
}

// Stratégie "ligne par ligne" : pour les formats [x]/[ ], puces, un choix par ligne, "Réponse: B".
function parseLineBased(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n');
  const lines = raw.split('\n').map((l) => l.replace(/\t/g, ' ').trim()).filter(Boolean);

  const questions = [];
  let current = null;

  const RE_QNUM = /^(?:Q(?:uestion)?\s*)?(\d{1,2})\s*[.)\:\-–]\s*(.+)$/i;
  const RE_ANSWERKEY = /^(?:bonnes?\s*r[ée]ponses?|r[ée]ponses?(?:\s*correctes?)?|correct[e]?s?|answers?|solutions?)\s*[:=\-–]\s*(.+)$/i;
  const RE_BRACKET = /^\[\s*([xX*✓☑✔ ]?)\s*\]\s*(.+)$/;
  const RE_ONE_LETTER = /^[\(\[]?\s*([a-zA-Z])\s*[\)\].:\-–]\s+(.+)$/;
  const RE_BULLET = /^[-*•▪●·◦]\s+(.+)$/;

  const push = () => { if (current && current.body) questions.push(current); current = null; };
  const startQ = (b) => { push(); current = { body: cleanInline(b), points: 1, explanation: '', choices: [], uncertain: false }; };
  const addChoice = (b, correct = false) => {
    if (!current) return;
    const c = stripCorrectMarker(b);
    current.choices.push({ body: cleanInline(c.body), is_correct: correct || c.correct });
  };
  const appendLastChoice = (t) => {
    const last = current.choices[current.choices.length - 1];
    last.body = cleanInline(last.body + ' ' + t);
  };

  for (const line of lines) {
    const ak = line.match(RE_ANSWERKEY);
    if (ak && current && current.choices.length) {
      extractAnswerLetters(ak[1]).forEach((L) => {
        const idx = L.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < current.choices.length) current.choices[idx].is_correct = true;
      });
      continue;
    }
    const mb = line.match(RE_BRACKET);
    if (mb && current) { addChoice(mb[2], /[xX*✓☑✔]/.test((mb[1] || '').trim())); continue; }

    const mq = line.match(RE_QNUM);
    if (mq) {
      startQ(mq[2]);
      const inline = splitChoicesFromChunk(mq[2]);
      if (inline) { current.body = cleanInline(inline.body); inline.choices.forEach((c) => addChoice(c)); }
      continue;
    }

    // Ligne avec plusieurs choix "A. x B. y ..."
    const multi = splitChoicesFromChunk(line);
    if (multi && current) {
      if (multi.body) { if (current.choices.length) appendLastChoice(multi.body); else current.body = cleanInline(current.body + ' ' + multi.body); }
      multi.choices.forEach((c) => addChoice(c));
      continue;
    }

    const ml = line.match(RE_ONE_LETTER);
    if (ml && current) { addChoice(ml[2]); continue; }
    const mbul = line.match(RE_BULLET);
    if (mbul && current) { addChoice(mbul[1]); continue; }

    if (!current) {
      if (line.endsWith('?')) startQ(line);
      continue; // ignore les titres
    }
    if (current.choices.length) appendLastChoice(line);
    else current.body = cleanInline(current.body + ' ' + line);
  }
  push();
  return { questions };
}

export function parseQuiz(text) {
  const warnings = [];
  const a = parseCollapsed(text);
  const b = parseLineBased(text);
  const score = (r) => r.questions.filter((q) => q.choices.length >= 2).length;
  const best = score(a) >= score(b) ? a : b;

  const cleaned = best.questions.filter((q) => q.body && q.choices.length >= 1);
  cleaned.forEach((q, i) => {
    if (!q.choices.some((c) => c.is_correct)) {
      q.uncertain = true;
      warnings.push(`Question ${i + 1} : bonne réponse non détectée, à vérifier.`);
    }
    if (q.choices.length < 2) warnings.push(`Question ${i + 1} : moins de 2 choix détectés.`);
  });

  return { questions: cleaned, warnings };
}
