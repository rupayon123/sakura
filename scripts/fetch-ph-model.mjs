/* Download a Poly Haven CC0 model (gltf + bin + textures) into public/models/<name>/.
 * Usage: node scripts/fetch-ph-model.mjs <name> [res]    e.g. flower_gazania 1k   */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const name = process.argv[2];
const res = process.argv[3] || "1k";
if (!name) throw new Error("model name required");

const files = await (await fetch(`https://api.polyhaven.com/files/${name}`)).json();
const gltfUrl = files.gltf[res].gltf.url;
const baseUrl = gltfUrl.slice(0, gltfUrl.lastIndexOf("/") + 1);
const outDir = `public/models/${name}`;

const gltfBuf = Buffer.from(await (await fetch(gltfUrl)).arrayBuffer());
const gltf = JSON.parse(gltfBuf.toString("utf8"));
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/model.gltf`, gltfBuf);

const uris = new Set();
(gltf.buffers || []).forEach((b) => b.uri && uris.add(b.uri));
(gltf.images || []).forEach((i) => i.uri && uris.add(i.uri));

for (const uri of uris) {
  const buf = Buffer.from(await (await fetch(baseUrl + uri)).arrayBuffer());
  const dest = `${outDir}/${uri}`;
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  console.log(`  ${uri}  ${(buf.length / 1e6).toFixed(2)}MB`);
}
console.log(`✓ ${name} → ${outDir}/model.gltf`);
