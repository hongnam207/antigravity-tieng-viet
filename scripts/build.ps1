param([string]$PayloadZip = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$buildDir = Join-Path $root 'build'
$distDir = Join-Path $root 'dist'
New-Item -ItemType Directory -Force $buildDir,$distDir | Out-Null
if (!$PayloadZip) {
    $PayloadZip = Join-Path $buildDir 'payload.zip'
    if (!(Test-Path -LiteralPath $PayloadZip)) {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest 'https://github.com/hongnam207/antigravity-tieng-viet/releases/download/v2.0.3/payload.zip' -OutFile $PayloadZip -UseBasicParsing
    }
}
$expected = '7DEFBEDB7C79EB39AF9B157182086F6FDE8204F38D32AA2C17055DC668CBC229'
if ((Get-FileHash -LiteralPath $PayloadZip -Algorithm SHA256).Hash -ne $expected) { throw 'Payload SHA-256 mismatch.' }
$payloadDir = Join-Path $buildDir 'payload'
Expand-Archive -LiteralPath $PayloadZip -DestinationPath $payloadDir -Force
Copy-Item (Join-Path $root 'src/payload/*') $payloadDir -Force
$packed = Join-Path $buildDir 'payload-build.zip'
Compress-Archive -Path (Join-Path $payloadDir '*') -DestinationPath $packed -Force
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (!(Test-Path -LiteralPath $compiler)) { throw '.NET Framework x64 C# compiler not found.' }
$output = Join-Path $distDir 'Antigravity-Tieng-Viet-Offline-Setup-x64-v2.0.3.exe'
$compileArgs = @('/nologo','/target:winexe','/platform:x64','/optimize+','/codepage:65001',
    '/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll',
    '/reference:System.IO.Compression.dll','/reference:System.IO.Compression.FileSystem.dll',
    '/reference:Microsoft.CSharp.dll',('/resource:'+$packed+',payload.zip'),
    ('/out:'+$output),(Join-Path $root 'src/Installer.cs'))
& $compiler $compileArgs
if ($LASTEXITCODE -ne 0) { throw 'C# compilation failed.' }
Get-FileHash -LiteralPath $output -Algorithm SHA256
Write-Host "Built: $output"
