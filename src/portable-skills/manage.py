"""Install the project's portable skills using only bundled dependencies."""
import argparse
import hashlib
import importlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import datetime
import time

ROOT=Path(__file__).resolve().parent
BUNDLE=ROOT.parent.parent
SITE=ROOT/'site'
sys.path.insert(0,str(SITE))

def publish_directory(source,destination):
    # Windows scanners can briefly keep handles open after DOCX/EXE extraction.
    # Retry only transient permission errors; never delete/overwrite a competing target.
    for attempt in range(7):
        if destination.exists():
            raise FileExistsError('Skill destination appeared during install: '+str(destination))
        try:
            os.replace(source,destination)
            return
        except PermissionError:
            if attempt==6:
                raise
            time.sleep(min(0.1*(2**attempt),2))

def verify():
    pack=ROOT/'pack'
    manifest=json.loads((pack/'manifest.json').read_text(encoding='utf-8'))
    assert len(manifest['adaptations'])==40
    for relative,expected in json.loads((pack/'payload-hashes.json').read_text()).items():
        f=pack/relative
        assert f.resolve().is_relative_to(pack.resolve()) and f.is_file(),relative
        assert hashlib.sha256(f.read_bytes()).hexdigest()==expected,relative
    for module in ('docx','openpyxl','pptx','pymupdf','pypdf','reportlab','PIL','matplotlib'):
        importlib.import_module(module)
    return {'verified':True,'skills':40,'runtime':'bundled','project_templates':20}

def make_runtime(skill_root):
    runtime=skill_root/'agy-local-runtime'
    scripts=runtime/'.venv/Scripts'
    python=scripts/'python.exe'
    if python.is_file() and not (scripts/'agvi-runtime.json').is_file():
        return {'preserved_existing_python':True}
    scripts.mkdir(parents=True,exist_ok=True)
    source=BUNDLE/'runtime'
    # Copy only the embedded interpreter's top-level files; dependencies remain
    # in the installed bundle, never in a uv/npm cache or build-machine venv.
    for f in source.iterdir():
        if f.is_file() and f.suffix.lower() in ('.exe','.dll','.pyd','.zip','.txt'):
            shutil.copy2(f,scripts/f.name)
    stdlib=next(source.glob('python3*.zip'))
    pth=next(source.glob('python3*._pth'))
    (scripts/pth.name).write_text('\n'.join([str(stdlib),str(source),str(SITE),'import site','']),encoding='utf-8')
    (scripts/'agvi-runtime.json').write_text(json.dumps({'bundle':str(BUNDLE),'site':str(SITE),'version':'2.3.0'}),encoding='utf-8')
    result=subprocess.run([str(python),str(runtime/'scripts/office.py'),'doctor'],capture_output=True,text=True,encoding='utf-8',timeout=60)
    if result.returncode:
        raise RuntimeError(result.stderr)
    doctor=json.loads(result.stdout)
    if not all(doctor['imports'].values()):
        raise RuntimeError('Missing bundled Office dependencies: '+result.stdout)
    return doctor

def install(home, sync=False):
    verify()
    home=Path(home).resolve()
    target=home/'.gemini/config/skills'
    stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backups=home/'.gemini/codex-sync'/('installer-'+stamp)
    target.mkdir(parents=True,exist_ok=True)
    if sync:
        # The isolated embedded runtime already contains PyYAML. Source skill
        # resources and authentication values are copied only on this machine.
        command=[sys.executable,'-I',str(ROOT/'pack/sync_engine.py'),str(home/'.codex'),str(home/'.agents/skills'),str(home/'.gemini'),'True','False',str(ROOT/'pack'),'False']
        completed=subprocess.run(command,capture_output=True,text=True,encoding='utf-8',timeout=240)
        if completed.returncode:
            raise RuntimeError('Sync incomplete; inspect the report.\n'+completed.stdout+'\n'+completed.stderr)
    rows=[]
    for source in sorted((ROOT/'pack/skills').iterdir()):
        if not source.is_dir():
            continue
        active=target/source.name
        if active.exists():
            # Existing references may be the user's original Office templates.
            # Never replace user edits or their editable references with defaults.
            rows.append({'skill':source.name,'status':'existing-preserved'})
            continue
        backups.mkdir(parents=True,exist_ok=True)
        staged=Path(tempfile.mkdtemp(prefix='.install-',dir=backups))
        shutil.copytree(source,staged,dirs_exist_ok=True)
        publish_directory(staged,active)
        rows.append({'skill':source.name,'status':'installed'})
    runtime=make_runtime(target)
    report={'version':'2.3.0','skills':rows,'runtime':runtime,'sync_requested':sync}
    backups.mkdir(parents=True,exist_ok=True)
    (backups/'installed-skills.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--verify',action='store_true')
    p.add_argument('--sync',action='store_true')
    p.add_argument('--home',default=str(Path.home()))
    a=p.parse_args()
    try:
        print(json.dumps(verify() if a.verify else install(a.home,a.sync),ensure_ascii=True))
    except Exception as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
