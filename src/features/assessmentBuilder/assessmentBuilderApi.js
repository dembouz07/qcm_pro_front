import api from '../../api.js';
import {
  ASSESSMENT_BUILDER_SCHEMA_VERSION,
  serializeDraftDocument,
} from './assessmentBuilderModel.js';

const DRAFTS_ENDPOINT = '/admin/quiz-drafts';

export async function listAssessmentDrafts() {
  const response = await api.get(DRAFTS_ENDPOINT);
  return response.data?.data || response.data || [];
}

export async function getAssessmentDraft(draftId) {
  const response = await api.get(`${DRAFTS_ENDPOINT}/${draftId}`);
  return response.data;
}

export async function findAssessmentDraft({ mode, quizId = null }) {
  const drafts = await listAssessmentDrafts();
  const normalizedQuizId = quizId === null ? null : Number(quizId);
  return drafts.find((draft) => (
    draft.mode === mode
    && (draft.quiz_id === null ? null : Number(draft.quiz_id)) === normalizedQuizId
    && !draft.published_at
  )) || null;
}

function draftBody(document, quizId, baseQuizVersion = null) {
  const body = {
    mode: document.type,
    schema_version: ASSESSMENT_BUILDER_SCHEMA_VERSION,
    quiz_id: quizId === null || quizId === undefined ? null : Number(quizId),
    payload: serializeDraftDocument(document),
  };
  if (body.quiz_id !== null && baseQuizVersion) body.base_quiz_version = baseQuizVersion;
  return body;
}

export async function createAssessmentDraft(document, quizId = null, baseQuizVersion = null) {
  const response = await api.post(DRAFTS_ENDPOINT, draftBody(document, quizId, baseQuizVersion));
  return response.data;
}

export async function updateAssessmentDraft(draft, document, quizId = null) {
  const response = await api.put(`${DRAFTS_ENDPOINT}/${draft.id}`, {
    ...draftBody(document, quizId),
    revision: draft.revision,
  });
  return response.data;
}

export async function publishAssessmentDraft(draft) {
  const response = await api.post(`${DRAFTS_ENDPOINT}/${draft.id}/publish`, {
    revision: draft.revision,
  });
  return response.data;
}

export async function deleteAssessmentDraft(draftId) {
  if (draftId === null || draftId === undefined) return;
  await api.delete(`${DRAFTS_ENDPOINT}/${draftId}`);
}

export async function parseAssessmentImport(file) {
  const payload = new FormData();
  payload.append('file', file);
  const response = await api.post(`${DRAFTS_ENDPOINT}/import`, payload, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
}

export function readDraftConflict(error) {
  const data = error?.response?.data;
  if (error?.response?.status !== 409) return null;
  if (data?.code === 'quiz_changed_before_draft') {
    return {
      kind: 'source',
      message: data.message || 'L’évaluation d’origine a changé avant la création du brouillon.',
      currentQuizUpdatedAt: data.current_quiz_updated_at || null,
      canDuplicate: data.can_duplicate !== false,
      suggestedAction: data.suggested_action || 'reload_or_duplicate',
    };
  }
  if (data?.code !== 'draft_revision_conflict') return null;
  return {
    kind: 'revision',
    message: data.message || 'Ce brouillon a été modifié dans un autre onglet.',
    currentRevision: data.current_revision,
    expectedRevision: data.expected_revision,
    remoteDraft: data.draft,
    canDuplicate: data.can_duplicate !== false,
    suggestedAction: data.suggested_action || 'duplicate_or_version',
  };
}
