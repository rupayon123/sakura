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
