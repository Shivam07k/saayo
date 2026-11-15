/* eslint-disable no-console */
/**
 * Generates deterministic sample GLB models (no external assets needed):
 *   public/models/sample-tshirt.glb
 *   public/models/sample-tshirt-oversized.glb
 * Run: npm run gen:models
 */
const fs = require("fs");
const path = require("path");

function box(w, h, d, tx = 0, ty = 0, tz = 0) {
  const x = w / 2, y = h / 2, z = d / 2;
  const corners = [
    { x: -x + tx, y: -y + ty, z: -z + tz }, // 0 bottom-left-back
    { x: x + tx, y: -y + ty, z: -z + tz },  // 1 bottom-right-back
    { x: x + tx, y: y + ty, z: -z + tz },   // 2 top-right-back
    { x: -x + tx, y: y + ty, z: -z + tz },  // 3 top-left-back
    { x: -x + tx, y: -y + ty, z: z + tz },  // 4 bottom-left-front
    { x: x + tx, y: -y + ty, z: z + tz },   // 5 bottom-right-front
    { x: x + tx, y: y + ty, z: z + tz },    // 6 top-right-front
    { x: -x + tx, y: y + ty, z: z + tz },   // 7 top-left-front
  ];
  const positions = new Float32Array(corners.flatMap((c) => [c.x, c.y, c.z]));
  const indices = new Uint16Array([
    0, 2, 1, 0, 3, 2, // -Z back
    4, 5, 6, 4, 6, 7, // +Z front
    1, 2, 6, 1, 6, 5, // +X right
    0, 4, 7, 0, 7, 3, // -X left
    3, 7, 6, 3, 6, 2, // +Y top
    0, 1, 5, 0, 5, 4, // -Y bottom
  ]);
  return { positions, indices };
}

function minBy(arr, i) {
  let m = Infinity;
  for (let k = i; k < arr.length; k += 3) m = Math.min(m, arr[k]);
  return m;
}
function maxBy(arr, i) {
  let m = -Infinity;
  for (let k = i; k < arr.length; k += 3) m = Math.max(m, arr[k]);
  return m;
}

function finalize(parts, materials) {
  // parts: [{ label, positions, indices }]
  const posParts = [];
  const idxParts = [];
  const vertexOffsets = [0];
  let totalVerts = 0;
  let totalIdx = 0;
  for (const p of parts) {
    posParts.push(p.positions);
    idxParts.push(p.indices);
    totalVerts += p.positions.length;
    totalIdx += p.indices.length;
    vertexOffsets.push(totalVerts);
  }

  const pos = new Float32Array(totalVerts);
  const idx = new Uint16Array(totalIdx);
  let po = 0;
  posParts.forEach((pp) => { pos.set(pp, po); po += pp.length; });
  let io = 0, vertexCursor = 0;
  idxParts.forEach((ip, i) => {
    for (let k = 0; k < ip.length; k++) idx[io + k] = ip[k] + vertexCursor;
    io += ip.length;
    vertexCursor += posParts[i].length / 3;
  });

  let viewOffset = 0;
  const bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: pos.byteLength, target: 34962 },
  ];
  viewOffset += pos.byteLength;
  bufferViews.push({ buffer: 0, byteOffset: viewOffset, byteLength: idx.byteLength, target: 34963 });

  const accessors = [
    { bufferView: 0, componentType: 5126, count: pos.length / 3, type: "VEC3", min: [minBy(pos, 0), minBy(pos, 1), minBy(pos, 2)], max: [maxBy(pos, 0), maxBy(pos, 1), maxBy(pos, 2)] },
  ];
  const idxOffsets = [0];
  for (let i = 0; i < parts.length; i++) idxOffsets.push(idxOffsets[i] + parts[i].indices.length);
  for (let i = 0; i < parts.length; i++) {
    accessors.push({
      bufferView: 1,
      byteOffset: idxOffsets[i] * 2,
      componentType: 5123,
      count: parts[i].indices.length,
      type: "SCALAR",
    });
  }

  const meshes = parts.map((p, i) => ({
    primitives: [{ attributes: { POSITION: 0 }, indices: i + 1, material: i }],
    name: p.label,
  }));

  const json = {
    asset: { version: "2.0", generator: "saayo-model-generator" },
    scene: 0,
    scenes: [{ nodes: parts.map((_, i) => i) }],
    nodes: parts.map((p, i) => ({ mesh: i, name: p.label })),
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: pos.byteLength + idx.byteLength }],
  };

  const jsonStr = JSON.stringify(json);
  const paddedJson = Buffer.from(jsonStr.padEnd(Math.ceil(jsonStr.length / 4) * 4, " "), "utf8");
  const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(idx.buffer)]);

  const header = Buffer.alloc(12);
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + bin.length, 8);
  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(paddedJson.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);
  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(bin.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonChunkHeader, paddedJson, binChunkHeader, bin]);
}

