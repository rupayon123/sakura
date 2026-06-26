import { grandmotherQuote, site } from "../content";

export default function Intro({
  entered,
  onEnter,
}: {
  entered: boolean;
  onEnter: () => void;
}) {
  return (
    <div className={`intro ${entered ? "intro--hidden" : ""}`}>
      <div className="intro__brand">
        {site.kanji} {site.title}
      </div>

      <p className="intro__quote-ja">「{grandmotherQuote.lineJa}」</p>
      <p className="intro__quote">“{grandmotherQuote.line}”</p>

      <p className="intro__attr">
        {grandmotherQuote.attributionJa} · {grandmotherQuote.attribution}
      </p>

      <button className="intro__enter" onClick={onEnter}>
        {site.enterJa} · {site.enter}
      </button>

      <p className="intro__attr" style={{ opacity: 0.45, marginTop: 4 }}>
        {site.subtitleJa} · {site.subtitle}
      </p>
    </div>
  );
}
