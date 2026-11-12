<#
.SYNOPSIS
    Configura las URLs de la App Function en las propiedades del web part «GM SPA» de una página.

.DESCRIPTION
    La SPA ocupa toda la página y, en algunas páginas, SharePoint no deja entrar al modo edición ni
    abrir el panel de propiedades. Este script escribe las propiedades directamente en la página:

      - concOperadorRenovableUrlMeteologicaFacilities → GET  /api/meteologica-facilities?code=<llave>
      - concOperadorRenovableUrlPeriodos              → /api/concentrador-periodos?code=<llave> (indisponibilidades
                                                        con fecha estimada de fin, Planificación, bitácoras y limitaciones;
                                                        la misma llave sirve para todos los endpoints)
      - concSolicitudesIlUrlResumenIa                 → POST /api/ai/summarize-text?code=<llave> (botón «Resumir con IA»
                                                        de Gestionar en Solicitudes IL)

    Lee las propiedades actuales del web part y solo cambia esas, para no borrar las demás
    (Solicitudes IL: tareas, acciones, Excel, SIOD). Luego vuelve a publicar la página.

.PARAMETER FunctionHost
    Host de la Function App, sin https:// ni /api. Lleva un sufijo único; se obtiene con:
      az resource show -g <rg> -n <app> --resource-type Microsoft.Web/sites --query properties.defaultHostName -o tsv

.PARAMETER FunctionKey
    Llave de la Function App:
      az functionapp keys list -n <app> -g <rg> --query functionKeys.default -o tsv

.PARAMETER Simular
    Muestra las propiedades actuales y las nuevas sin guardar ni publicar.

.EXAMPLE
    $env:ENTRAID_CLIENT_ID = "<client-id>"
    ./scripts/configurar-propiedades-webpart.ps1 -SiteUrl "https://novakemcl.sharepoint.com/sites/geme" `
      -FunctionHost "af-geme-cope-hgfpdfe4cth2avck.westus-01.azurewebsites.net" -FunctionKey "<llave>" -Simular

.REQUIREMENTS
    Install-Module PnP.PowerShell -RequiredVersion 2.x
    ClientId de una App Registration de TU tenant (variable ENTRAID_CLIENT_ID o -ClientId).
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [Parameter(Mandatory = $true)]
    [string]$FunctionHost,

    [Parameter(Mandatory = $true)]
    [string]$FunctionKey,

    [string]$Page = "index-spa",

    [string]$ClientId = $env:ENTRAID_CLIENT_ID,

    [string]$Tenant = $env:ENTRAID_TENANT,

    [switch]$Simular,

    [switch]$UseDeviceLogin
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Id del web part «GM SPA» (GemeSpaWebPart.manifest.json)
$WebPartId = "3cf86e14-2dd7-4ea4-b09d-b3e57d9baa4f"

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell no está instalado. Ejecuta: Install-Module PnP.PowerShell -Scope CurrentUser"
}

Import-Module PnP.PowerShell

if ([string]::IsNullOrWhiteSpace($ClientId)) {
    throw "Falta ClientId de Entra ID: `$env:ENTRAID_CLIENT_ID = '<guid>' o -ClientId '<guid>'."
}

$hostLimpio = $FunctionHost.Trim() -replace '^https?://', '' -replace '/.*$', ''
$base = "https://$hostLimpio/api"
$codigo = [uri]::EscapeDataString($FunctionKey.Trim())
$nuevas = [ordered]@{
    concOperadorRenovableUrlMeteologicaFacilities = "$base/meteologica-facilities?code=$codigo"
    concOperadorRenovableUrlPeriodos              = "$base/concentrador-periodos?code=$codigo"
    concSolicitudesIlUrlResumenIa                 = "$base/ai/summarize-text?code=$codigo"
}

# ── Conexión ───────────────────────────────────────────────────────────────────

Write-Host "`nConectando a $SiteUrl..." -ForegroundColor Cyan
$conexion = @{ Url = $SiteUrl; ClientId = $ClientId }
if (-not [string]::IsNullOrWhiteSpace($Tenant)) {
    $conexion.Tenant = $Tenant
}
if ($UseDeviceLogin) {
    Connect-PnPOnline @conexion -DeviceLogin
} else {
    Connect-PnPOnline @conexion -Interactive
}
Write-Host "Conectado.`n" -ForegroundColor Cyan

# ── Web part ───────────────────────────────────────────────────────────────────

$componentes = @(Get-PnPPageComponent -Page $Page | Where-Object { "$($_.WebPartId)" -eq $WebPartId })
if ($componentes.Count -eq 0) {
    throw "La página '$Page' no tiene el web part GM SPA ($WebPartId)."
}
if ($componentes.Count -gt 1) {
    Write-Host "  [!] La página tiene $($componentes.Count) web parts GM SPA; se configura el primero." -ForegroundColor Yellow
}
$webPart = $componentes[0]

$propiedades = if ([string]::IsNullOrWhiteSpace($webPart.PropertiesJson)) {
    [pscustomobject]@{}
} else {
    $webPart.PropertiesJson | ConvertFrom-Json
}

Write-Host "Propiedades actuales del web part ($($webPart.InstanceId)):" -ForegroundColor Cyan
$propiedades | Format-List | Out-String | Write-Host

foreach ($clave in $nuevas.Keys) {
    $propiedades | Add-Member -Force -NotePropertyName $clave -NotePropertyValue $nuevas[$clave]
}

Write-Host "Valores nuevos:" -ForegroundColor Cyan
foreach ($clave in $nuevas.Keys) {
    Write-Host "  $clave = $($nuevas[$clave] -replace 'code=.*$', 'code=<llave>')"
}

if ($Simular) {
    Write-Host "`n-Simular: no se guardó nada." -ForegroundColor Yellow
    return
}

Set-PnPPageWebPart -Page $Page -Identity $webPart.InstanceId -PropertiesJson ($propiedades | ConvertTo-Json -Depth 10 -Compress)
Write-Host "  [+] Propiedades guardadas" -ForegroundColor Green

Set-PnPPage -Identity $Page -Publish | Out-Null
Write-Host "  [+] Página '$Page' publicada" -ForegroundColor Green
Write-Host "`nRecarga la página para que el web part tome las URLs." -ForegroundColor Cyan
