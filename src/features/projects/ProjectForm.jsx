import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import Modal from '../../components/Modal';

const EMPTY = { name: '', description: '', color: '#6366f1', category: 'work' };
const COLORS = ['#6366f1', '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626', '#db2777', '#8b5cf6', '#14b8a6'];

export default function ProjectForm({ open, onClose, initialProject }) {
  const addProject = useAppStore((s) => s.addProject);
  const updateProject = useAppStore((s) => s.updateProject);
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(initialProject);

  useEffect(() => {
    if (open) setForm(initialProject || EMPTY);
  }, [open, initialProject]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (isEdit) updateProject(initialProject.id, form);
    else addProject(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('projects.form.titleEdit') : t('projects.form.titleCreate')}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">{t('common.cancel')}</button>
          <button className="btn btn--primary" onClick={submit} type="submit">
            {isEdit ? t('common.save') : t('projects.form.saveBtn')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label className="field__label">{t('projects.form.fieldName')}</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder={t('projects.form.fieldNamePlaceholder')}
            autoFocus
          />
        </div>
        <div className="field">
          <label className="field__label">{t('projects.form.fieldDescription')}</label>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder={t('projects.form.fieldDescriptionPlaceholder')}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label">{t('projects.form.fieldCategory')}</label>
            <select className="select" value={form.category} onChange={(e) => update({ category: e.target.value })}>
              <option value="work">{t('category.work')}</option>
              <option value="personal">{t('category.personal')}</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">{t('projects.form.fieldColor')}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ color: c })}
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid var(--color-text)' : '3px solid transparent',
                    cursor: 'pointer',
                  }}
                  aria-label={t('projects.form.colorSelectAria', { color: c })}
                />
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
