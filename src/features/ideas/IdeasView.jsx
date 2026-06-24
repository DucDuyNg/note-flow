import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import IdeaCard from './IdeaCard';
import IdeaForm from './IdeaForm';
import EmptyState from '../../components/EmptyState';

export default function IdeasView() {
  const ideas = useAppStore((s) => s.ideas);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    return ideas.filter((i) => {
      if (filters.category !== 'all' && i.category !== filters.category) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inTags = i.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (!i.title.toLowerCase().includes(q) && !i.content.toLowerCase().includes(q) && !inTags) return false;
      }
      return true;
    });
  }, [ideas, filters]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (idea) => { setEditing(idea); setFormOpen(true); };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">{t('ideas.title')}</h1>
          <div className="page-header__subtitle">{t('ideas.subtitle')}</div>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>{t('ideas.addBtn')}</button>
      </header>

      <div className="toolbar">
        <input
          className="input input--search"
          placeholder={t('ideas.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />
        <button
          className={`chip ${filters.category === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilters({ category: 'all' })}
        >{t('common.all')}</button>
        <button
          className={`chip ${filters.category === 'work' ? 'is-active' : ''}`}
          onClick={() => setFilters({ category: 'work' })}
        >{t('category.work')}</button>
        <button
          className={`chip ${filters.category === 'personal' ? 'is-active' : ''}`}
          onClick={() => setFilters({ category: 'personal' })}
        >{t('category.personal')}</button>
      </div>

      {ideas.length === 0 ? (
        <EmptyState
          icon="💡"
          title={t('ideas.empty.title')}
          description={t('ideas.empty.desc')}
          action={<button className="btn btn--primary" onClick={openCreate}>{t('ideas.addBtn')}</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title={t('ideas.emptyFiltered')} />
      ) : (
        <div className="idea-grid">
          {filtered.map((idea) => <IdeaCard key={idea.id} idea={idea} onEdit={openEdit} />)}
        </div>
      )}

      <IdeaForm open={formOpen} onClose={() => setFormOpen(false)} initialIdea={editing} />
    </>
  );
}
