import os, sys, re, json, pathlib, hashlib, shutil, datetime, tempfile, stat
if sys.version_info < (3, 11):
    raise SystemExit('Python 3.11+ is required for tomllib.')
try:
    import yaml
except ImportError:
    raise SystemExit('Missing PyYAML. Run: python -m pip install PyYAML==6.0.3')
import tomllib

codex, agents, gemini = [pathlib.Path(x).expanduser().resolve() for x in sys.argv[1:4]]
apply = sys.argv[4] == 'True'
activate_all = False  # Dependency-heavy source skills are never force-activated.
pack = pathlib.Path(sys.argv[6]).resolve()
target = gemini / 'config' / 'skills'
stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
run = gemini / 'codex-sync' / stamp
config_file = gemini / 'config' / 'mcp_config.json'
MAX_FILES, MAX_BYTES = 3000, 100 * 1024 * 1024
SKIP = {'.git', 'node_modules', '__pycache__', '.venv', 'venv'}

def linked(p):
    try:
        return p.is_symlink() or p.is_junction()
    except AttributeError:
        return p.is_symlink()

def check_ancestors(p):
    for part in (p, *p.parents):
        if part.exists() and linked(part):
            raise ValueError('Refusing destination containing a junction/symlink: ' + str(part))

for p in (target, run, config_file):
    check_ancestors(p)

def load_json(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))

source_config = codex/'config.toml'
source_servers = tomllib.loads(source_config.read_text(encoding='utf-8-sig')).get('mcp_servers',{}) if source_config.exists() else {}
current = load_json(config_file) if config_file.exists() else {}
if not isinstance(current,dict) or not isinstance(current.get('mcpServers',{}),dict):
    raise SystemExit('Existing mcp_config.json is invalid; no MCP configuration was overwritten.')
servers = current.setdefault('mcpServers',{})
if not isinstance(source_servers,dict):
    raise SystemExit('Source mcp_servers must be a table.')


adaptation_manifest = load_json(pack/'manifest.json')
adapted_hashes = {s['skill_sha256']: item['target'] for item in adaptation_manifest['adaptations'] for s in item.get('sources',[])}
unavailable_names = {x['source_name'] for x in adaptation_manifest['unavailable']}
portable_rows = []
legacy_rows = []
# Validate the complete packaged payload before making any migration changes.
payload_hashes = load_json(pack/'payload-hashes.json')
for relative, expected in payload_hashes.items():
    resource = pack/relative
    if not resource.resolve().is_relative_to(pack) or linked(resource) or not resource.is_file():
        raise SystemExit('Invalid packaged resource: '+relative)
    if hashlib.sha256(resource.read_bytes()).hexdigest() != expected:
        raise SystemExit('Packaged resource changed: '+relative)
for entry in adaptation_manifest['adaptations']:
    if not re.fullmatch(r'agy-[a-z0-9-]{1,59}',entry['target']):
        raise SystemExit('Invalid adapted skill name')
    source = pack/'skills'/entry['target']
    if not source.is_dir():
        raise SystemExit('Missing adapted skill: '+str(source))

def atomic_json(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=p.parent, delete=False, suffix='.codex-sync.tmp') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        temporary = pathlib.Path(f.name)
    try:
        os.replace(temporary, p)
    finally:
        if temporary.exists():
            temporary.unlink()

def skill_files(root):
    files, size = [], 0
    for directory, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in SKIP and not linked(pathlib.Path(directory, d)))
        for name in sorted(names):
            p = pathlib.Path(directory, name)
            if linked(p):
                continue
            if p.suffix.lower() in ('.pyc', '.pyo'):
                continue
            files.append(p)
            size += p.stat().st_size
            if len(files) > MAX_FILES or size > MAX_BYTES:
                raise ValueError('Skill exceeds 3000 files or 100 MiB; review manually')
    return files

