import { projectPatches, aboutPatch, site } from "../content";

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
      <button
        className="nav__brand"
        onClick={() => setFocused(null)}
        title={site.title}
        aria-label="Return to garden overview"
      >
        {site.kanji} {site.initials}
      </button>
      {projectPatches.map((p) => btn(p.id, p.label))}
      <span className="nav__sep" aria-hidden />
      {btn(aboutPatch.id, aboutPatch.label)}
    </nav>
  );
}
