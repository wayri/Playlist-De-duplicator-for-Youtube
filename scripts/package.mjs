import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, [path.join(root, 'scripts/validate.mjs')], { stdio: 'inherit' });
const version = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'))).version;
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });

// Small dependency-free ZIP writer. Fixed timestamps and sorted paths make the
// same source produce identical archives on Windows and Linux.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, file] of entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const filename = Buffer.from(name);
    const raw = fs.readFileSync(path.join(root, file));
    const data = file.endsWith('.png') ? raw : Buffer.from(raw.toString('utf8').replace(/\r\n/g, '\n'));
    const compressed = deflateRawSync(data, { level: 9 });
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6); // UTF-8 paths
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(33, 12); // 1980-01-01
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    local.push(header, filename, compressed);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt16LE(20, 4);
    header.copy(directory, 6, 4, 30);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, filename);
    offset += header.length + filename.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

const runtime = ['manifest.json', 'popup.html', 'popup.css', 'popup.js', 'content.js',
  ...[16, 32, 48, 128].map(size => `icons/icon${size}.png`), 'LICENSE.md', 'NOTICE.md'];
const sourceRoots = ['icons', 'docs', 'scripts', 'tests', 'store-assets', '.github'];
function collect(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${file}`);
    return entry.isDirectory() ? collect(file) : [file];
  });
}
const source = [
  ...fs.readdirSync(root).filter(file => /\.(md|json|js|html|css)$/.test(file) || ['INSTALL.txt', '.gitignore', '.gitattributes'].includes(file)),
  ...sourceRoots.filter(dir => fs.existsSync(path.join(root, dir))).flatMap(collect)
];
const archives = {
  store: runtime.map(file => [file, file]),
  offline: [...runtime.map(file => [`Playlist-Deduper-for-YouTube/${file}`, file]), ['INSTALL.txt', 'INSTALL.txt']],
  source: source.map(file => [file, file])
};
const checksums = [];
for (const [kind, entries] of Object.entries(archives)) {
  const name = `playlist-deduper-for-youtube-v${version}-${kind}.zip`;
  const data = zip(entries);
  fs.writeFileSync(path.join(dist, name), data);
  checksums.push(`${createHash('sha256').update(data).digest('hex')}  ${name}`);
  console.log(`Created ${name} (${data.length} bytes)`);
}
fs.writeFileSync(path.join(dist, 'SHA256SUMS.txt'), checksums.join('\n') + '\n');
