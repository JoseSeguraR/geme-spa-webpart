<#
.SYNOPSIS
    Provisiona las listas del Operador renovable (COR Conecta › Concentrador) en el sitio destino.

.DESCRIPTION
    Crea las listas, columnas e índices que usan el web part (vistas del Operador renovable) y la
    App Function geme-cope-app-function:

      1. CONC_MANTENEDOR_INSTALACIONES  → columna FACILITY_ID_METEOLOGICA (la lista ya existe)
      2. CONC_MANTENEDOR_SUBEQUIPOS
      3. CONC_LISTA_INDISPONIBILIDADES
      4. CONC_LISTA_LIMITACIONESRED
      5. Índices

    Las bitácoras (CONC_LISTA_BITACORA_SUBEQUIPO y CONC_LISTA_BITACORA_SUBESTACION) ya no son listas: desde el
    10-11-2026 están en la BD de la App Function (app.concentrador_bitacora_subequipo y
    app.concentrador_bitacora_limitacion), por volumen. El script ya no las crea; con -EliminarListasBitacora
    las borra del sitio (pide confirmación; no se migran sus filas).

    Opcional: carga FACILITY_ID_METEOLOGICA por CODIGO de central (-FacilityIdsMeteologica).

    Idempotente: si una lista, columna, opción o índice ya existe, lo omite sin error. No modifica columnas
    existentes con otro tipo, no borra columnas obsoletas y no carga subequipos.

    Fuente del esquema: geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/
    cambios-produccion/readme.md §6.1, y capacidad-central/readme.md.

.PARAMETER SiteUrl
    URL del sitio SharePoint del Concentrador. Ejemplo: https://novakemcl.sharepoint.com/sites/geme

.PARAMETER Tenant
    Tenant donde está registrada la app de -ClientId (dominio o GUID). Obligatorio si tu cuenta es invitada en
    ese tenant: sin él, el inicio de sesión va a tu tenant de origen y falla con AADSTS700016.
    Ejemplo: novakemcl.onmicrosoft.com

.PARAMETER FacilityIdsMeteologica
    CODIGO de la central → facilityId de Meteológica (GET /api/meteologica-facilities de la App Function).
    Solo llena las centrales con la columna vacía; no pisa un valor distinto.

.EXAMPLE
    $env:ENTRAID_CLIENT_ID = "<client-id>"
    ./scripts/provision-operador-renovable.ps1 -SiteUrl "https://novakemcl.sharepoint.com/sites/geme" `
      -Tenant "novakemcl.onmicrosoft.com"

.EXAMPLE
    ./scripts/provision-operador-renovable.ps1 -SiteUrl "https://novakemcl.sharepoint.com/sites/geme" `
      -FacilityIdsMeteologica @{ "CEME1" = "GeneradoraMetropolitana_CEME1" }

.EXAMPLE
    # Borra CONC_LISTA_BITACORA_SUBEQUIPO y CONC_LISTA_BITACORA_SUBESTACION (a la papelera; pide confirmación)
    ./scripts/provision-operador-renovable.ps1 -SiteUrl "https://novakemcl.sharepoint.com/sites/geme" `
      -EliminarListasBitacora -UseDeviceLogin

.REQUIREMENTS
    Install-Module PnP.PowerShell -RequiredVersion 2.x
    ClientId de una App Registration de TU tenant (variable ENTRAID_CLIENT_ID o -ClientId).
    Deben existir antes: CONC_MANTENEDOR_INSTALACIONES, CONC_MANTENEDOR_EQUIPOS, CONC_MANTENEDOR_TIPOSEQUIPOS,
    CONC_LISTA_CONCENTRADOR y CONC_LISTA_SOLICITUDFALLA (las crea el Concentrador; este script no).
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [string]$ClientId = $env:ENTRAID_CLIENT_ID,

    [string]$Tenant = $env:ENTRAID_TENANT,

    [hashtable]$FacilityIdsMeteologica = @{},

    [switch]$EliminarListasBitacora,

    [switch]$UseDeviceLogin
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell no está instalado. Ejecuta: Install-Module PnP.PowerShell -Scope CurrentUser"
}

Import-Module PnP.PowerShell

if ([string]::IsNullOrWhiteSpace($ClientId)) {
    throw @"
Falta ClientId de Entra ID para este tenant.

  1) Variable de entorno:  `$env:ENTRAID_CLIENT_ID = '<guid>'
  2) Parámetro:            -ClientId '<guid>'
  3) Registrar una app (una vez, requiere admin Entra ID):
       Register-PnPEntraIDAppForInteractiveLogin -ApplicationName 'GEME PnP Local' -Tenant <tenant>.onmicrosoft.com
