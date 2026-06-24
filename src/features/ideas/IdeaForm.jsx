import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import Modal from '../../components/Modal';

const EMPTY = { title: '', content: '', tags: '', category: 'personal' };

export default function IdeaForm({ open, onClose, initialIdea }) {
  const addIdea = useAppStore((s) => s.addIdea);
  const updateIdea = useAppStore((s) => s.updateIdea);
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(initialIdea);

  useEffect(() => {
    if (open) {
      setForm(initialIdea
        ? { ...initialIdea, tags: (initialIdea.tags || []).join(', ') }
        : EMPTY);
    }
  }, [open, initialIdea]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      ...form,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    if (isEdit) updateIdea(initialIdea.id, payload);
    else addIdea(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('ideas.form.titleEdit') : t('ideas.form.titleCreate')}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">{t('common.cancel')}</button>
          <button className="btn btn--primary" onClick={submit} type="submit">
            {isEdit ? t('common.save') : t('ideas.form.saveBtn')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label className="field__label">{t('ideas.form.fieldTitle')}</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder={t('ideas.form.fieldTitlePlaceholder')}
            autoFocus
          />
        </div>
        <div className="field">
          <label className="field__label">{t('ideas.form.fieldContent')}</label>
          <textarea
            className="textarea"
            value={form.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder={t('ideas.form.fieldContentPlaceholder')}
            style={{ minHeight: 160 }}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label">{t('ideas.form.fieldTags')}</label>
            <input
              className="input"
              value={form.tags}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder={t('ideas.form.fieldTagsPlaceholder')}
            />
          </div>
          <div className="field">
            <label className="field__label">{t('ideas.form.fieldCategory')}</label>
            <select className="select" value={form.category} onChange={(e) => update({ category: e.target.value })}>
              <option value="work">{t('category.work')}</option>
              <option value="personal">{t('category.personal')}</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
