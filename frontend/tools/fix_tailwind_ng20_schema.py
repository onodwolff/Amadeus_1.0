#!/usr/bin/env python3
import json, pathlib

root = pathlib.Path(__file__).resolve().parents[1]  # frontend/
angular = root / "angular.json"
if not angular.exists():
    print("angular.json not found in", root)
    raise SystemExit(1)

data = json.loads(angular.read_text(encoding="utf-8"))
projects = data.get("projects") or {}
changed = False

def strip_tailwind_config(target: dict) -> bool:
    if not target: return False
    opts = target.get("options")
    if not isinstance(opts, dict): 
        return False
    if "tailwindConfig" in opts:
        opts.pop("tailwindConfig", None)
        return True
    return False

for name, proj in projects.items():
    arch = proj.get("architect") or proj.get("targets")
    if not arch: 
        continue
    for key in ("build", "test", "serve"):
        if key in arch and strip_tailwind_config(arch[key]):
            changed = True
            print(f"[-] Removed tailwindConfig from {name}:{key}")

if changed:
    angular.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[✓] Saved:", angular)
else:
    print("[i] No tailwindConfig entries found. Nothing to do.")
