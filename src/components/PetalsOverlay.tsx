import { useEffect, useRef } from "react";

/** Lightweight 2D falling-sakura-petal overlay drawn on a canvas. */
export default function PetalsOverlay({ play = true }: { play?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const playing = useRef(play);
  playing.current = play;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const N = Math.min(90, Math.floor(w / 16));
    const colors = ["#ffd1e6", "#ff9ecf", "#ffb3c6", "#ffffff"];
    const petals = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 4 + Math.random() * 6,
      sp: 0.4 + Math.random() * 1.1,
      sway: 0.6 + Math.random() * 1.4,
      ang: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.05,
      phase: Math.random() * Math.PI * 2,
      color: colors[(Math.random() * colors.length) | 0],
    }));

    let t = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      if (!playing.current) return;
      t += 0.016;
      for (const p of petals) {
        p.y += p.sp;
        p.x += Math.sin(t * 0.8 + p.phase) * p.sway * 0.4;
        p.ang += p.spin;
        if (p.y > h + 12) {
          p.y = -12;
          p.x = Math.random() * w;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ang);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = p.color;
        // simple petal shape
        ctx.beginPath();
        ctx.moveTo(0, -p.r);
        ctx.bezierCurveTo(p.r * 0.9, -p.r * 0.5, p.r * 0.6, p.r * 0.7, 0, p.r);
        ctx.bezierCurveTo(-p.r * 0.6, p.r * 0.7, -p.r * 0.9, -p.r * 0.5, 0, -p.r);
        ctx.fill();
        ctx.restore();
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="petals-overlay" aria-hidden />;
}