"@
}

$ListaInstalaciones = "CONC_MANTENEDOR_INSTALACIONES"
$ListaEquipos = "CONC_MANTENEDOR_EQUIPOS"
$ListaTiposEquipos = "CONC_MANTENEDOR_TIPOSEQUIPOS"
$ListaConcentrador = "CONC_LISTA_CONCENTRADOR"
$ListaSolicitudFalla = "CONC_LISTA_SOLICITUDFALLA"
$ListaSubequipos = "CONC_MANTENEDOR_SUBEQUIPOS"
$ListaIndisponibilidades = "CONC_LISTA_INDISPONIBILIDADES"
$ListaLimitaciones = "CONC_LISTA_LIMITACIONESRED"
# Solo para -EliminarListasBitacora (las bitácoras están en la BD de la App Function)
$ListaBitacoraSubequipo = "CONC_LISTA_BITACORA_SUBEQUIPO"
$ListaBitacoraSubestacion = "CONC_LISTA_BITACORA_SUBESTACION"

# ── Helpers ────────────────────────────────────────────────────────────────────

function Ensure-List {
    param([string]$Title)
    $list = Get-PnPList -Identity $Title -ErrorAction SilentlyContinue
    if (-not $list) {
        New-PnPList -Title $Title -Template GenericList -OnQuickLaunch:$false | Out-Null
        Write-Host "  [+] Lista creada: $Title" -ForegroundColor Green
    } else {
        Write-Host "  [~] Lista ya existe: $Title" -ForegroundColor Yellow
    }
}

function Assert-ListExists {
    param([string]$Title)
    if (-not (Get-PnPList -Identity $Title -ErrorAction SilentlyContinue)) {
        throw "No existe la lista '$Title' en $SiteUrl. Este script la necesita para sus búsquedas y no la crea."
    }
}

function Ensure-OptionalTitle {
    param([string]$List)
    $titleField = Get-PnPField -List $List -Identity "Title"
    if ($titleField.Required) {
        Set-PnPField -List $List -Identity "Title" -Values @{ Required = $false } | Out-Null
        Write-Host "    [+] Campo Title configurado como opcional"
    }
}

function Add-FieldXmlIfMissing {
    param([string]$List, [string]$Name, [string]$Xml, [string]$Detalle = "")
    if (Get-PnPField -List $List -Identity $Name -ErrorAction SilentlyContinue) {
        return
    }
    Add-PnPFieldFromXml -List $List -FieldXml $Xml | Out-Null
    Write-Host "    [+] Campo: $Name$Detalle"
}

function Required-Attr {
    param([bool]$Required)
    return "Required='" + $Required.ToString().ToUpper() + "'"
}

function Ensure-TextField {
    param([string]$List, [string]$Name, [switch]$Required, [switch]$MultiLine)
    $tipo = if ($MultiLine) { "Note' NumLines='6' RichText='FALSE" } else { "Text" }
    Add-FieldXmlIfMissing -List $List -Name $Name -Xml (
        "<Field Type='$tipo' DisplayName='$Name' Name='$Name' StaticName='$Name' $(Required-Attr $Required)/>")
}

function Ensure-NumberField {
    param([string]$List, [string]$Name, [switch]$Required)
    Add-FieldXmlIfMissing -List $List -Name $Name -Xml (
        "<Field Type='Number' DisplayName='$Name' Name='$Name' StaticName='$Name' Decimals='3' $(Required-Attr $Required)/>")
}

function Ensure-DateTimeField {
    param([string]$List, [string]$Name, [switch]$Required)
    Add-FieldXmlIfMissing -List $List -Name $Name -Xml (
        "<Field Type='DateTime' Format='DateTime' DisplayName='$Name' Name='$Name' StaticName='$Name' $(Required-Attr $Required)/>")
}

