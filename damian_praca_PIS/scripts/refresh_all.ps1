$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path -LiteralPath "node_modules")) {
  Write-Host "node_modules missing -> npm ci"
  npm ci | Out-Host
}

Write-Host "== 1/4 Layout BPMN =="
node scripts/layout_bpmn.mjs | Out-Host

Write-Host "== 2/4 Export BPMN to PNG/PDF =="
& scripts/export_bpmn.ps1

Write-Host "== 3/4 Export PetriFlow to SVG/PNG =="
node scripts/export_petriflow_svgs.mjs | Out-Host

Copy-Item -LiteralPath schemy/petri/proces1-spustenie.svg -Destination Petriho_siet_Proces_1_Obrazok.svg -Force
Copy-Item -LiteralPath schemy/petri/proces2-monitorovanie.svg -Destination Petriho_siet_Proces_2_Obrazok.svg -Force
Copy-Item -LiteralPath schemy/petri/proces3-porucha.svg -Destination Petriho_siet_Proces_3_Obrazok.svg -Force

Copy-Item -LiteralPath models/petriflow/proces1_spustenie.xml -Destination Petriho_siet_Proces_1.xml -Force
Copy-Item -LiteralPath models/petriflow/proces2_monitorovanie.xml -Destination Petriho_siet_Proces_2.xml -Force
Copy-Item -LiteralPath models/petriflow/proces3_porucha.xml -Destination Petriho_siet_Proces_3.xml -Force

Write-Host "== 4/4 Build LaTeX PDF =="
pdflatex -interaction=nonstopmode -halt-on-error -output-directory doc doc/PIS_dokumentacia.tex | Out-Host
pdflatex -interaction=nonstopmode -halt-on-error -output-directory doc doc/PIS_dokumentacia.tex | Out-Host

Write-Host "Cleaning LaTeX aux files"
Remove-Item -LiteralPath doc/PIS_dokumentacia.aux -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath doc/PIS_dokumentacia.log -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath doc/PIS_dokumentacia.out -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath doc/PIS_dokumentacia.toc -Force -ErrorAction SilentlyContinue

Write-Host "Done -> doc/PIS_dokumentacia.pdf"
