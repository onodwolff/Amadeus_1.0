Param()

Write-Host "Installing Tailwind v4 + PostCSS plugin..." -ForegroundColor Cyan
npm i -D tailwindcss@latest @tailwindcss/postcss postcss

if ($LASTEXITCODE -eq 0) {
  Write-Host "Done. Start dev server with: npm start" -ForegroundColor Green
} else {
  Write-Host "Installation failed. Try cleaning cache and retry." -ForegroundColor Red
}