# This is a dependency triage, not a proof that a skill works on another host.
HOST_PATTERNS = {
    'OpenAI/internal tool reference': r'\bmcp__|\bartifactSession\b|\bartifact_tool\b|load_workspace_dependencies|\bcua_repl\b|\bnodeRepl\b|@oai/sky|\b(adobe_mandatory_init|boards_create_new_board)\b',
    'Host/runtime-specific path': r'/mnt/data|/home/oai|/opt/pyvenv|\$\{PLUGIN_ROOT\}|\{\{DESKTOP_COMMAND\}\}',
    'External service/tool dependency': r'\b(MCP|OAuth|API[_ -]?KEY|API[_ -]?TOKEN|access[_ -]?token)\b',
    'Platform/toolchain dependency': r'\b(xcode|xcrun|simctl|osascript|swiftpm|docker|pip install|npm install|uvx|npx)\b',
    'Machine-specific path': r'\b[A-Za-z]:[\\/]',
}
def review_reasons(meta, files):
    reasons = set()
    if meta.get('allowed-tools'):
        reasons.add('Declared tool permissions need mapping')
    if any(p.suffix.lower() in ('.py','.js','.mjs','.cjs','.ps1','.sh','.exe','.dll','.node') for p in files):
        reasons.add('Executable helper/runtime needs testing')
    for p in files:
        if p.suffix.lower() not in ('.md','.txt','.json','.yaml','.yml','.toml','.py','.js','.mjs','.cjs','.ps1','.sh'):
            continue
        if p.stat().st_size > 2 * 1024 * 1024:
            reasons.add('Large text resource not inspected')
            continue
        text = p.read_text(encoding='utf-8-sig', errors='replace')
        for label, pattern in HOST_PATTERNS.items():
            if re.search(pattern, text, re.I):
                reasons.add(label)
    return sorted(reasons)

sources = [('user-agents', agents), ('codex-user', codex/'skills'),
           ('codex-plugins', codex/'plugins'/'cache')]
rows, seen_paths, seen_hashes = [], set(), {}
for family, scan_root in sources:
    if not scan_root.is_dir() or linked(scan_root):
        continue
    for directory, dirs, names in os.walk(scan_root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in SKIP and not linked(pathlib.Path(directory, d)))
        if 'SKILL.md' not in names:
            continue
        folder = pathlib.Path(directory)
        if folder in seen_paths:
            continue
        seen_paths.add(folder)
        row = {'source':str(folder), 'source_family':family}
        try:
            text = (folder/'SKILL.md').read_text(encoding='utf-8-sig')
            match = re.match(r'\A---\s*\r?\n(.*?)\r?\n---(?:\r?\n|$)', text, re.S)
            if not match:
                raise ValueError('Missing YAML frontmatter')
            meta = yaml.safe_load(match.group(1))
            if not isinstance(meta, dict) or not isinstance(meta.get('description'), str) or not meta['description'].strip():
                raise ValueError('Missing/non-string description')
            original_name = meta.get('name') or folder.name
            if not isinstance(original_name, str):
                raise ValueError('Non-string skill name')
            files = skill_files(folder)
            digest = hashlib.sha256()
            for file in sorted(files):
                relative = file.relative_to(folder).as_posix()
                digest.update(relative.encode('utf-8') + b'\0')
                digest.update(hashlib.sha256(file.read_bytes()).digest())
            digest = digest.hexdigest()
            slug = re.sub(r'[^a-z0-9-]+','-',original_name.lower()).strip('-')[:45] or 'skill'
            identity = 'gpt-' + slug + '-' + digest[:8]
            row.update(name=original_name, id=identity, sha256=digest, file_count=len(files))
            if digest in seen_hashes:
                row.update(status='duplicate', duplicate_of=seen_hashes[digest])
                rows.append(row)
                continue
            seen_hashes[digest] = identity
            reasons = review_reasons(meta, files)
            if family == 'codex-temporary':
                reasons.append('Temporary/cache source is not an installed skill')
            # Empty reasons means a candidate only; never label this as verified.
            replacement = adapted_hashes.get(hashlib.sha256((folder/'SKILL.md').read_bytes()).hexdigest())
            blocked = original_name.lower() in unavailable_names
            activate = not reasons and not replacement and not blocked
            if replacement:
                reasons.append('Replaced by '+replacement)
            if blocked:
                reasons.append('Host account capability unavailable; see manifest')
            row.update(reasons=reasons, status='candidate-untested' if not reasons else 'needs-review', activate=activate)
            if apply:
                archive = run/'skills'/identity
                archive.mkdir(parents=True)
                for file in files:
                    dest = archive/file.relative_to(folder)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file, dest)
                row['archive'] = str(archive)
                if activate:
                    active = target/identity
                    if active.exists():
                        row['activation_result'] = 'already-present-not-overwritten'
                    else:
                        target.mkdir(parents=True, exist_ok=True)
                        # A fresh staging directory + rename avoids Copy-Item nesting.
                        stage = pathlib.Path(tempfile.mkdtemp(prefix='.gpt-sync-', dir=run))
                        shutil.copytree(archive, stage, dirs_exist_ok=True)
                        meta['name'] = identity  # Do not shadow builtin or user skills.
                        converted = '---\n' + yaml.safe_dump(meta, allow_unicode=True, sort_keys=False).rstrip() + '\n---\n' + text[match.end():]
                        (stage/'SKILL.md').write_text(converted, encoding='utf-8')
                        os.replace(stage, active)
                        row['activation_result'] = 'created'
                    row['active_path'] = str(active)
        except Exception as error:
            row.update(status='error', error=str(error))
        rows.append(row)


