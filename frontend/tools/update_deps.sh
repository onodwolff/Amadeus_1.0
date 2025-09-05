#!/usr/bin/env bash
set -euo pipefail

SKIP_ANGULAR=${1:-""}

node -v

if [ "${SKIP_ANGULAR}" != "--skip-angular-upgrade" ]; then
  echo "Upgrading Angular core to 16.2.x ..."
  npx -y ng update @angular/core@16.2 @angular/cli@16.2 --force
fi

echo "Installing PrimeNG 16.x + PrimeIcons + Tailwind (PostCSS) ..."
npm i primeng@16 primeicons@6
npm i -D tailwindcss @tailwindcss/postcss postcss

# Initialize Tailwind if not present
if [ ! -f tailwind.config.js ]; then
  npx tailwindcss init -p
fi

echo "Done. Next step: run python frontend/tools/patch_angular_styles.py"
