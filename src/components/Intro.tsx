import { grandmotherQuote, site } from "../content";

export default function Intro({
  entered,
  onEnter,
}: {
  entered: boolean;
  onEnter: () => void;
}) {
  return (
    <div className={`intro ${entered ? "intro--hidden" : ""}`} aria-hidden={entered}>
      <div className="intro__brand">
        {site.kanji} {site.title}
      </div>

      <p className="intro__quote-ja">「{grandmotherQuote.lineJa}」</p>
      <p className="intro__quote">“{grandmotherQuote.line}”</p>

      <p className="intro__attr">
        {grandmotherQuote.attributionJa} · {grandmotherQuote.attribution}
      </p>

      <button type="button" className="intro__enter" onClick={onEnter} tabIndex={entered ? -1 : 0}>
        {site.enterJa} · {site.enter}
      </button>

      <p className="intro__attr intro__subtitle">
        {site.subtitleJa} · {site.subtitle}
      </p>
    </div>
  );
}
