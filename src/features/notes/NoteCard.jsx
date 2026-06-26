import { useRef } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { formatRelative } from '../../lib/date';
import { Linkify } from '../../lib/linkify';

const PREVIEW_LIMIT = 140;
const LONG_PRESS_MS = 500;

/**
 * iOS-style note card. Tap → open editor. Long-press (mobile) or
 * right-click (desktop) → trigger context menu via onLongPress.
 */
export default function NoteCard({ note, onOpen, onLongPress }) {
  const { t, lang } = useI18n();
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const title = note.title?.trim() || t('notes.untitled');
  const preview = (note.content || '').slice(0, PREVIEW_LIMIT);
  const truncated = (note.content || '').length > PREVIEW_LIMIT;

  const start = () => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress?.(note);
    }, LONG_PRESS_MS);
  };
  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const handleClick = (e) => {
    if (firedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onOpen(note.id);
  };

  const handleContextMenu = (e) => {
    // Desktop right-click → trigger context menu
    e.preventDefault();
    onLongPress?.(note);
  };

  return (
    <article
      className={`note-card ${note.pinned ? 'is-pinned' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={start}
      onTouchEnd={cancel}
      onTouchMove={cancel}
      onTouchCancel={cancel}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
    >
      <div className="note-card__head">
        <div className="note-card__title">{title}</div>
        {note.pinned && (
          <span className="note-card__pin" aria-label={t('notes.pinned')}>📌</span>
        )}
      </div>
      {preview && (
        <div className="note-card__body">
          <Linkify text={preview} stopPropagation />
          {truncated && '…'}
        </div>
      )}
      <div className="note-card__footer">
        {formatRelative(note.updatedAt, lang)}
      </div>
    </article>
  );
}
