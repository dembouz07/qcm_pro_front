import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiError } from '../../api.js';
import {
  createAssessmentDraft,
  readDraftConflict,
  updateAssessmentDraft,
} from './assessmentBuilderApi.js';
import { normalizeDraftDocument, serializeDraftDocument } from './assessmentBuilderModel.js';

function signature(document) {
  return JSON.stringify(serializeDraftDocument(document));
}

export default function useAssessmentBuilder({ initialDocument, initialDraft = null, quizId = null, sourceQuizVersion = null }) {
  const navigate = useNavigate();
  const [document, setDocumentState] = useState(initialDocument);
  const [draft, setDraftState] = useState(initialDraft);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState(initialDraft ? 'saved' : 'idle');
  const [saveError, setSaveError] = useState('');
  const [conflict, setConflict] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(initialDraft?.updated_at || null);
  const [navigationAllowed, setNavigationAllowed] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const documentRef = useRef(initialDocument);
  const draftRef = useRef(initialDraft);
  const savePromiseRef = useRef(null);
  const activeQuizIdRef = useRef(initialDraft?.quiz_id ?? quizId);
  const sourceQuizVersionRef = useRef(sourceQuizVersion);
  const lastSavedSignatureRef = useRef(initialDraft ? signature(initialDocument) : '');

  const setDocument = useCallback((updater) => {
    setDocumentState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      documentRef.current = next;
      setNavigationAllowed(false);
      const changed = signature(next) !== lastSavedSignatureRef.current;
      setDirty(changed);
      setSaveStatus(changed ? 'dirty' : 'saved');
      setSaveError('');
      return next;
    });
  }, []);

  const saveDraft = useCallback(async ({ duplicate = false } = {}) => {
    if (savePromiseRef.current && !duplicate) return savePromiseRef.current;
    const snapshot = documentRef.current;
    const snapshotSignature = signature(snapshot);
    setSaveStatus('saving');
    setSaveError('');
    setConflict(null);

    const request = (async () => {
      try {
        const requestQuizId = duplicate ? null : activeQuizIdRef.current;
        let savedDraft;
        if (duplicate || !draftRef.current) {
          const initialSourceVersion = requestQuizId === null ? null : sourceQuizVersionRef.current;
          savedDraft = initialSourceVersion
            ? await createAssessmentDraft(snapshot, requestQuizId, initialSourceVersion)
            : await createAssessmentDraft(snapshot, requestQuizId);
        } else {
          savedDraft = await updateAssessmentDraft(draftRef.current, snapshot, requestQuizId);
        }
        if (duplicate) {
          activeQuizIdRef.current = null;
          sourceQuizVersionRef.current = null;
        }
        draftRef.current = savedDraft;
        setDraftState(savedDraft);
        lastSavedSignatureRef.current = snapshotSignature;
        const stillCurrent = signature(documentRef.current) === snapshotSignature;
        setDirty(!stillCurrent);
        setSaveStatus(stillCurrent ? 'saved' : 'dirty');
        setLastSavedAt(savedDraft.updated_at || new Date().toISOString());
        return savedDraft;
      } catch (error) {
        const draftConflict = readDraftConflict(error);
        if (draftConflict) {
          setConflict(draftConflict);
          setSaveStatus('conflict');
        } else {
          setSaveError(getApiError(error));
          setSaveStatus('error');
        }
        throw error;
      } finally {
        savePromiseRef.current = null;
      }
    })();

    savePromiseRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    if (!dirty || ['saving', 'conflict', 'error'].includes(saveStatus)) return undefined;
    const timeout = window.setTimeout(() => {
      void saveDraft().catch(() => {});
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [dirty, document, saveDraft, saveStatus]);

  const hasUnsavedChanges = dirty || ['saving', 'error', 'conflict'].includes(saveStatus);

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!hasUnsavedChanges || navigationAllowed) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges, navigationAllowed]);

  useEffect(() => {
    if (!hasUnsavedChanges || navigationAllowed) return undefined;

    function guardInternalLink(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin) return;
      const nextPath = `${target.pathname}${target.search}${target.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currentPath) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation(nextPath);
    }

    function guardHistoryNavigation() {
      if (window.confirm('Quitter avec des changements non enregistrés ?')) {
        setNavigationAllowed(true);
      } else {
        window.history.go(1);
      }
    }

    window.document.addEventListener('click', guardInternalLink, true);
    window.addEventListener('popstate', guardHistoryNavigation);
    return () => {
      window.document.removeEventListener('click', guardInternalLink, true);
      window.removeEventListener('popstate', guardHistoryNavigation);
    };
  }, [hasUnsavedChanges, navigationAllowed]);

  const resetPendingNavigation = useCallback(() => setPendingNavigation(null), []);
  const proceedPendingNavigation = useCallback(() => {
    if (!pendingNavigation) return;
    setNavigationAllowed(true);
    const target = pendingNavigation;
    setPendingNavigation(null);
    navigate(target);
  }, [navigate, pendingNavigation]);

  const blocker = {
    state: pendingNavigation ? 'blocked' : 'unblocked',
    reset: resetPendingNavigation,
    proceed: proceedPendingNavigation,
  };

  const useRemoteDraft = useCallback(() => {
    if (!conflict?.remoteDraft) return;
    const nextDocument = normalizeDraftDocument(conflict.remoteDraft);
    documentRef.current = nextDocument;
    draftRef.current = conflict.remoteDraft;
    activeQuizIdRef.current = conflict.remoteDraft.quiz_id ?? null;
    lastSavedSignatureRef.current = signature(nextDocument);
    setDocumentState(nextDocument);
    setDraftState(conflict.remoteDraft);
    setDirty(false);
    setConflict(null);
    setSaveError('');
    setSaveStatus('saved');
    setLastSavedAt(conflict.remoteDraft.updated_at || new Date().toISOString());
  }, [conflict]);

  const duplicateDraft = useCallback(async () => {
    try {
      const savedDraft = await saveDraft({ duplicate: true });
      setConflict(null);
      return savedDraft;
    } catch (error) {
      throw error;
    }
  }, [saveDraft]);

  const acceptServerDraft = useCallback((serverDraft) => {
    if (!serverDraft) return;
    draftRef.current = serverDraft;
    activeQuizIdRef.current = serverDraft.quiz_id ?? activeQuizIdRef.current;
    setDraftState(serverDraft);
    lastSavedSignatureRef.current = signature(documentRef.current);
    setDirty(false);
    setConflict(null);
    setSaveError('');
    setSaveStatus('saved');
    setLastSavedAt(serverDraft.updated_at || new Date().toISOString());
  }, []);

  const allowNavigation = useCallback(() => setNavigationAllowed(true), []);

  return {
    document,
    setDocument,
    draft,
    dirty,
    saveStatus,
    saveError,
    conflict,
    lastSavedAt,
    saveDraft,
    useRemoteDraft,
    duplicateDraft,
    acceptServerDraft,
    hasUnsavedChanges,
    blocker,
    allowNavigation,
  };
}
