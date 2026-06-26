import { projectPatches, familyPatches, aboutPatch, site } from "../content";

export default function Nav({
  focused,
  setFocused,
}: {
  focused: string | null;
  setFocused: (id: string | null) => void;
}) {
  const btn = (id: string, label: string) => (
    <button
      key={id}
      className={`nav__btn ${focused === id ? "nav__btn--active" : ""}`}
      onClick={() => setFocused(focused === id ? null : id)}
    >
      {label}
    </button>
  );

  return (
    <nav className="nav">
      <span
        className="nav__brand"
        onClick={() => setFocused(null)}
        style={{ cursor: "pointer" }}
        title={site.title}
      >
        {site.kanji} {site.initials}
      </span>
      {projectPatches.map((p) => btn(p.id, p.label))}
      <span className="nav__sep" aria-hidden />
      {familyPatches.map((p) => btn(p.id, p.label))}
      <span className="nav__sep" aria-hidden />
      {btn(aboutPatch.id, aboutPatch.label)}
    </nav>
  );
}
