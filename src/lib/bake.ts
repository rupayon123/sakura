import * as THREE from "three";

/**
 * Flattens the first mesh of a loaded GLB into a single BufferGeometry whose
 * per-material colors are baked into a vertex-color attribute — so a
 * multi-material model can be GPU-instanced hundreds of times with one material.
 * Bakes the node world transform and (optionally) drops the base to y=0.
 */
export function bakeMeshToVertexColors(
  root: THREE.Object3D,
  opts: { groundY?: boolean } = {}
): THREE.BufferGeometry {
  let target: THREE.Mesh | null = null;
  root.updateWorldMatrix(true, true);
  root.traverse((o: any) => {
    if (o.isMesh && !target) target = o as THREE.Mesh;
  });
  if (!target) return new THREE.BufferGeometry();
  const mesh = target as THREE.Mesh;

  const src = mesh.geometry as THREE.BufferGeometry;
  const geo = src.index ? src.toNonIndexed() : src.clone();
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const groups =
    geo.groups && geo.groups.length
      ? geo.groups
      : [{ start: 0, count: pos.count, materialIndex: 0 }];
  const tmp = new THREE.Color();
  for (const g of groups) {
    const m: any = mats[g.materialIndex ?? 0] || mats[0];
    if (m && m.color) tmp.copy(m.color);
    else tmp.set("#cccccc");
    const end = g.start + g.count;
    for (let i = g.start; i < end; i++) {
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.clearGroups();
  if (geo.getAttribute("uv")) geo.deleteAttribute("uv");

  geo.applyMatrix4(mesh.matrixWorld);
  if (opts.groundY) {
    geo.computeBoundingBox();
    const b = geo.boundingBox!;
    geo.translate(0, -b.min.y, 0);
  }
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  return geo;
}