for item in adaptation_manifest['adaptations']:
    name = item['target']
    source = pack/'skills'/name
    active = target/name
    portable_row = {'name':name,'capability_status':item['status']}
    if not apply:
        portable_row['installation'] = 'planned' if not active.exists() else 'existing-will-be-compared'
    elif active.exists():
        matches = all((active/f.relative_to(source)).is_file() and hashlib.sha256((active/f.relative_to(source)).read_bytes()).digest()==hashlib.sha256(f.read_bytes()).digest() for f in source.rglob('*') if f.is_file())
        portable_row['installation'] = 'already-current' if matches else 'conflict-preserved-not-overwritten'
    else:
        run.mkdir(parents=True,exist_ok=True)
        target.mkdir(parents=True,exist_ok=True)
        stage = pathlib.Path(tempfile.mkdtemp(prefix='.portable-',dir=run))
        shutil.copytree(source,stage,dirs_exist_ok=True)
        os.replace(stage,active)
        portable_row['installation'] = 'created'
    portable_rows.append(portable_row)

def existing_signature(folder):
    result = {}
    for f in skill_files(folder):
        data=f.read_bytes()
        if f == folder/'SKILL.md':
            text=data.decode('utf-8-sig')
            match=re.match(r'\A---\s*\r?\n(.*?)\r?\n---(?:\r?\n|$)',text,re.S)
            if not match:
                return None
            meta=yaml.safe_load(match.group(1))
            if not isinstance(meta,dict):
                return None
            meta.pop('name',None)
            data=(yaml.safe_dump(meta,sort_keys=True)+text[match.end():].replace('\r\n','\n')).encode('utf-8')
        result[f.relative_to(folder).as_posix()]=hashlib.sha256(data).hexdigest()
    return result

