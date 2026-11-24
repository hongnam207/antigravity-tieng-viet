"""Validate a pinned target and retain package names/licenses without shell quoting."""
import importlib.metadata as metadata
from pathlib import Path
import sys

site=Path(sys.argv[1])
requirements=Path(sys.argv[2])
distributions=list(metadata.distributions(path=[str(site)]))
def normalize(value):
    return value.lower().replace('_','-')
versions={normalize(d.metadata['Name']):d.version for d in distributions}
expected=dict(line.strip().split('==') for line in requirements.read_text().splitlines() if line.strip() and not line.startswith('#'))
assert all(versions.get(normalize(k))==v for k,v in expected.items()),'Pinned package version mismatch'
lines=['Bundled Python dependencies; individual licenses are retained in distribution metadata and LICENSE files.']
lines.extend(d.metadata['Name']+' '+d.version+' | '+str(d.metadata.get('License-Expression') or d.metadata.get('License') or 'See distribution license files')[:300] for d in distributions)
(site.parent/'THIRD-PARTY-NOTICES.txt').write_text('\n'.join(lines),encoding='utf-8')
