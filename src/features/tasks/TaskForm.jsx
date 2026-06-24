import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import Modal from '../../components/Modal';

const EMPTY = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  category: 'work',
  projectId: '',
  dueDate: '',
};

export default function TaskForm({ open, onClose, initialTask }) {
  const projects = useAppStore((s) => s.projects);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(initialTask);

  useEffect(() => {
    if (open) {
      setForm(initialTask ? { ...initialTask, projectId: initialTask.projectId || '', dueDate: initialTask.dueDate?.slice(0, 10) || '' } : EMPTY);
    }
  }, [open, initialTask]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      ...form,
      projectId: form.projectId || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };
    if (isEdit) updateTask(initialTask.id, payload);
    else addTask(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('tasks.form.titleEdit') : t('tasks.form.titleCreate')}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">{t('common.cancel')}</button>
          <button className="btn btn--primary" onClick={submit} type="submit">
            {isEdit ? t('common.save') : t('common.create')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label className="field__label">{t('tasks.form.fieldTitle')}</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder={t('tasks.form.fieldTitlePlaceholder')}
            autoFocus
          />
        </div>
        <div className="field">
          <label className="field__label">{t('tasks.form.fieldDescription')}</label>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder={t('tasks.form.fieldDescriptionPlaceholder')}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label">{t('tasks.form.fieldStatus')}</label>
            <select className="select" value={form.status} onChange={(e) => update({ status: e.target.value })}>
              <option value="todo">{t('status.todo')}</option>
              <option value="doing">{t('status.doing')}</option>
              <option value="done">{t('status.done')}</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">{t('tasks.form.fieldPriority')}</label>
            <select className="select" value={form.priority} onChange={(e) => update({ priority: e.target.value })}>
              <option value="low">{t('priority.low')}</option>
              <option value="medium">{t('priority.medium')}</option>
              <option value="high">{t('priority.high')}</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label">{t('tasks.form.fieldCategory')}</label>
            <select className="select" value={form.category} onChange={(e) => update({ category: e.target.value })}>
              <option value="work">{t('category.work')}</option>
              <option value="personal">{t('category.personal')}</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">{t('tasks.form.fieldProject')}</label>
            <select className="select" value={form.projectId} onChange={(e) => update({ projectId: e.target.value })}>
              <option value="">{t('tasks.noProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field__label">{t('tasks.form.fieldDueDate')}</label>
          <input
            className="input"
            type="date"
            value={form.dueDate}
            onChange={(e) => update({ dueDate: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
