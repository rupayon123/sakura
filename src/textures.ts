import * as THREE from "three";

/* ============================================================================
 *  Procedurally drawn sakura textures (no external image assets needed).
 *  A single soft petal (for falling petals) and a full 5-petal blossom
 *  (for the canopy "flower cards"). Both have alpha so they read organically.
 * ==========================================================================*/

/** Draws one sakura petal whose base sits at (0,0) and tip points to -y. */
function petalPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-44, -10, -40, -70, -9, -92);
  ctx.quadraticCurveTo(0, -80, 9, -92); // little notch at the tip
  ctx.bezierCurveTo(40, -70, 44, -10, 0, 0);
  ctx.closePath();
}

function petalGradient(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, -92);
  g.addColorStop(0, "#ff6fae"); // deeper pink at the base
  g.addColorStop(0.45, "#ffaad4");
  g.addColorStop(1, "#fff2f8"); // near-white at the tip
  return g;
}

export function makePetalTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.translate(64, 116);
  ctx.scale(0.62, 0.62);
  ctx.fillStyle = petalGradient(ctx);
  petalPath(ctx);
  ctx.fill();
  // soft central vein highlight
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -82);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function makeGrassTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  // base grass green
  ctx.fillStyle = "#6f9a48";
  ctx.fillRect(0, 0, 256, 256);
  // patchy tone variation (lighter + darker blotches)
  const blot = (color: string, n: number, rmin: number, rmax: number) => {
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = rmin + Math.random() * (rmax - rmin);
      ctx.globalAlpha = 0.18 + Math.random() * 0.22;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  blot("#7faa54", 60, 8, 26);
  blot("#5c8a3c", 60, 8, 26);
  blot("#86b35c", 40, 4, 12);
  // fine speckle for grain
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#5a8438" : "#88b75e";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function makeBlossomTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.translate(128, 128);

  // 5 petals around the center
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2);
    ctx.scale(1.05, 1.05);
    ctx.fillStyle = petalGradient(ctx);
    petalPath(ctx);
    ctx.fill();
    ctx.restore();
  }

  // golden center + stamens
  const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, 18);
  cg.addColorStop(0, "#fff0b8");
  cg.addColorStop(1, "rgba(255,200,90,0)");
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd25e";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
