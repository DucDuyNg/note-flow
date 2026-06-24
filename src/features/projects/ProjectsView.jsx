import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import ProjectForm from './ProjectForm';
import EmptyState from '../../components/EmptyState';

function ProjectCard({ project, onEdit }) {
  const tasks = useAppStore((s) => s.tasks.filter((task) => task.projectId === project.id));
  const deleteProject = useAppStore((s) => s.deleteProject);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setFilters = useAppStore((s) => s.setFilters);
  const { t } = useI18n();

  const done = tasks.filter((task) => task.status === 'done').length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const viewTasks = () => {
    setFilters({ projectId: project.id, category: 'all', search: '' });
    setActiveView('tasks');
  };

  return (
    <article className="card project-card">
      <div className="project-card__header">
        <span className="project-card__dot" style={{ background: project.color }} />
        <div style={{ flex: 1 }}>
          <div className="project-card__title">{project.name}</div>
          <span className={`badge badge--category-${project.category}`}>{t(`category.${project.category}`)}</span>
        </div>
      </div>
      {project.description && <div className="project-card__desc">{project.description}</div>}
      <div className="project-card__stats">
        <span>{t('projects.card.taskCount', { done, total })}</span>
        <span style={{ marginLeft: 'auto', color: project.color, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div className="project-card__progress">
        <div className="project-card__progress-bar" style={{ width: `${pct}%`, background: project.color }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button className="btn btn--sm" onClick={viewTasks}>{t('projects.card.viewTasks')}</button>
        <button className="btn btn--sm btn--ghost" onClick={() => onEdit(project)}>{t('common.edit')}</button>
        <button
          className="btn btn--sm btn--ghost btn--danger"
          onClick={() => { if (confirm(t('projects.confirmDelete', { name: project.name }))) deleteProject(project.id); }}
          style={{ marginLeft: 'auto' }}
        >
          {t('common.delete')}
        </button>
      </div>
    </article>
  );
}

export default function ProjectsView() {
  const projects = useAppStore((s) => s.projects);
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p) => { setEditing(p); setFormOpen(true); };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">{t('projects.title')}</h1>
          <div className="page-header__subtitle">{t('projects.subtitle')}</div>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>{t('projects.addBtn')}</button>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title={t('projects.empty.title')}
          description={t('projects.empty.desc')}
          action={<button className="btn btn--primary" onClick={openCreate}>{t('projects.addBtn')}</button>}
        />
      ) : (
        <div className="project-grid">
          {projects.map((p) => <ProjectCard key={p.id} project={p} onEdit={openEdit} />)}
        </div>
      )}

      <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} initialProject={editing} />
    </>
  );
}