# Retire only byte-equivalent legacy copies, with name normalization for the old
# synchronizer's renamed frontmatter. Modified skills and builtin folders stay intact.
if target.is_dir() and sys.argv[7] != 'True':
    installed={r['name'] for r in portable_rows if r['installation'] in ('created','already-current','planned','existing-will-be-compared')}
    signatures=[(s['file_signature'],e['target']) for e in adaptation_manifest['adaptations'] if e['target'] in installed for s in e.get('sources',[]) ]
    for folder in sorted(target.iterdir()):
        if not folder.is_dir() or linked(folder) or folder.name.startswith('agy-') or not (folder/'SKILL.md').is_file():
            continue
        try:
            signature=existing_signature(folder)
            replacement=next((name for expected,name in signatures if signature==expected),None)
            if replacement:
                legacy={'path':str(folder),'replacement':replacement,'status':'planned-backup-and-disable'}
                if apply:
                    backup=run/'legacy-disabled'/folder.name
                    backup.parent.mkdir(parents=True,exist_ok=True)
                    os.replace(folder,backup)
                    legacy.update(status='backed-up-and-disabled',backup=str(backup))
                legacy_rows.append(legacy)
        except Exception as error:
            legacy_rows.append({'path':str(folder),'status':'preserved-could-not-verify','error':str(error)})

mcp_rows, additions = [], {}
for name, definition in source_servers.items():
    row = {'name':name}
    if name in servers:
        row['status'] = 'existing-preserved'
    elif not isinstance(definition,dict):
        row['status'] = 'invalid-source'
    elif definition.get('enabled', True) is False:
        row['status'] = 'source-disabled-not-imported'
    elif name in ('node_repl','codex_app','artifact_session','cua_repl'):
        row['status'] = 'host-integration-needs-adapter'
    elif definition.get('env_http_headers') or definition.get('bearer_token_env_var'):
        row['status'] = 'auth-mapping-required-no-credentials-exported'
    else:
        entry = {}
        if definition.get('command'):
            for key in ('command','args','env','cwd'):
                if key in definition:
                    entry[key] = definition[key]
            command = os.path.expanduser(os.path.expandvars(entry['command']))
            entry['command'] = command
            if not (shutil.which(command) or pathlib.Path(command).is_file()):
                row.update(status='launcher-missing-not-imported', launcher=command)
                mcp_rows.append(row)
                continue
        elif definition.get('url'):
            entry['url'] = definition['url']
            if definition.get('http_headers'):
                entry['headers'] = definition['http_headers']
        else:
            row['status'] = 'unsupported-transport'
        if entry:
            additions[name] = entry
            row['status'] = 'configured-not-tested' if apply else 'planned-not-tested'
    mcp_rows.append(row)

if apply and additions:
    run.mkdir(parents=True,exist_ok=True)
    if config_file.exists():
        shutil.copy2(config_file,run/'mcp_config.before.json')
    servers.update(additions)
    atomic_json(config_file,current)

report = {'apply':apply,'activate_all':activate_all,'time':stamp,'skills':rows,'mcp':mcp_rows,'portable_skills':portable_rows,'legacy_skills':legacy_rows,'unavailable':adaptation_manifest['unavailable'],
          'limitations':['No MCP server was launched or installed. Tool calls are not tested.',
          'Candidate skills are untested; dependency scanning is conservative and not a compatibility proof.',
          'Built-in GPT cloud services and sign-in/OAuth tokens cannot be cloned by copying skills.',
          'Existing active skills, builtin folders, permissions and existing MCP entries are never overwritten.']}
if apply:
    run.mkdir(parents=True,exist_ok=True)
    atomic_json(run/'report.json',report)
    print('Report and archived skills: ' + str(run))
else:
    print('PLAN ONLY: no files or configuration were changed. Use -Apply to perform migration.')
print('Skills: ' + json.dumps(dict(__import__('collections').Counter(x['status'] for x in rows))))
print('MCP: ' + json.dumps(mcp_rows,ensure_ascii=True))
print('Adapted skills: '+json.dumps(dict(__import__('collections').Counter(x['installation'] for x in portable_rows))))
print('Exact legacy copies backed up/disabled (or planned): '+str(len(legacy_rows)))
print('Unavailable account capabilities: '+str(len(adaptation_manifest['unavailable'])))
if any(x['status']=='error' for x in rows) or any(x['installation']=='conflict-preserved-not-overwritten' for x in portable_rows):
    print('PARTIAL: some skills could not be copied; inspect the report.',file=sys.stderr)
    sys.exit(2)