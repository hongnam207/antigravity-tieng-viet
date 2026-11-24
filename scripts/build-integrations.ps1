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
& $Python (Join-Path $PSScriptRoot 'python-notices.py') $site (Join-Path $PSScriptRoot 'autocad-requirements.txt')
if($LASTEXITCODE -ne 0){throw 'CAD dependency verification failed'}
Copy-Item (Join-Path $PSScriptRoot 'integrations-lock.json') (Join-Path $output 'SOURCES.json') -Force
$extraTarget=Join-Path $output 'extra-mcps'
New-Item -ItemType Directory -Force $extraTarget | Out-Null
Copy-Item (Join-Path $root 'src/integrations/extra-mcps/*') $extraTarget -Force
$officeSite=Join-Path $output 'portable-skills/site'
New-Item -ItemType Directory -Force $officeSite | Out-Null
$uv=(Get-Command uv -ErrorAction SilentlyContinue).Source
if(!$uv){$uv=Join-Path $env:USERPROFILE '.local/bin/uv.exe'}
& $uv pip install --python $Python --target $officeSite --requirements (Join-Path $PSScriptRoot 'office-requirements.txt')
if($LASTEXITCODE -ne 0){throw 'Portable Office dependency build failed'}
& $Python (Join-Path $PSScriptRoot 'prepare-portable-skills.py') $officeSite
if($LASTEXITCODE -ne 0){throw 'Portable skills preparation failed'}
& $Python (Join-Path $PSScriptRoot 'python-notices.py') $officeSite (Join-Path $PSScriptRoot 'office-requirements.txt')
if($LASTEXITCODE -ne 0){throw 'Office notices generation failed'}
Write-Output 'Pinned AutoCAD and Computer Use payloads prepared (offline installation).'
