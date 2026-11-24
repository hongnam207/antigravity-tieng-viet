"""Package only distributable files; tests may have created local cache/status files."""
import pathlib, sys, zipfile
root = pathlib.Path(sys.argv[1]).resolve()
target = pathlib.Path(sys.argv[2]).resolve()
flat = {'node.exe', 'NODE-LICENSE.txt', 'patcher.cjs', 'renderer.js', 'native.js',
        'vi.json', 'translator.py', 'HUONG-DAN.txt', 'BUILD.txt', 'MODEL-NOTICE.txt', 'install-plugin.cjs', 'install-integrations.cjs'}
trees = {'runtime', 'model', 'licenses', 'plugin', 'integrations'}
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6, strict_timestamps=False) as output:
    count = 0
    for file in sorted(root.rglob('*')):
        if not file.is_file() or file.is_symlink():
            continue
        rel = file.relative_to(root)
        # uv's generated console launchers pin the builder's Python path.
        # CAD runs through launch.py and bundled Python, never these wrappers.
        if rel.parts[:4] in {('integrations', 'autocad', 'site', 'bin'), ('integrations','portable-skills','site','bin')}:
            continue
        if '__pycache__' in rel.parts or file.suffix in {'.pyc', '.pyo'}:
            continue
        if len(rel.parts) == 1 and rel.name not in flat:
            continue
        if len(rel.parts) > 1 and rel.parts[0] not in trees:
            continue
        # beartype ships Python source under _util/cache; this is package code,
        # not the translator's generated cache. Dependencies come from uv's
        # clean, pinned target and preserve their wheel inventories/licenses.
        dependency_source = rel.parts[:3] in {('integrations', 'autocad', 'site'), ('integrations','portable-skills','site')}
        if '.git' in rel.parts or 'backups' in rel.parts or ('cache' in rel.parts and not dependency_source):
            raise RuntimeError('Private generated directory in distributable tree: ' + str(rel))
        output.write(file, rel.as_posix())
        count += 1
print('Packaged distributable payload:', count, 'files')
