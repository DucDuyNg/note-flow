import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';

/**
 * iOS-style centered context menu shown when the user long-presses (mobile)
 * or right-clicks (desktop) a note card. Currently exposes Pin/Unpin and
 * Delete actions — easy to extend later (Share, Duplicate, Move...).
 */
export default function NoteContextMenu({ note, onClose }) {
  const toggleNotePin = useAppStore((s) => s.toggleNotePin);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!note) return null;

  const handlePin = async () => {
    await toggleNotePin(note.id, !note.pinned);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm(t('notes.confirmDelete'))) return;
    await deleteNote(note.id);
    onClose();
  };

  return (
    <div className="note-context__backdrop" onClick={onClose}>
      <div className="note-context__menu" onClick={(e) => e.stopPropagation()} role="menu">
        <button
          className="note-context__item"
          onClick={handlePin}
          role="menuitem"
        >
          <span className="note-context__icon" aria-hidden="true">📌</span>
          <span>{note.pinned ? t('notes.unpin') : t('notes.pin')}</span>
        </button>

        <div className="note-context__divider" />

        <button
          className="note-context__item note-context__item--danger"
          onClick={handleDelete}
          role="menuitem"
        >
          <span className="note-context__icon" aria-hidden="true">🗑</span>
          <span>{t('common.delete')}</span>
        </button>
      </div>
    </div>
  );
}
