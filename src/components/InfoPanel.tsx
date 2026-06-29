import type { Patch } from "../content";

export default function InfoPanel({
  patch,
  onClose,
}: {
  patch: Patch | null;
  onClose: () => void;
}) {
  return (
    <div className={`panel ${patch ? "panel--open" : ""}`}>
      {patch && (
        <>
          <button className="panel__close" onClick={onClose} aria-label="close">
            ×
          </button>
          <div className="panel__eyebrow">
            {patch.kind === "family"
              ? "house · roots"
              : patch.kind === "about"
              ? "about"
              : "project"}
          </div>
          <h2 className="panel__title">{patch.title}</h2>
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
        </>
      )}
    </div>
  );
}