function Ensure-ChoiceField {
    param([string]$List, [string]$Name, [string[]]$Choices, [switch]$Required, [string]$Default = "")
    $field = Get-PnPField -List $List -Identity $Name -ErrorAction SilentlyContinue
    if (-not $field) {
        $choiceXml = ($Choices | ForEach-Object { "<CHOICE>$([System.Security.SecurityElement]::Escape($_))</CHOICE>" }) -join ""
        $defaultXml = if ($Default) { "<Default>$([System.Security.SecurityElement]::Escape($Default))</Default>" } else { "" }
        Add-PnPFieldFromXml -List $List -FieldXml (
            "<Field Type='Choice' DisplayName='$Name' Name='$Name' StaticName='$Name' $(Required-Attr $Required) " +
            "FillInChoice='FALSE'><CHOICES>$choiceXml</CHOICES>$defaultXml</Field>") | Out-Null
        Write-Host "    [+] Campo: $Name"
        return
    }
    $faltantes = $Choices | Where-Object { $_ -notin $field.Choices }
    if ($faltantes) {
        Set-PnPField -List $List -Identity $Name -Values @{ Choices = @($field.Choices) + @($faltantes) } | Out-Null
        Write-Host "    [+] Opciones agregadas a ${Name}: $($faltantes -join ', ')"
    }
}

function Ensure-LookupField {
    param([string]$List, [string]$Name, [string]$LookupList, [string]$ShowField = "Title", [switch]$Required)
    if (Get-PnPField -List $List -Identity $Name -ErrorAction SilentlyContinue) {
        return
    }
    $destino = Get-PnPList -Identity $LookupList
    Add-FieldXmlIfMissing -List $List -Name $Name -Detalle " (lookup → $LookupList.$ShowField)" -Xml (
        "<Field Type='Lookup' DisplayName='$Name' Name='$Name' StaticName='$Name' $(Required-Attr $Required) " +
        "List='{$($destino.Id)}' ShowField='$ShowField'/>")
}

function Ensure-UserField {
    param([string]$List, [string]$Name, [switch]$Required)
    Add-FieldXmlIfMissing -List $List -Name $Name -Xml (
        "<Field Type='User' DisplayName='$Name' Name='$Name' StaticName='$Name' $(Required-Attr $Required) " +
        "UserSelectionMode='0' UserSelectionScope='0'/>")
}

