$ErrorActionPreference = 'Stop'
$path = 'c:\Users\droma\OneDrive\Desktop\basic tibrah\index.html'
$backup = $path + '.bak.' + (Get-Date -Format yyyyMMddHHmmss)
Copy-Item -LiteralPath $path -Destination $backup -Force

# Read
$content = Get-Content -Raw -LiteralPath $path
$orig = $content

# 1) Remove duplicate quiz modal (the minimal one near Modals section)
$patternModal = '(?s)\s*<div id="quiz-modal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-\[100\] p-4 opacity-0">\s*<div id="quiz-modal-content" class="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-\[90vh\] overflow-y-auto transform scale-95 transition-transform duration-300"></div>\s*</div>\s*'
$content = [regex]::Replace($content, $patternModal, '', 1)

# 2) Debounce quiz search input (replace all occurrences of the direct binding)
$patternDebounce = "searchInput\?\.addEventListener\('input',\s*renderCatalog\);"
$replacementDebounce = @"let __qDebounce; searchInput?.addEventListener('input', (e) => { clearTimeout(__qDebounce); __qDebounce = setTimeout(renderCatalog, 200); });"@
$content = [regex]::Replace($content, $patternDebounce, $replacementDebounce)

# 3) Fallback to hero when invalid view on initial load
$content = $content -replace [regex]::Escape("showView(hashParams.view);"), "if (document.getElementById('view-' + hashParams.view)) { showView(hashParams.view); } else { try { location.hash = 'view=hero'; } catch {} showView('hero'); }"

# 4) Fallback to hero on hashchange when invalid view
$content = $content -replace [regex]::Escape("showView(p.view);"), "if (document.getElementById('view-' + p.view)) { showView(p.view); } else { try { location.hash = 'view=hero'; } catch {} showView('hero'); }"

# 5) Insert manifest link into <head> if missing
if ($content -notmatch 'rel="manifest"') {
    $content = [regex]::Replace($content, '(?is)<head([^>]*)>', '<head$1>' + [Environment]::NewLine + '    <link rel="manifest" href="manifest.webmanifest">', 1)
}

# 6) Register Service Worker before </body> if missing
if ($content -notmatch 'navigator\.serviceWorker\.register') {
    $swScript = @"
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
}
</script>
"@
    $content = [regex]::Replace($content, '(?is)</body>\s*</html>\s*$', $swScript + [Environment]::NewLine + '</body>' + [Environment]::NewLine + '</html>')
}

# Save
if ($content -ne $orig) {
    Set-Content -LiteralPath $path -Value $content -Encoding UTF8
    Write-Output ("Patched. Backup: " + $backup)
} else {
    Write-Output "No changes were necessary. Backup created: $backup"
}
