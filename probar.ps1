# 1. Definir variables y datos de Login
$LoginData = @{
    username = "juan-compras"
    password = "123456"
} | ConvertTo-Json

$Headers = @{
    "Content-Type" = "application/json"
}

# --- CORREGIDO: JSON con nombres en formato snake_case ---
$NewInvoiceNote = @{
    note_number = "NC-005"   # Cambiado a snake_case y subí el número para evitar duplicados
    return_note_id    = 1         # Cambiado a snake_case
    created_at         = "2026-05-17"
    total = 100
    details            = @(
        @{
            product_id = 1         # <- Este era el que causaba el error
            quantity   = 1
            unit_cost  = 100       # Por si acaso, cambiado también a snake_case
            subtotal = 100
        }
    )
} | ConvertTo-Json -Depth 5

# 2. Configurar la sesión para guardar cookies automáticamente
$WebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 3. Hacer el Login
Write-Host "Iniciando sesión..." -ForegroundColor Cyan
try {
    $LoginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:3000/auth/login" `
        -Method Post `
        -Headers $Headers `
        -Body $LoginData `
        -WebSession $WebSession
    Write-Host "¡Login exitoso!" -ForegroundColor Green
} catch {
    Write-Host "Error al intentar hacer Login: $_" -ForegroundColor Red
    return
}

# 4. Extraer el token CSRF desde la cookie guardada en la sesión
$AllCookies = $WebSession.Cookies.GetCookies("http://127.0.0.1:3000")
$CsrfCookie = $AllCookies | Where-Object { $_.Name -like "*csrf*" }

if ($null -eq $CsrfCookie) {
    Write-Host "ERROR: No se encontró la cookie CSRF." -ForegroundColor Red
    return
}
$Headers.Add("X-CSRF-Token", $CsrfCookie[0].Value)

# 5. Hacer el POST para CREAR la Nota de Crédito
Write-Host "`nCreando Nota de Crédito de Proveedor..." -ForegroundColor Cyan
try {
    # Cambiamos a -Method Post y enviamos el -Body con el JSON
    $Response = Invoke-RestMethod -Uri "http://127.0.0.1:3000/purchases/supplier-credit-notes" `
        -Method Post `
        -Headers $Headers `
        -Body $NewInvoiceNote `
        -WebSession $WebSession

    Write-Host "¡Nota de Crédito CREADA con éxito!" -ForegroundColor Green
    $Response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error al crear la Nota de Crédito: $_" -ForegroundColor Red
    
    # Mostrar la respuesta detallada si el backend envió un mensaje de error específico
    if ($_.Exception.Response) {
        $StreamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $ErrorResponseBody = $StreamReader.ReadToEnd()
        Write-Host "`nRespuesta detallada del Backend (Validaciones fallidas):" -ForegroundColor Yellow
        Write-Host $ErrorResponseBody -ForegroundColor White
    }
}