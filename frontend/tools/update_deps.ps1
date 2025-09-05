\
Param(
  [switch]$SkipAngularUpgrade = $false
)
# Ensure Node 20+
node -v

if (-Not $SkipAngularUpgrade) {
  echo "Upgrading Angular core to 16.2.x ..."
  npx -y ng update @angular/core@16.2 @angular/cli@16.2 --force
}

echo "Installing PrimeNG 16.x + PrimeIcons + Tailwind (PostCSS) ..."
npm i primeng@16 primeicons@6
npm i -D tailwindcss @tailwindcss/postcss postcss

# Initialize Tailwind if not present
if (-Not (Test-Path -Path .\tailwind.config.cjs)) {
  npx tailwindcss init -p
}

echo "Done. Next step: run tools\\patch_angular_styles.py to add src/styles.css to angular.json"
