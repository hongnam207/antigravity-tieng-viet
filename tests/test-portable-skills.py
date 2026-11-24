"""Behavioral tests against the actual embedded interpreter and offline payload."""
from pathlib import Path
import subprocess,tempfile,json,hashlib

bundle=Path('build/payload').resolve()
home=Path(tempfile.mkdtemp(prefix='agvi-portable-'))
manager=bundle/'integrations/portable-skills/manage.py'
python=bundle/'runtime/python.exe'
def run(args):
    r=subprocess.run([str(python),'-I',str(manager),*args],capture_output=True,text=True,encoding='utf-8',timeout=180)
    assert r.returncode==0,r.stderr+r.stdout
    return json.loads(r.stdout)
assert run(['--verify'])['skills']==40
first=run(['--home',str(home)])
assert sum(x['status']=='installed' for x in first['skills'])==40
assert all(first['runtime']['imports'].values())
target=home/'.gemini/config/skills'
# Preserve the user's editable reference and custom skill instructions on upgrade.
document=target/'agy-documents/SKILL.md'
document.write_text(document.read_text()+'\nLocal user edit.\n')
before=hashlib.sha256(document.read_bytes()).hexdigest()
second=run(['--home',str(home)])
assert all(x['status']=='existing-preserved' for x in second['skills'])
assert hashlib.sha256(document.read_bytes()).hexdigest()==before
assert len(list(target.glob('*/SKILL.md')))==40
assert not list(target.glob('agy-*/agy-*/SKILL.md'))
runtime=target/'agy-local-runtime'
r=subprocess.run([str(runtime/'.venv/Scripts/python.exe'),str(runtime/'scripts/office.py'),'self-test','--out',str(home/'artifacts')],capture_output=True,text=True,encoding='utf-8',timeout=60)
assert r.returncode==0,r.stderr+r.stdout
assert len(json.loads(r.stdout)['passed'])==4
for template in target.glob('agy-artifact-template-*'):
    config=json.loads((template/'artifact-template.json').read_text())
    source=template/config['reference']
    assert source.is_file() and source.stat().st_size>0
assert len(list(target.glob('agy-artifact-template-*')))==20
print('PASS: embedded offline dependencies; 40 skills installed/reused; user edits retained; no nested directories; local Python and Office/PDF self-test; 20 project template references.')
