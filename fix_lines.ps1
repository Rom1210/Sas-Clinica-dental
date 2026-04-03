$file = "src\modules\patients\PatientProfile.jsx"
$lines = [System.Collections.Generic.List[string]]@([System.IO.File]::ReadAllLines($file))

# Eliminar las lineas 718 a 807 (0-indexed: 717 to 806)
# Linea 718 es "            " (espacios) y despues viene el bloque residual
# Linea 807 es "        )}" que cierra el conditional viejo

$startRemove = 717  # 0-indexed, linea 718
$endRemove = 806    # 0-indexed, linea 807

$lines.RemoveRange($startRemove, $endRemove - $startRemove + 1)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($file, $lines.ToArray(), $utf8NoBom)

Write-Host "Done. Total lines: $($lines.Count)"
