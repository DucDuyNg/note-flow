export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon" aria-hidden="true">{icon}</div>}
      <div className="empty-state__title">{title}</div>
      {description && <div>{description}</div>}
      {action}
    </div>
  );
}
