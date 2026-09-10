import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const fail = (msg) => { console.error(`✗ ${msg}`); process.exitCode = 1; };
const ok = (msg) => console.log(`✓ ${msg}`);

let manifest;
try {
  manifest = JSON.parse(read('manifest.json'));
  ok('manifest.json parses');
} catch (error) {
  fail(`manifest.json parse failed: ${error.message}`);
  process.exit(1);
}

if (manifest.manifest_version === 3) ok('Manifest V3'); else fail('manifest_version must be 3');
if (/^\d+\.\d+\.\d+(\.\d+)?$/.test(manifest.version || '')) ok(`manifest version ${manifest.version}`); else fail('manifest version format is invalid');
if ((manifest.name || '').length <= 45) ok('manifest name length'); else fail('manifest name exceeds 45 characters');
if ((manifest.description || '').length <= 132) ok('manifest description length'); else fail('manifest description exceeds 132 characters');

const expectedPermissions = ['activeTab', 'scripting', 'storage'].sort();
const actualPermissions = [...(manifest.permissions || [])].sort();
if (JSON.stringify(expectedPermissions) === JSON.stringify(actualPermissions)) ok('permissions are minimal expected set');
else fail(`unexpected permissions: ${actualPermissions.join(', ')}`);

if (!manifest.host_permissions?.length) ok('no persistent host permissions'); else fail('host_permissions must remain empty/absent');

const requiredRuntime = ['manifest.json', 'popup.html', 'popup.css', 'popup.js', 'content.js', 'icons/icon16.png', 'icons/icon32.png', 'icons/icon48.png', 'icons/icon128.png'];
for (const file of requiredRuntime) exists(file) ? ok(`exists: ${file}`) : fail(`missing: ${file}`);

const requiredRepo = ['README.md', 'INSTALL.txt', 'LICENSE.md', 'NOTICE.md', 'PRIVACY_POLICY.md', 'SECURITY.md', 'CONTRIBUTING.md', 'TEST_PLAN.md', 'CHANGELOG.md', 'docs/INSTALLATION.md', 'docs/USER_GUIDE.md', 'docs/RELEASING.md'];
for (const file of requiredRepo) exists(file) ? ok(`exists: ${file}`) : fail(`missing: ${file}`);

const textFiles = ['popup.html', 'popup.js', 'content.js'];
const joined = textFiles.map(read).join('\n');
if (!/\beval\s*\(/.test(joined)) ok('no eval()'); else fail('eval() found');
if (!/\bnew\s+Function\s*\(/.test(joined)) ok('no new Function()'); else fail('new Function() found');
if (!/<script[^>]+src=["']https?:\/\//i.test(read('popup.html'))) ok('no remote script src in popup'); else fail('remote script src found');

for (const js of ['popup.js', 'content.js']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, js)], { encoding: 'utf8' });
  if (result.status === 0) ok(`${js} syntax`); else fail(`${js} syntax: ${result.stderr.trim()}`);
}

if (!process.exitCode) console.log('\nValidation passed.');
