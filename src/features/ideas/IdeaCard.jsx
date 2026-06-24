import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import { formatRelative } from '../../lib/date';

export default function IdeaCard({ idea, onEdit }) {
  const deleteIdea = useAppStore((s) => s.deleteIdea);
  const { t, lang } = useI18n();
  return (
    <article className="card idea-card">
      <div className="idea-card__title">{idea.title}</div>
      {idea.content && <div className="idea-card__body">{idea.content}</div>}
      <div className="task-card__meta">
        <span className={`badge badge--category-${idea.category}`}>{t(`category.${idea.category}`)}</span>
        {idea.tags?.map((tag) => (
          <span key={tag} className="badge">#{tag}</span>
        ))}
      </div>
      <div className="idea-card__footer">
        <span>{formatRelative(idea.updatedAt, lang)}</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn--sm btn--ghost" onClick={() => onEdit(idea)}>{t('common.edit')}</button>
          <button
            className="btn btn--sm btn--ghost btn--danger"
            onClick={() => { if (confirm(t('ideas.confirmDelete'))) deleteIdea(idea.id); }}
          >
            {t('common.delete')}
          </button>
        </span>
      </div>
    </article>
  );
}
