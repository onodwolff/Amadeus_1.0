Param()

Write-Host "Installing @tailwindcss/postcss as devDependency..." -ForegroundColor Cyan
npm i -D @tailwindcss/postcss

if ($LASTEXITCODE -eq 0) {
  Write-Host "Done. Now run: npm start" -ForegroundColor Green
} else {
  Write-Host "Installation failed. Try: npm cache clean --force; and re-run this script." -ForegroundColor Red
}
