"""Package only distributable files; tests may have created local cache/status files."""
import pathlib, sys, zipfile
root = pathlib.Path(sys.argv[1]).resolve()
target = pathlib.Path(sys.argv[2]).resolve()
flat = {'node.exe', 'NODE-LICENSE.txt', 'patcher.cjs', 'renderer.js', 'native.js',
        'vi.json', 'translator.py', 'HUONG-DAN.txt', 'BUILD.txt', 'MODEL-NOTICE.txt', 'install-plugin.cjs'}
trees = {'runtime', 'model', 'licenses', 'plugin'}
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as output:
    count = 0
    for file in sorted(root.rglob('*')):
        if not file.is_file() or file.is_symlink():
            continue
        rel = file.relative_to(root)
        if '__pycache__' in rel.parts or file.suffix in {'.pyc', '.pyo'}:
            continue
        if len(rel.parts) == 1 and rel.name not in flat:
            continue
        if len(rel.parts) > 1 and rel.parts[0] not in trees:
            continue
        if any(part in {'cache', 'backups', '.git'} for part in rel.parts):
            raise RuntimeError('Private generated directory in distributable tree')
        output.write(file, rel.as_posix())
        count += 1
print('Packaged distributable payload:', count, 'files')
