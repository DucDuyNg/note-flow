import { collection, doc } from 'firebase/firestore';
import { db } from './firebase';

export const PERSONAL_WORKSPACE = 'personal';

/**
 * Returns the base path segments for the given workspace.
 *   personal → ['users', uid]
 *   team     → ['teams', teamId]
 */
export function basePath(uid, workspaceId) {
  if (!workspaceId || workspaceId === PERSONAL_WORKSPACE) {
    return ['users', uid];
  }
  return ['teams', workspaceId];
}

export function workspaceCol(uid, workspaceId, colName) {
  return collection(db, ...basePath(uid, workspaceId), colName);
}

export function workspaceDoc(uid, workspaceId, colName, docId) {
  return doc(db, ...basePath(uid, workspaceId), colName, docId);
}
