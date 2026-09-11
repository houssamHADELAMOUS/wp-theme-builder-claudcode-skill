# Install the wordpress-theme-builder skill into ~/.claude/skills
# Usage: .\install.ps1 [-Copy] [-Uninstall]

param(
	[switch]$Copy,
	[switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'skill'
$skillsDir = Join-Path $env:USERPROFILE '.claude\skills'
$target = Join-Path $skillsDir 'wordpress-theme-builder'

if ($Uninstall) {
	if (Test-Path $target) {
		Remove-Item -Recurse -Force $target
		Write-Host "Removed $target"
	} else {
		Write-Host "Nothing installed at $target"
	}
	exit 0
}

if (-not (Test-Path (Join-Path $source 'SKILL.md'))) {
	Write-Error "skill/SKILL.md not found next to this script."
}

New-Item -ItemType Directory -Force $skillsDir | Out-Null

if (Test-Path $target) {
	Remove-Item -Recurse -Force $target
}

if ($Copy) {
	Copy-Item -Recurse $source $target
	Write-Host "Copied skill to $target"
} else {
	try {
		New-Item -ItemType SymbolicLink -Path $target -Target $source | Out-Null
		Write-Host "Symlinked $target -> $source"
	} catch {
		Write-Warning "Symlink failed (enable Developer Mode or run as admin). Falling back to copy."
		Copy-Item -Recurse $source $target
		Write-Host "Copied skill to $target"
	}
}

Write-Host ""
Write-Host "Restart Claude Code. Try: /wordpress-theme-builder new my-theme"
