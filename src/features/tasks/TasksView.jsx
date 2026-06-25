import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import EmptyState from '../../components/EmptyState';

// Status toggles shown as the 4 stat cards. First entry is the default.
const STATUS_TOGGLES = [
  { key: 'all', labelKey: 'tasks.stats.total', countKey: 'total' },
  { key: 'todo', labelKey: 'tasks.stats.todo', countKey: 'todo', color: 'var(--color-todo)' },
  { key: 'doing', labelKey: 'tasks.stats.doing', countKey: 'doing', color: 'var(--color-doing)' },
  { key: 'done', labelKey: 'tasks.stats.done', countKey: 'done', color: 'var(--color-done)' },
];

export default function TasksView() {
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const statusFilter = filters.status || 'all';

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (filters.category !== 'all' && task.category !== filters.category) return false;
      if (filters.projectId !== 'all' && task.projectId !== filters.projectId) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, filters, statusFilter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    doing: tasks.filter((task) => task.status === 'doing').length,
    done: tasks.filter((task) => task.status === 'done').length,
  }), [tasks]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (task) => { setEditing(task); setFormOpen(true); };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">{t('tasks.title')}</h1>
          <div className="page-header__subtitle">{t('tasks.subtitle')}</div>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>{t('tasks.addBtn')}</button>
      </header>

      <div className="stats" role="tablist" aria-label={t('tasks.stats.total')}>
        {STATUS_TOGGLES.map((opt) => (
          <button
            key={opt.key}
            className={`stat ${statusFilter === opt.key ? 'is-active' : ''}`}
            onClick={() => setFilters({ status: opt.key })}
            role="tab"
            aria-selected={statusFilter === opt.key}
          >
            <div className="stat__label">{t(opt.labelKey)}</div>
            <div className="stat__value" style={opt.color ? { color: opt.color } : undefined}>
              {stats[opt.countKey]}
            </div>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input
          className="input input--search"
          placeholder={t('tasks.searchPlaceholder')}
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
        <select
          className="select"
          style={{ width: 'auto' }}
          value={filters.projectId}
          onChange={(e) => setFilters({ projectId: e.target.value })}
        >
          <option value="all">{t('tasks.allProjects')}</option>
          <option value={null}>{t('tasks.noProject')}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon="✨"
          title={t('tasks.empty.title')}
          description={t('tasks.empty.desc')}
          action={<button className="btn btn--primary" onClick={openCreate}>{t('tasks.addBtn')}</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title={t('tasks.emptyFiltered')} />
      ) : (
        <div className="task-list">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={openEdit} showStatus={statusFilter === 'all'} />
          ))}
        </div>
      )}

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} initialTask={editing} />
    </>
  );
}
