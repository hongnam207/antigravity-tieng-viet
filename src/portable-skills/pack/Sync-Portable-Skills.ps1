#requires -Version 5.1
<#
Preview: .\Sync-Portable-Skills.ps1
Apply:   .\Sync-Portable-Skills.ps1 -Apply
Optional isolated dependencies: add -InstallDependencies (requires -Apply).
No bundled MCP server is installed or started. Existing entries are preserved.
#>
[CmdletBinding()]
param(
 [switch]$Apply,
 [switch]$InstallDependencies,
 [switch]$KeepLegacy,
 [string]$CodexHome = "$env:USERPROFILE\.codex",
 [string]$AgentSkills = "$env:USERPROFILE\.agents\skills",
 [string]$GeminiHome = "$env:USERPROFILE\.gemini",
 [string]$Python = 'python'
)
$ErrorActionPreference = 'Stop'
if($InstallDependencies -and -not $Apply){throw '-InstallDependencies requires -Apply.'}
$engine = (Get-Command $Python -ErrorAction Stop).Source
& $engine -c "import sys, yaml; assert sys.version_info >= (3,11), 'Python 3.11+ required'"
if($LASTEXITCODE -ne 0){throw 'Requires Python 3.11+ and PyYAML. Install: python -m pip install PyYAML==6.0.3'}
& $engine -X utf8 (Join-Path $PSScriptRoot 'sync_engine.py') $CodexHome $AgentSkills $GeminiHome ([string][bool]$Apply) 'False' $PSScriptRoot ([string][bool]$KeepLegacy)
if($LASTEXITCODE -ne 0){throw 'Sync incomplete. Read the report; existing conflicts were preserved.'}
if($InstallDependencies){
 $runtime = Join-Path $GeminiHome 'config\skills\agy-local-runtime'
 $venv = Join-Path $runtime '.venv'
 $runtimePython = Join-Path $venv 'Scripts\python.exe'
 if(-not (Test-Path -LiteralPath $runtimePython)){
  if(Test-Path -LiteralPath $venv){throw 'An incomplete .venv already exists. Preserved for inspection; choose a clean runtime directory.'}
  & $engine -m venv $venv
  if($LASTEXITCODE -ne 0){throw 'Could not create isolated Python environment.'}
 }
 & $runtimePython -m pip install --disable-pip-version-check -r (Join-Path $runtime 'requirements.txt')
 if($LASTEXITCODE -ne 0){throw 'Dependency installation failed. Re-run -Apply -InstallDependencies to retry.'}
 & $runtimePython (Join-Path $runtime 'scripts\office.py') doctor
 if($LASTEXITCODE -ne 0){throw 'Runtime check failed.'}
}
