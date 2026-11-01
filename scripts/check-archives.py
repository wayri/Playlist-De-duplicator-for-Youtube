"""Independently check the Node ZIP writer using Python's standard ZIP reader."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))['version']
runtime = {'manifest.json', 'popup.html', 'popup.css', 'popup.js', 'content.js',
           'LICENSE.md', 'NOTICE.md', *[f'icons/icon{size}.png' for size in [16, 32, 48, 128]]}
checksums = {}
for line in (root / 'dist/SHA256SUMS.txt').read_text().splitlines():
    digest, name = line.split('  ', 1)
    checksums[name] = digest
for kind in ['store', 'offline', 'source']:
    name = f'playlist-deduper-for-youtube-v{version}-{kind}.zip'
    archive = root / 'dist' / name
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == checksums[name], name
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None, name
        names = z.namelist()
        assert len(names) == len(set(names)), 'Duplicate archive entries'
        assert all(not n.startswith(('/', '\\')) and '..' not in Path(n).parts for n in names)
        if kind == 'store':
            assert set(names) == runtime, names
            prefix = ''
        elif kind == 'offline':
            prefix = 'Playlist-Deduper-for-YouTube/'
            assert set(names) == {prefix + n for n in runtime} | {'INSTALL.txt'}, names
        else:
            prefix = ''
            assert runtime <= set(names)
            assert '.github/workflows/release.yml' in names
            assert 'scripts/package.mjs' in names
            assert all(not any(p in n.split('/') for p in ['.git', 'dist', 'node_modules', 'work']) for n in names)
        assert json.loads(z.read(prefix + 'manifest.json'))['version'] == version
        for item in names:
            source = item.removeprefix(prefix) if kind == 'offline' else item
            expected = (root / source).read_bytes()
            if not source.endswith('.png'):
                expected = expected.replace(b'\r\n', b'\n')
            assert z.read(item) == expected, f'Archive differs from working source: {item}'
    print(f'PASS {name}: contents, CRC, version, source bytes, SHA-256')
