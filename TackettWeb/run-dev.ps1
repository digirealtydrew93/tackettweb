if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
  Write-Host "Install Netlify CLI: npm install -g netlify-cli" -ForegroundColor Yellow
} else { netlify dev }
