import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import { formatRelative } from '../../lib/date';
import { extractUrls, Linkify } from '../../lib/linkify';
import { PiLinkSimpleHorizontalBold } from "react-icons/pi";
/**
 * Full-screen note editor with debounced auto-save.
 *
 * Lifecycle:
 *   - When opened with a noteId → loads from store, auto-saves on edit.
 *   - When opened without noteId (create mode) → pre-creates an empty note
 *     and switches to edit mode so further edits update the same doc.
 *   - On close: if title + content are both empty, deletes the doc so we
 *     don't leave blank notes around.
 */
export default function NoteEditor({ open, noteId, onClose }) {
  const note = useAppStore((s) => s.notes.find((n) => n.id === noteId));
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const { t, lang } = useI18n();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeId, setActiveId] = useState(noteId || null);
  const [status, setStatus] = useState(null); // 'saving' | 'saved' | null
  const [editing, setEditing] = useState(false); // view (false) vs edit (true)
  const initialRef = useRef({ title: '', content: '' });
  const contentRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (!open) return;
    if (noteId && note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setActiveId(noteId);
      initialRef.current = { title: note.title || '', content: note.content || '' };
      // Existing note with content → start in view mode so links are clickable
      setEditing(!(note.content && note.content.trim().length > 0));
    } else if (!noteId) {
      // create mode: pre-create empty note + go straight into edit mode
      setTitle('');
      setContent('');
      setActiveId(null);
      initialRef.current = { title: '', content: '' };
      setEditing(true);
      addNote({}).then((id) => setActiveId(id));
    }
  }, [open, noteId]);

  // Auto-save with debounce. The actual Firestore write is fire-and-forget —
  // offline persistence queues it to IndexedDB immediately and syncs in the
  // background, so we don't await.
  useEffect(() => {
    if (!open || !activeId) return;
    const changed = title !== initialRef.current.title || content !== initialRef.current.content;
    if (!changed) return;
    setStatus('saving');
    let fadeTimer = null;
    const saveTimer = setTimeout(() => {
      updateNote(activeId, { title, content });
      initialRef.current = { title, content };
      setStatus('saved');
      fadeTimer = setTimeout(() => setStatus(null), 1500);
    }, 600);
    return () => {
      clearTimeout(saveTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [title, content, activeId, open, updateNote]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, content, activeId]);

  // Close is synchronous — we fire writes without awaiting so the modal
  // closes instantly. Firestore offline persistence guarantees the write
  // (or delete) eventually lands.
  const handleClose = () => {
    if (activeId) {
      if (!title.trim() && !content.trim()) {
        deleteNote(activeId);
      } else {
        const changed = title !== initialRef.current.title || content !== initialRef.current.content;
        if (changed) updateNote(activeId, { title, content });
      }
    }
    onClose();
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enterEditMode();
    }
  };

  const enterEditMode = () => {
    setEditing(true);
    // Focus textarea on next tick (after it mounts)
    setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      el.focus();
      // Put cursor at end of content
      const pos = el.value.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleContentBlur = () => {
    // Return to view mode when leaving textarea — only if content is non-empty,
    // so empty new notes don't flicker.
    if (content.trim()) setEditing(false);
  };

  // URLs detected in the current content — dedup, keep order.
  const links = useMemo(() => {
    const all = extractUrls(content);
    return [...new Set(all)];
  }, [content]);

  const hostFor = (url) => {
    try { return new URL(url.startsWith('www.') ? `https://${url}` : url).hostname.replace(/^www\./, ''); }
    catch { return url; }
  };

  if (!open) return null;

  return (
    <div className="note-editor__backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="note-editor" role="dialog" aria-modal="true">
        <header className="note-editor__header">
          <button className="note-editor__back" onClick={handleClose} aria-label={t('common.close')}>
            ‹
          </button>
          <div className="note-editor__status">
            {status === 'saving' && t('notes.editor.saving')}
            {status === 'saved' && `✓ ${t('notes.editor.saved')}`}
            {!status && note?.updatedAt && t('notes.editor.lastEdited', { time: formatRelative(note.updatedAt, lang) })}
          </div>
          <button
            className="note-editor__done"
            onClick={handleClose}
            aria-label={t('notes.editor.done')}
            title={t('notes.editor.done')}
          >
            ✓
          </button>
        </header>

        <input
          className="note-editor__title"
          placeholder={t('notes.editor.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          autoFocus={!noteId}
        />

        {editing ? (
          <textarea
            ref={contentRef}
            className="note-editor__content"
            placeholder={t('notes.editor.contentPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
          />
        ) : (
          <div
            className="note-editor__content note-editor__content--view"
            onClick={(e) => {
              // Don't switch to edit mode when clicking on a link
              if (e.target.closest('a')) return;
              enterEditMode();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') enterEditMode(); }}
          >
            {content
              ? <Linkify text={content} />
              : <span className="note-editor__placeholder">{t('notes.editor.contentPlaceholder')}</span>}
          </div>
        )}

        {links.length > 0 && (
          <div className="note-editor__links">
            <div className="note-editor__links-label"><PiLinkSimpleHorizontalBold /><span>{t('notes.editor.links')}</span></div>
            <div className="note-editor__links-list">
              {links.map((url) => (
                <a
                  key={url}
                  href={url.startsWith('www.') ? `https://${url}` : url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="note-editor__link-chip"
                  title={url}
                >
                  {hostFor(url)}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
