$filePath = "src\modules\patients\PatientProfile.jsx"

# Leer como bytes y decodificar como UTF-8
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Reemplazar cada secuencia corrupta (Latin-1 mal interpretado como UTF-8 doble)
$fixes = @{
    'ClÃ­nica'       = 'Clínica'
    'clÃ­nica'       = 'clínica'
    'InformaciÃ³n'   = 'Información'
    'informaciÃ³n'   = 'información'
    'mÃ©dica'        = 'médica'
    'MÃ©dica'        = 'Médica'
    'PrÃ³xima'       = 'Próxima'
    'prÃ³xima'       = 'próxima'
    'PÃ¡gina'        = 'Página'
    'pÃ¡gina'        = 'página'
    'CronologÃ­a'    = 'Cronología'
    'RegistÃ³'       = 'Registó'
    'regiÃ³n'        = 'región'
    'sesiÃ³n'        = 'sesión'
    'Ã©'             = 'é'
    'Ã­'             = 'í'
    'Ã³'             = 'ó'
    'Ã¡'             = 'á'
    'Ãº'             = 'ú'
    'Ã±'             = 'ñ'
    'HistÃ³ria'      = 'Historia'
}

foreach ($key in $fixes.Keys) {
    $content = $content.Replace($key, $fixes[$key])
}

# Escribir sin BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
Write-Host "Done - Characters fixed"
