import type { Patch } from "../content";

export default function InfoPanel({
  patch,
  onClose,
  onSelect,
}: {
  patch: Patch | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const titleId = patch ? `panel-title-${patch.id}` : undefined;

  return (
    <div
      className={`panel ${patch ? "panel--open" : ""}`}
      role={patch ? "dialog" : undefined}
      aria-labelledby={titleId}
      aria-hidden={patch ? undefined : true}
    >
      {patch && (
        <>
          <button type="button" className="panel__close" onClick={onClose} aria-label="Close panel">
            ×
          </button>
          <div className="panel__eyebrow">
            {patch.kind === "family"
              ? "house · roots"
              : patch.kind === "about"
              ? "about"
              : "project"}
          </div>
          <h2 className="panel__title" id={titleId}>
            {patch.title}
          </h2>
          {patch.meta && <div className="panel__meta">{patch.meta}</div>}
          <p className="panel__body">{patch.body}</p>
          {patch.links && patch.links.length > 0 && (
            <div className="panel__links">
              {patch.links.map((l) => (
                <a
                  key={l.href}
                  className="panel__link"
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.label} →
                </a>
              ))}
            </div>
          )}
          {patch.actions && patch.actions.length > 0 && (
            <div className="panel__links panel__links--actions">
              {patch.actions.map((action) => (
                <button
                  key={action.targetId}
                  type="button"
                  className="panel__link panel__link--button"
                  onClick={() => onSelect(action.targetId)}
                >
                  {action.label} →
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
