import { useState } from 'react';
import { useTeamsStore } from '../../store/useTeams';
import { useAuthStore } from '../../store/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { useI18n } from '../../i18n/useI18n';
import { PERSONAL_WORKSPACE } from '../../lib/firestorePaths';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

function CreateTeamModal({ open, onClose }) {
  const createTeam = useTeamsStore((s) => s.createTeam);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const teamId = await createTeam(name);
      setWorkspace(teamId);
      setName('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('teams.form.create')}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">{t('common.cancel')}</button>
          <button className="btn btn--primary" onClick={submit} type="submit" disabled={busy}>
            {busy ? '...' : t('common.create')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <label className="field__label">{t('teams.form.name')}</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('teams.form.namePlaceholder')}
            autoFocus
          />
        </div>
        {error && <div className="login-error">{error}</div>}
      </form>
    </Modal>
  );
}

function InviteMemberModal({ open, onClose, team }) {
  const inviteByEmail = useTeamsStore((s) => s.inviteByEmail);
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const added = await inviteByEmail(team.id, email);
      setSuccess(t('teams.invite.success', { name: added.displayName || added.email }));
      setEmail('');
    } catch (err) {
      const key = err.code === 'USER_NOT_FOUND' ? 'teams.invite.errorNotFound'
                : err.code === 'ALREADY_MEMBER' ? 'teams.invite.errorAlreadyMember'
                : err.code === 'SELF_INVITE' ? 'teams.invite.errorSelfInvite'
                : null;
      setError(key ? t(key) : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { setError(null); setSuccess(null); setEmail(''); onClose(); }}
      title={t('teams.invite.title', { team: team?.name || '' })}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">{t('common.close')}</button>
          <button className="btn btn--primary" onClick={submit} type="submit" disabled={busy}>
            {busy ? '...' : t('teams.invite.btn')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <label className="field__label">{t('teams.invite.emailLabel')}</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            autoFocus
          />
          <div style={{ fontSize: 12, color: 'var(--color-text-soft)' }}>{t('teams.invite.hint')}</div>
        </div>
        {error && <div className="login-error" style={{ background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}
        {success && <div className="login-error" style={{ background: '#dcfce7', color: '#166534' }}>{success}</div>}
      </form>
    </Modal>
  );
}

function MemberRow({ team, uid, info, isOwner, currentUid }) {
  const removeMember = useTeamsStore((s) => s.removeMember);
  const { t } = useI18n();
  const name = info?.displayName || info?.email || uid.slice(0, 8);
  const initial = name.trim()[0]?.toUpperCase() || '?';
  const isMe = uid === currentUid;
  const canRemove = isOwner && !isMe;
  return (
    <li className="member-row">
      {info?.photoURL ? (
        <img className="member-row__avatar" src={info.photoURL} alt="" referrerPolicy="no-referrer" />
      ) : (
        <div className="member-row__avatar member-row__avatar--fallback">{initial}</div>
      )}
      <div className="member-row__info">
        <div className="member-row__name">
          {name}
          {isMe && <span className="member-row__tag">{t('teams.members.you')}</span>}
          {uid === team.ownerId && <span className="member-row__tag member-row__tag--owner">{t('teams.members.owner')}</span>}
        </div>
        {info?.email && <div className="member-row__email">{info.email}</div>}
      </div>
      {canRemove && (
        <button
          className="btn btn--sm btn--ghost btn--danger"
          onClick={() => { if (confirm(t('teams.members.confirmRemove', { name }))) removeMember(team.id, uid); }}
        >
          {t('common.delete')}
        </button>
      )}
    </li>
  );
}

function TeamDetail({ team, onBack }) {
  const currentUid = useAuthStore((s) => s.user?.uid);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const currentWorkspace = useAppStore((s) => s.workspaceId);
  const renameTeam = useTeamsStore((s) => s.renameTeam);
  const deleteTeam = useTeamsStore((s) => s.deleteTeam);
  const leaveTeam = useTeamsStore((s) => s.leaveTeam);
  const { t } = useI18n();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(team.name);

  const isOwner = team.ownerId === currentUid;
  const isActive = currentWorkspace === team.id;

  const saveRename = async () => {
    await renameTeam(team.id, newName);
    setRenaming(false);
  };

  const handleLeave = async () => {
    if (!confirm(t('teams.confirmLeave', { name: team.name }))) return;
    if (isActive) setWorkspace(PERSONAL_WORKSPACE);
    await leaveTeam(team.id);
    onBack();
  };

  const handleDelete = async () => {
    if (!confirm(t('teams.confirmDelete', { name: team.name }))) return;
    if (isActive) setWorkspace(PERSONAL_WORKSPACE);
    await deleteTeam(team.id);
    onBack();
  };

  return (
    <>
      <header className="page-header">
        <div>
          <button className="btn btn--ghost btn--sm" onClick={onBack}>← {t('teams.backToList')}</button>
          {renaming ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
              <button className="btn btn--primary btn--sm" onClick={saveRename}>{t('common.save')}</button>
              <button className="btn btn--sm" onClick={() => { setRenaming(false); setNewName(team.name); }}>{t('common.cancel')}</button>
            </div>
          ) : (
            <h1 className="page-header__title" style={{ marginTop: 6 }}>
              {team.name}
              {isOwner && (
                <button className="btn btn--ghost btn--sm" style={{ marginLeft: 8 }} onClick={() => setRenaming(true)}>
                  {t('common.edit')}
                </button>
              )}
            </h1>
          )}
          <div className="page-header__subtitle">{t('teams.memberCount', { count: team.memberIds.length })}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isActive && (
            <button className="btn btn--primary" onClick={() => setWorkspace(team.id)}>
              {t('teams.switchTo')}
            </button>
          )}
          {isActive && (
            <span className="badge badge--category-work">{t('teams.activeWorkspace')}</span>
          )}
        </div>
      </header>

      <section className="settings-section">
        <div className="settings-section__title">{t('teams.members.title')}</div>
        <ul className="member-list">
          {team.memberIds.map((uid) => (
            <MemberRow
              key={uid}
              team={team}
              uid={uid}
              info={team.memberInfo?.[uid]}
              isOwner={isOwner}
              currentUid={currentUid}
            />
          ))}
        </ul>
        {isOwner && (
          <div className="settings-actions">
            <button className="btn btn--primary" onClick={() => setInviteOpen(true)}>+ {t('teams.invite.btn')}</button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <div className="settings-section__title" style={{ color: 'var(--color-danger)' }}>{t('settings.danger.title')}</div>
        <div className="settings-actions">
          {isOwner ? (
            <button className="btn btn--danger" onClick={handleDelete}>{t('teams.deleteBtn')}</button>
          ) : (
            <button className="btn btn--danger" onClick={handleLeave}>{t('teams.leaveBtn')}</button>
          )}
        </div>
      </section>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} team={team} />
    </>
  );
}

export default function TeamsView() {
  const teams = useTeamsStore((s) => s.teams);
  const currentUid = useAuthStore((s) => s.user?.uid);
  const workspaceId = useAppStore((s) => s.workspaceId);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const selected = teams.find((t) => t.id === selectedId);
  if (selected) {
    return <TeamDetail team={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">{t('teams.title')}</h1>
          <div className="page-header__subtitle">{t('teams.subtitle')}</div>
        </div>
        <button className="btn btn--primary" onClick={() => setCreateOpen(true)}>+ {t('teams.addBtn')}</button>
      </header>

      <section className="settings-section">
        <div className="settings-section__title">{t('teams.currentWorkspace')}</div>
        <div className="workspace-list">
          <button
            className={`workspace-row ${workspaceId === PERSONAL_WORKSPACE ? 'is-active' : ''}`}
            onClick={() => setWorkspace(PERSONAL_WORKSPACE)}
          >
            <span className="workspace-row__icon">👤</span>
            <div className="workspace-row__info">
              <div className="workspace-row__name">{t('teams.personal')}</div>
              <div className="workspace-row__desc">{t('teams.personalDesc')}</div>
            </div>
            {workspaceId === PERSONAL_WORKSPACE && <span className="workspace-row__check">✓</span>}
          </button>
          {teams.map((tm) => (
            <button
              key={tm.id}
              className={`workspace-row ${workspaceId === tm.id ? 'is-active' : ''}`}
              onClick={() => setWorkspace(tm.id)}
            >
              <span className="workspace-row__icon">👥</span>
              <div className="workspace-row__info">
                <div className="workspace-row__name">{tm.name}</div>
                <div className="workspace-row__desc">
                  {t('teams.memberCount', { count: tm.memberIds.length })}
                  {tm.ownerId === currentUid && ` · ${t('teams.members.owner')}`}
                </div>
              </div>
              {workspaceId === tm.id && <span className="workspace-row__check">✓</span>}
            </button>
          ))}
        </div>
      </section>

      {teams.length === 0 ? (
        <EmptyState
          icon="👥"
          title={t('teams.empty.title')}
          description={t('teams.empty.desc')}
          action={<button className="btn btn--primary" onClick={() => setCreateOpen(true)}>+ {t('teams.addBtn')}</button>}
        />
      ) : (
        <section className="settings-section">
          <div className="settings-section__title">{t('teams.yourTeams')}</div>
          <div className="team-list">
            {teams.map((tm) => (
              <button key={tm.id} className="team-card" onClick={() => setSelectedId(tm.id)}>
                <div className="team-card__name">{tm.name}</div>
                <div className="team-card__meta">
                  {t('teams.memberCount', { count: tm.memberIds.length })}
                  {tm.ownerId === currentUid && ` · ${t('teams.members.owner')}`}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
