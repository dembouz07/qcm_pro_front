// Parseur de QCM tolérant : accepte la plupart des formats (IA, Word, listes...).
// Retourne { questions: [{ body, points, explanation, choices:[{body,is_correct}], uncertain }], warnings: [] }

function cleanInline(s) {
  return String(s || '')
    .replace(/\*\*(.+?)\*\*/g, '$1') // gras markdown
    .replace(/__(.+?)__/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Détecte et retire un marqueur de bonne réponse dans le texte d'un choix
function stripCorrectMarker(raw) {
  let body = raw;
  let correct = false;

  const markers = [
    /\s*\(\s*(?:bonne\s*r[ée]ponse|correcte?|correct|vrai|true)\s*\)\s*$/i,
    /\s*\[\s*(?:bonne\s*r[ée]ponse|correcte?|correct|vrai|true)\s*\]\s*$/i,
    /\s*<-+\s*(?:correct|bonne)?\s*$/i,
    /\s*=+>\s*$/,
    /\s*✓\s*$/, /\s*✔\s*$/, /\s*☑\s*$/, /\s*✅\s*$/,
    /\s*\*\s*$/, // astérisque final
  ];
  for (const re of markers) {
    if (re.test(body)) { correct = true; body = body.replace(re, ''); }
  }
  // marqueur en début
  const lead = [/^✓\s*/, /^✔\s*/, /^☑\s*/, /^✅\s*/, /^\*\s*/];
  for (const re of lead) {
    if (re.test(body)) { correct = true; body = body.replace(re, ''); }
  }
  return { body: body.trim(), correct };
}

function letterToIndex(token) {
  const t = token.trim();
  if (/^\d+$/.test(t)) return parseInt(t, 10) - 1;      // "2" -> index 1
  if (/^[a-zA-Z]$/.test(t)) return t.toLowerCase().charCodeAt(0) - 97; // "B" -> 1
  return -1;
}

export function parseQuiz(text) {
  const warnings = [];
  const raw = String(text || '').replace(/\r\n?/g, '\n');
  const lines = raw.split('\n');

  const questions = [];
  let current = null;

  const RE_QNUM = /^\s*(?:Q(?:uestion)?\s*)?(\d+)\s*[\.\)\:\-–]\s*(.+)$/i;
  const RE_BRACKET = /^\s*\[\s*([xX*✓☑✔ ]?)\s*\]\s*(.+)$/;
  const RE_LETTER = /^\s*[\(\[]?\s*([a-zA-Z])\s*[\)\].:\-–]\s+(.+)$/;
  const RE_BULLET = /^\s*[-*•▪●·◦o]\s+(.+)$/;
  const RE_ANSWERKEY = /^\s*(?:bonnes?\s*r[ée]ponses?|r[ée]ponses?\s*(?:correctes?)?|correct(?:e|ion)?s?|answers?|solutions?)\s*[:=\-–]\s*(.+)$/i;

  function pushCurrent() {
    if (current && current.choices.length >= 1) {
      questions.push(current);
    }
    current = null;
  }

  function startQuestion(body) {
    pushCurrent();
    current = { body: cleanInline(body), points: 1, explanation: '', choices: [], uncertain: false };
  }

  function addChoice(body, correct) {
    if (!current) return;
    const c = stripCorrectMarker(body);
    current.choices.push({ body: cleanInline(c.body), is_correct: correct || c.correct });
  }

  function applyAnswerKey(spec) {
    if (!current || current.choices.length === 0) return;
    const tokens = spec.match(/[a-zA-Z]+|\d+/g) || [];
    let applied = false;
    tokens.forEach((tok) => {
      // ignorer les mots (ex: "la B") sauf lettres seules
      if (tok.length === 1 || /^\d+$/.test(tok)) {
        const idx = letterToIndex(tok);
        if (idx >= 0 && idx < current.choices.length) {
          current.choices[idx].is_correct = true;
          applied = true;
        }
      }
    });
    return applied;
  }

  for (let rawLine of lines) {
    const line = rawLine.replace(/\t/g, ' ').trimEnd();
    if (!line.trim()) continue;

    // 1) Ligne "Réponse: B"
    const ak = line.match(RE_ANSWERKEY);
    if (ak && current && current.choices.length > 0) {
      applyAnswerKey(ak[1]);
      continue;
    }

    // 2) Choix entre crochets [x]/[ ]
    const mb = line.match(RE_BRACKET);
    if (mb && current) {
      const mark = (mb[1] || '').trim();
      addChoice(mb[2], /[xX*✓☑✔]/.test(mark));
      continue;
    }

    // 3) Question numérotée "1." / "Q1:" / "Question 2 -"
    const mq = line.match(RE_QNUM);
    if (mq) {
      startQuestion(mq[2]);
      continue;
    }

    // 4) Choix avec lettre "A)" "a." "(b)"
    const ml = line.match(RE_LETTER);
    if (ml && current) {
      addChoice(ml[2], false);
      continue;
    }

    // 5) Choix à puce "- ..." "• ..."
    const mbul = line.match(RE_BULLET);
    if (mbul && current) {
      addChoice(mbul[1], false);
      continue;
    }

    // 6) Sinon : question (si ça finit par ? ou si pas de question en cours),
    //    ou continuation de l'énoncé.
    const looksQuestion = /\?\s*$/.test(line);
    if (!current) {
      startQuestion(line);
    } else if (current.choices.length > 0 || looksQuestion) {
      startQuestion(line);
    } else {
      // continuation de l'énoncé
      current.body = cleanInline(current.body + ' ' + line);
    }
  }
  pushCurrent();

  // Nettoyage / garde-fous
  const cleaned = questions.filter((q) => q.body && q.choices.length >= 1);
  cleaned.forEach((q, i) => {
    // dédupliquer une éventuelle bonne réponse multiple non voulue : on garde tout,
    // mais si aucune bonne réponse -> marquer incertain et cocher la 1re par défaut.
    if (!q.choices.some((c) => c.is_correct)) {
      q.choices[0].is_correct = true;
      q.uncertain = true;
      warnings.push(`Question ${i + 1} : bonne réponse non détectée, à vérifier.`);
    }
    if (q.choices.length < 2) {
      warnings.push(`Question ${i + 1} : moins de 2 choix détectés.`);
    }
  });

  return { questions: cleaned, warnings };
}
