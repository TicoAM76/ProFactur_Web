param(
  [string]$ApiBase = "http://localhost:3001",
  [Parameter(Mandatory = $true)]
  [string]$CompanyId,
  [Parameter(Mandatory = $true)]
  [string]$DraftId
)

$ErrorActionPreference = "Stop"

$ApiBase = $ApiBase.TrimEnd("/")

Write-Host "Creando documento DEMO..."
$document = Invoke-RestMethod `
  -Method Post `
  -Uri "$ApiBase/companies/$CompanyId/invoice-drafts/$DraftId/demo-document"

$documentId = $document.id
$fullNumber = $document.fullNumber

Write-Host "Documento: $fullNumber"
Write-Host "ID: $documentId"

Write-Host "`nComprobando readiness..."
$readiness = Invoke-RestMethod `
  -Method Get `
  -Uri "$ApiBase/companies/$CompanyId/demo-documents/$documentId/readiness"

$readiness | ConvertTo-Json -Depth 10

$pdfPath = Join-Path $PWD "$fullNumber.pdf"
$xmlPath = Join-Path $PWD "$fullNumber.xml"

Write-Host "`nDescargando PDF..."
Invoke-WebRequest `
  -Uri "$ApiBase/companies/$CompanyId/demo-documents/$documentId/pdf" `
  -OutFile $pdfPath

Write-Host "Descargando XML..."
Invoke-WebRequest `
  -Uri "$ApiBase/companies/$CompanyId/demo-documents/$documentId/xml" `
  -OutFile $xmlPath

Write-Host "`nArchivos:"
Get-Item $pdfPath, $xmlPath |
  Select-Object FullName, Length

Write-Host "`nQR interno:"
Write-Host $document.qrUrl
