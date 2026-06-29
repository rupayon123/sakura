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

export function makeFloretTexture(): THREE.Texture {
  // small WHITE 5-petal flower (alpha) — tinted per-bed via material.color
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.translate(64, 64);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2);
    const g = ctx.createLinearGradient(0, 0, 0, -56);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(1, "rgba(255,255,255,0.45)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-26, -8, -24, -46, 0, -56);
    ctx.bezierCurveTo(24, -46, 26, -8, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // soft bright center
  const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
  cg.addColorStop(0, "rgba(255,250,220,0.95)");
  cg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

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

export function makeGrassBladeTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.translate(64, 118);

  const drawBlade = (x: number, height: number, width: number, bend: number, color: string) => {
    const g = ctx.createLinearGradient(0, 0, 0, -height);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(196, 220, 140, 0.82)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - width, 0);
    ctx.quadraticCurveTo(x + bend * 0.36, -height * 0.52, x + bend, -height);
    ctx.quadraticCurveTo(x + bend * 0.18, -height * 0.54, x + width, 0);
    ctx.closePath();
    ctx.fill();
  };

  drawBlade(-18, 82, 5, -18, "rgba(83, 118, 58, 0.9)");
  drawBlade(0, 100, 6, 8, "rgba(104, 145, 73, 0.94)");
  drawBlade(17, 74, 5, 20, "rgba(75, 105, 54, 0.86)");

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function makeStoneTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#d9c7ad";
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2600; i++) {
    const v = 188 + Math.random() * 46;
    ctx.fillStyle = `rgba(${v}, ${v - 12}, ${v - 28}, ${0.05 + Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }

  ctx.strokeStyle = "rgba(97, 79, 64, 0.24)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x + (Math.random() - 0.5) * 4, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 58) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() - 0.5) * 4);
    ctx.lineTo(256, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function makePlasterTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f8e2d4";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const a = 0.035 + Math.random() * 0.06;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(118,82,68,${a})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.8, 1.2);
  tex.anisotropy = 6;
  tex.needsUpdate = true;
  return tex;
}

export function makeRoofTileTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#56616b";
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 12; y < 256; y += 28) {
    const g = ctx.createLinearGradient(0, y - 8, 0, y + 10);
    g.addColorStop(0, "rgba(255,255,255,0.16)");
    g.addColorStop(0.45, "rgba(0,0,0,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 8, 256, 18);
    ctx.strokeStyle = "rgba(30, 35, 39, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let x = 16; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 12, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function makeHouseSignTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext("2d")!;

  const wood = ctx.createLinearGradient(0, 0, 512, 192);
  wood.addColorStop(0, "#6a3f2d");
  wood.addColorStop(0.45, "#9b6a46");
  wood.addColorStop(1, "#5a3528");
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, 512, 192);

  for (let y = 24; y < 192; y += 34) {
    ctx.strokeStyle = "rgba(45, 28, 20, 0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, y + Math.sin(y) * 3);
    ctx.bezierCurveTo(150, y - 8, 300, y + 10, 494, y - 4);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 224, 170, 0.45)";
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 480, 160);
  ctx.strokeStyle = "rgba(38, 22, 16, 0.65)";
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, 456, 136);

  ctx.fillStyle = "#20130f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 76px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", serif';
  ctx.fillText("栗原の家", 256, 98);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 6;
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