function material(name, color) {
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor: color,
      metallicFactor: 0.05,
      roughnessFactor: 0.85,
    },
  };
}

function buildTshirt({ oversized = false } = {}) {
  const bodyW = oversized ? 1.2 : 1.0;
  const bodyH = oversized ? 1.3 : 1.1;
  const sleeveW = oversized ? 0.42 : 0.3;
  const sleeveH = oversized ? 0.42 : 0.34;
  const sleeveX = oversized ? 0.78 : 0.64;

  const body = box(bodyW, bodyH, 0.22, 0, 0.12, 0);
  const sleeveL = box(sleeveW, sleeveH, 0.22, -sleeveX, 0.1, 0);
  const sleeveR = box(sleeveW, sleeveH, 0.22, sleeveX, 0.1, 0);
  const collar = box(0.28, 0.13, 0.28, 0, 0.72, 0);
  const pocket = oversized ? null : box(0.28, 0.3, 0.24, 0, -0.02, 0.13);

  const parts = [
    { label: "body", positions: body.positions, indices: body.indices },
    { label: "sleeves", positions: concatParts([sleeveL, sleeveR]).positions, indices: concatParts([sleeveL, sleeveR]).indices },
    { label: "collar", positions: collar.positions, indices: collar.indices },
  ];
  if (pocket) parts.push({ label: "pocket", positions: pocket.positions, indices: pocket.indices });

  return {
    parts,
    materials: [
      material("body", [0.87, 0.87, 0.86, 1]),
      material("sleeves", [0.9, 0.9, 0.9, 1]),
      material("collar", [0.82, 0.82, 0.82, 1]),
      material("pocket", [0.9, 0.9, 0.9, 1]),
    ],
  };
}

function concatParts(parts) {
  const positions = new Float32Array(parts.reduce((n, p) => n + p.positions.length, 0));
  const indices = new Uint16Array(parts.reduce((n, p) => n + p.indices.length, 0));
  let po = 0;
  parts.forEach((p) => { positions.set(p.positions, po); po += p.positions.length; });
  let io = 0;
  let cursor = 0;
  parts.forEach((p) => {
    for (let k = 0; k < p.indices.length; k++) indices[io + k] = p.indices[k] + cursor;
    io += p.indices.length;
    cursor += p.positions.length / 3;
  });
  return { positions, indices };
}

function main() {
  const outDir = path.join(__dirname, "..", "public", "models");
  fs.mkdirSync(outDir, { recursive: true });

  const tshirt = buildTshirt();
  const oversized = buildTshirt({ oversized: true });

  const tshirtGlb = finalize(tshirt.parts, tshirt.materials);
  const oversizedGlb = finalize(oversized.parts, oversized.materials);

  fs.writeFileSync(path.join(outDir, "sample-tshirt.glb"), tshirtGlb);
  fs.writeFileSync(path.join(outDir, "sample-tshirt-oversized.glb"), oversizedGlb);
  console.log(`Wrote ${path.join(outDir, "sample-tshirt.glb")} (${tshirtGlb.byteLength} bytes)`);
  console.log(`Wrote ${path.join(outDir, "sample-tshirt-oversized.glb")} (${oversizedGlb.byteLength} bytes)`);
}

main();