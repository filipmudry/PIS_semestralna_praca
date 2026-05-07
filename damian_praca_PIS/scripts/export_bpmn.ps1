$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

$sources = @(
  @{ in = "models/bpmn/layouted/proces1_spustenie.bpmn"; outBase = "schemy/bpmn/proces1-spustenie" },
  @{ in = "models/bpmn/layouted/proces2_monitorovanie.bpmn"; outBase = "schemy/bpmn/proces2-monitorovanie" },
  @{ in = "models/bpmn/layouted/proces3_porucha.bpmn"; outBase = "schemy/bpmn/proces3-porucha" }
)

foreach ($s in $sources) {
  $inPath = $s.in
  $outBase = $s.outBase
  $arg = "$inPath;$outBase.png,$outBase.pdf"
  Write-Host "Exporting $inPath -> $outBase.(png/pdf)"
  npx bpmn-to-image "$arg" | Out-Host
}

Write-Host "Done."