function Ensure-Index {
    param([string]$List, [string]$Name)
    $field = Get-PnPField -List $List -Identity $Name -ErrorAction SilentlyContinue
    if (-not $field) {
        Write-Warning "    [!] Índice omitido, campo no existe: $List/$Name"
        return
    }
    if ($field.Indexed) {
        Write-Host "    [~] Índice ya existe: $List/$Name" -ForegroundColor Yellow
        return
    }
    Set-PnPField -List $List -Identity $Name -Values @{ Indexed = $true } | Out-Null
    Write-Host "    [+] Índice: $List/$Name" -ForegroundColor Green
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

foreach ($previa in @($ListaInstalaciones, $ListaEquipos, $ListaTiposEquipos, $ListaConcentrador, $ListaSolicitudFalla)) {
    Assert-ListExists -Title $previa
}

# ── 1. CONC_MANTENEDOR_INSTALACIONES (ya existe) ───────────────────────────────

Write-Host "1/5  $ListaInstalaciones" -ForegroundColor Cyan
# ID de la central en Meteológica: lo lee la App Function para enviar la capacidad y el web part para
# mostrar la capacidad instalada en Meteológica.
Ensure-TextField -List $ListaInstalaciones -Name "FACILITY_ID_METEOLOGICA"

# ── 2. CONC_MANTENEDOR_SUBEQUIPOS ──────────────────────────────────────────────
# Estado vigente de cada subequipo (inversor, aerogenerador, batería); la historia va en su bitácora.

Write-Host "2/5  $ListaSubequipos" -ForegroundColor Cyan
Ensure-List -Title $ListaSubequipos
Ensure-OptionalTitle -List $ListaSubequipos
Ensure-TextField     -List $ListaSubequipos -Name "NOMBRE" -Required
Ensure-LookupField   -List $ListaSubequipos -Name "EQUIPO" -LookupList $ListaEquipos -ShowField "EQUIPO" -Required
# Repite la central del equipo para filtrar por central en una llamada (SharePoint no filtra lookup de lookup)
Ensure-LookupField   -List $ListaSubequipos -Name "INSTALACION" -LookupList $ListaInstalaciones -ShowField "INSTALACION" -Required
Ensure-TextField     -List $ListaSubequipos -Name "CODIGO" -Required
Ensure-TextField     -List $ListaSubequipos -Name "CODIGO_INTEGRACION"
Ensure-LookupField   -List $ListaSubequipos -Name "TIPOEQUIPO" -LookupList $ListaTiposEquipos -ShowField "TIPOEQUIPO" -Required
Ensure-NumberField   -List $ListaSubequipos -Name "CAPACIDAD_MAXIMA_MW" -Required
# Capacidades parciales permitidas, separadas por coma (0 siempre es opción y no se guarda)
Ensure-TextField     -List $ListaSubequipos -Name "CAPACIDADES_MW"
Ensure-NumberField   -List $ListaSubequipos -Name "CAPACIDAD_ACTUAL_MW" -Required
Ensure-ChoiceField   -List $ListaSubequipos -Name "ESTADO" -Required -Choices @("Activo", "Inactivo", "Baja") -Default "Activo"
Ensure-ChoiceField   -List $ListaSubequipos -Name "DISPONIBILIDAD" -Required -Choices @("Disponible", "Indisponible") -Default "Disponible"
Ensure-ChoiceField   -List $ListaSubequipos -Name "MOTIVO" -Choices @("Falla", "Trabajo")
Ensure-TextField     -List $ListaSubequipos -Name "DESCRIPCION" -MultiLine
Ensure-DateTimeField -List $ListaSubequipos -Name "FECHA_INDISPONIBILIDAD"

# ── 3. CONC_LISTA_INDISPONIBILIDADES ───────────────────────────────────────────
# Subequipos que deja fuera cada solicitud (la llena el formulario de la solicitud, no el operador).

Write-Host "3/5  $ListaIndisponibilidades" -ForegroundColor Cyan
Ensure-List -Title $ListaIndisponibilidades
Ensure-OptionalTitle -List $ListaIndisponibilidades
Ensure-LookupField   -List $ListaIndisponibilidades -Name "ID_SOLICITUD" -LookupList $ListaConcentrador -Required
Ensure-LookupField   -List $ListaIndisponibilidades -Name "EQUIPO" -LookupList $ListaEquipos -ShowField "EQUIPO" -Required
Ensure-LookupField   -List $ListaIndisponibilidades -Name "SUBEQUIPO" -LookupList $ListaSubequipos -ShowField "CODIGO" -Required
Ensure-LookupField   -List $ListaIndisponibilidades -Name "TIPOEQUIPO" -LookupList $ListaTiposEquipos -ShowField "TIPOEQUIPO" -Required
Ensure-LookupField   -List $ListaIndisponibilidades -Name "INSTALACION" -LookupList $ListaInstalaciones -ShowField "INSTALACION" -Required
Ensure-NumberField   -List $ListaIndisponibilidades -Name "CAPACIDAD_MW"

# ── 4. CONC_LISTA_LIMITACIONESRED ──────────────────────────────────────────────
# Tope de potencia de una central (limitación por subestación).

Write-Host "4/5  $ListaLimitaciones" -ForegroundColor Cyan
Ensure-List -Title $ListaLimitaciones
Ensure-OptionalTitle -List $ListaLimitaciones
Ensure-LookupField   -List $ListaLimitaciones -Name "INSTALACION" -LookupList $ListaInstalaciones -ShowField "INSTALACION" -Required
Ensure-NumberField   -List $ListaLimitaciones -Name "POTENCIA_LIMITADA_MW" -Required
Ensure-DateTimeField -List $ListaLimitaciones -Name "FECHA_INICIO" -Required
Ensure-DateTimeField -List $ListaLimitaciones -Name "FECHA_FIN"
Ensure-ChoiceField   -List $ListaLimitaciones -Name "MOTIVO" -Required -Choices @("Falla", "Trabajo")
Ensure-TextField     -List $ListaLimitaciones -Name "DESCRIPCION" -MultiLine
Ensure-LookupField   -List $ListaLimitaciones -Name "ID_SOLICITUD" -LookupList $ListaConcentrador
Ensure-LookupField   -List $ListaLimitaciones -Name "FALLA" -LookupList $ListaSolicitudFalla -ShowField "ID_CEN"
Ensure-ChoiceField   -List $ListaLimitaciones -Name "ESTADO" -Required -Choices @("Activa", "Finalizada") -Default "Activa"

# ── 5. Índices ─────────────────────────────────────────────────────────────────
# Derivados de los $filter del web part y de la App Function (filtra subequipos y limitaciones por
# fields/INSTALACIONLookupId). Sobre 5.000 ítems, filtrar por una columna sin índice falla.

Write-Host "5/5  Índices" -ForegroundColor Cyan
Ensure-Index -List $ListaSubequipos          -Name "INSTALACION"
Ensure-Index -List $ListaSubequipos          -Name "EQUIPO"
Ensure-Index -List $ListaSubequipos          -Name "CODIGO"
Ensure-Index -List $ListaIndisponibilidades  -Name "ID_SOLICITUD"
Ensure-Index -List $ListaIndisponibilidades  -Name "SUBEQUIPO"
Ensure-Index -List $ListaIndisponibilidades  -Name "INSTALACION"
Ensure-Index -List $ListaLimitaciones        -Name "INSTALACION"
Ensure-Index -List $ListaLimitaciones        -Name "ESTADO"

# ── Opcional: eliminar las listas de bitácora (reemplazadas por la BD) ─────────

if ($EliminarListasBitacora) {
    Write-Host "`nListas de bitácora (reemplazadas por la BD de la App Function)" -ForegroundColor Cyan
    foreach ($lista in @($ListaBitacoraSubequipo, $ListaBitacoraSubestacion)) {
        $existente = Get-PnPList -Identity $lista -ErrorAction SilentlyContinue
        if (-not $existente) {
            Write-Host "    [~] No existe: $lista" -ForegroundColor Yellow
            continue
        }
        $respuesta = Read-Host "    ¿Eliminar $lista ($($existente.ItemCount) filas, sin migrar)? Escriba SI para confirmar"
        if ($respuesta -ceq "SI") {
            # Va a la papelera de reciclaje del sitio (se puede restaurar)
            Remove-PnPList -Identity $lista -Recycle -Force
            Write-Host "    [-] Eliminada (papelera de reciclaje): $lista" -ForegroundColor Green
        } else {
            Write-Host "    [~] Se mantiene: $lista" -ForegroundColor Yellow
        }
    }
}

# ── Opcional: FACILITY_ID_METEOLOGICA por central ──────────────────────────────

if ($FacilityIdsMeteologica.Count -gt 0) {
    Write-Host "`nFACILITY_ID_METEOLOGICA" -ForegroundColor Cyan
    foreach ($codigo in $FacilityIdsMeteologica.Keys) {
        $facilityId = [string]$FacilityIdsMeteologica[$codigo]
        $codigoEscapado = [System.Security.SecurityElement]::Escape([string]$codigo)
        $centrales = @(Get-PnPListItem -List $ListaInstalaciones -Query @"
<View>
  <Query>
    <Where>
      <Eq>
        <FieldRef Name='CODIGO' />
        <Value Type='Text'>$codigoEscapado</Value>
      </Eq>
    </Where>
  </Query>
</View>
"@)
        if ($centrales.Count -eq 0) {
            Write-Warning "    [!] No existe la central con CODIGO '$codigo'"
            continue
        }
        foreach ($central in $centrales) {
            $actual = [string]$central["FACILITY_ID_METEOLOGICA"]
            if ($actual -eq $facilityId) {
                Write-Host "    [~] $codigo ya tiene $facilityId" -ForegroundColor Yellow
            } elseif ([string]::IsNullOrWhiteSpace($actual)) {
                Set-PnPListItem -List $ListaInstalaciones -Identity $central.Id -Values @{ FACILITY_ID_METEOLOGICA = $facilityId } | Out-Null
                Write-Host "    [+] $codigo → $facilityId" -ForegroundColor Green
            } else {
                Write-Warning "    [!] $codigo ya tiene otro valor ($actual); no se modifica"
            }
        }
    }
}

# ── Listo ──────────────────────────────────────────────────────────────────────

Write-Host "`n✅ Operador renovable provisionado." -ForegroundColor Green
Write-Warning "Las columnas existentes con nombres o tipos distintos no se modifican. Revisa en cambios-produccion §6.1 las que hay que recrear (p. ej. CAPACIDAD_MW → CAPACIDAD_MAXIMA_MW en Subequipos)."
Write-Host "Verifica las listas en: $SiteUrl/_layouts/15/viewlsts.aspx`n"
