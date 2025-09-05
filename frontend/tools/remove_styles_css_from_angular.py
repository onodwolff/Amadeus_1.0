#!/usr/bin/env python3
import json, pathlib

root = pathlib.Path(__file__).resolve().parents[1]
angular = root / "angular.json"
if not angular.exists():
    print("angular.json not found in", root)
    raise SystemExit(1)

data = json.loads(angular.read_text(encoding="utf-8"))
projects = data.get("projects") or {}
changed = False

for name, proj in projects.items():
    arch = proj.get("architect") or proj.get("targets") or {}
    build = arch.get("build") or {}
    opts = build.get("options") or {}
    styles = opts.get("styles")
    if isinstance(styles, list) and "src/styles.css" in styles:
        styles[:] = [s for s in styles if s != "src/styles.css"]
        changed = True
        print(f"[-] Removed src/styles.css from {name}:build options.styles")

if changed:
    angular.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[✓] Saved:", angular)
else:
    print("[i] No changes needed.")
