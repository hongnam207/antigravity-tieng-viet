param([string]$Python = 'python')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$lock=Get-Content (Join-Path $PSScriptRoot 'integrations-lock.json') -Raw | ConvertFrom-Json
$stage=Join-Path $root 'build/upstream'
$output=Join-Path $root 'build/integrations'
New-Item -ItemType Directory -Force $stage,$output | Out-Null
$archive=Join-Path $stage ('computer-use-'+$lock.computerUse.version+'.zip')
if(!(Test-Path -LiteralPath $archive)){
    & curl.exe -L --fail --retry 2 --silent --show-error $lock.computerUse.url -o $archive
    if($LASTEXITCODE -ne 0){throw 'Computer Use download failed'}
}
if((Get-FileHash -LiteralPath $archive).Hash.ToLower() -ne $lock.computerUse.sha256){throw 'Computer Use archive hash mismatch; remove the incomplete build cache and retry.'}
$expanded=Join-Path $stage ('computer-use-'+$lock.computerUse.version)
Expand-Archive -LiteralPath $archive -DestinationPath $expanded -Force
$cu=Join-Path $output 'computer-use'
New-Item -ItemType Directory -Force $cu | Out-Null
$upstreamBundle=Join-Path $expanded 'AntigravityComputerUse-windows-x64'
# Keep the entire sealed upstream bundle, including its manifest and notices.
$bundleTarget=Join-Path $cu 'bundle'
New-Item -ItemType Directory -Force $bundleTarget | Out-Null
Copy-Item (Join-Path $upstreamBundle '*') -Destination $bundleTarget -Recurse -Force
$helper=Join-Path $cu 'quick-install.mjs'
& curl.exe -L --fail --retry 2 --silent --show-error $lock.computerUse.helperUrl -o $helper
if($LASTEXITCODE -ne 0 -or (Get-FileHash -LiteralPath $helper).Hash.ToLower() -ne $lock.computerUse.helperSha256){throw 'Computer Use helper hash mismatch'}
$cad=Join-Path $output 'autocad'
$site=Join-Path $cad 'site'
New-Item -ItemType Directory -Force $site | Out-Null
if(!(Test-Path (Join-Path $site 'server.py'))){
    $uv=(Get-Command uv -ErrorAction SilentlyContinue).Source
    if(!$uv){$uv=Join-Path $env:USERPROFILE '.local/bin/uv.exe'}
    & $uv pip install --python $Python --target $site --requirements (Join-Path $PSScriptRoot 'autocad-requirements.txt')
    if($LASTEXITCODE -ne 0){throw 'AutoCAD dependencies failed'}
}
Copy-Item (Join-Path $root 'src/integrations/autocad/launch.py') $cad -Force
& $Python -c 'import importlib.metadata as m,pathlib,sys; site=pathlib.Path(sys.argv[1]); req=pathlib.Path(sys.argv[2]); ds=list(m.distributions(path=[str(site)])); norm=lambda s:s.lower().replace("_","-"); got={norm(d.metadata["Name"]):d.version for d in ds}; expected=dict(line.strip().split("==") for line in req.read_text().splitlines() if line.strip() and not line.startswith("#")); assert all(got.get(norm(k))==v for k,v in expected.items()), "Pinned CAD packages differ"; lines=["Bundled Python dependencies; individual licenses are retained in site/*.dist-info/licenses and LICENSE files."]+[d.metadata["Name"]+" "+d.version+" | "+str(d.metadata.get("License-Expression") or d.metadata.get("License") or "See distribution license files")[:300] for d in ds]; (site.parent/"THIRD-PARTY-NOTICES.txt").write_text("\n".join(lines),encoding="utf-8")' $site (Join-Path $PSScriptRoot 'autocad-requirements.txt')
if($LASTEXITCODE -ne 0){throw 'CAD dependency verification failed'}
Copy-Item (Join-Path $PSScriptRoot 'integrations-lock.json') (Join-Path $output 'SOURCES.json') -Force
Write-Output 'Pinned AutoCAD and Computer Use payloads prepared (offline installation).'
