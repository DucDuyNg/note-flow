import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import { formatDate, isOverdue } from '../../lib/date';

export default function TaskCard({ task, onEdit }) {
  const deleteTask = useAppStore((s) => s.deleteTask);
  const setTaskStatus = useAppStore((s) => s.setTaskStatus);
  const project = useAppStore((s) => s.projects.find((p) => p.id === task.projectId));
  const { t, lang } = useI18n();

  const next = task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo';
  const nextLabelKey = task.status === 'todo' ? 'tasks.card.start' : task.status === 'doing' ? 'tasks.card.complete' : 'tasks.card.reopen';
  const overdue = task.dueDate && task.status !== 'done' && isOverdue(task.dueDate);

  return (
    <article className="card task-card">
      <div className={`task-card__title ${task.status === 'done' ? 'is-done' : ''}`}>{task.title}</div>
      {task.description && <div className="task-card__desc">{task.description}</div>}
      <div className="task-card__meta">
        <span className={`badge badge--priority-${task.priority}`}>{t(`priority.${task.priority}`)}</span>
        <span className={`badge badge--category-${task.category}`}>{t(`category.${task.category}`)}</span>
        {project && (
          <span className="badge" style={{ background: `${project.color}22`, color: project.color }}>
            {project.name}
          </span>
        )}
        {task.dueDate && (
          <span className={`badge ${overdue ? 'badge--due-overdue' : ''}`}>
            {overdue ? t('tasks.card.overduePrefix') : ''}{formatDate(task.dueDate, lang)}
          </span>
        )}
      </div>
      <div className="task-card__actions">
        <button className="btn btn--sm" onClick={() => setTaskStatus(task.id, next)}>{t(nextLabelKey)}</button>
        <button className="btn btn--sm btn--ghost" onClick={() => onEdit(task)}>{t('common.edit')}</button>
        <button
          className="btn btn--sm btn--ghost btn--danger"
          onClick={() => { if (confirm(t('tasks.confirmDelete'))) deleteTask(task.id); }}
          style={{ marginLeft: 'auto' }}
        >
          {t('common.delete')}
        </button>
      </div>
    </article>
  );
}
