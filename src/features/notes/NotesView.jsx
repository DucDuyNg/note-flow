import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import NoteContextMenu from './NoteContextMenu';
import EmptyState from '../../components/EmptyState';

export default function NotesView() {
  const notes = useAppStore((s) => s.notes);
  const { t } = useI18n();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [menuNote, setMenuNote] = useState(null);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? notes.filter((n) => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
      : notes;
    // Pinned first, then by updatedAt desc
    return [...filtered].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [notes, search]);

  const pinned = sorted.filter((n) => n.pinned);
  const others = sorted.filter((n) => !n.pinned);

  const openCreate = () => { setEditingId(null); setEditorOpen(true); };
  const openEdit = (id) => { setEditingId(id); setEditorOpen(true); };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">{t('notes.title')}</h1>
          <div className="page-header__subtitle">{t('notes.subtitle')}</div>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>+ {t('notes.addBtn')}</button>
      </header>

      {notes.length > 0 && (
        <div className="toolbar">
          <input
            className="input input--search"
            placeholder={t('notes.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {notes.length === 0 ? (
        <EmptyState
          title={t('notes.empty.title')}
          description={t('notes.empty.desc')}
          action={<button className="btn btn--primary" onClick={openCreate}>+ {t('notes.addBtn')}</button>}
        />
      ) : sorted.length === 0 ? (
        <EmptyState icon="🔍" title={t('notes.emptyFiltered')} />
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <div className="notes-section-label">📌 {t('notes.pinned')}</div>
              <div className="notes-grid">
                {pinned.map((n) => <NoteCard key={n.id} note={n} onOpen={openEdit} onLongPress={setMenuNote} />)}
              </div>
            </>
          )}
          {others.length > 0 && (
            <>
              {pinned.length > 0 && <div className="notes-section-label">{t('notes.others')}</div>}
              <div className="notes-grid">
                {others.map((n) => <NoteCard key={n.id} note={n} onOpen={openEdit} onLongPress={setMenuNote} />)}
              </div>
            </>
          )}
        </>
      )}

      <NoteEditor open={editorOpen} noteId={editingId} onClose={() => setEditorOpen(false)} />
      {menuNote && <NoteContextMenu note={menuNote} onClose={() => setMenuNote(null)} />}
    </>
  );
}
