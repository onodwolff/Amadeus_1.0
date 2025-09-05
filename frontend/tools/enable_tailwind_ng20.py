#!/usr/bin/env python3
import json, pathlib

root = pathlib.Path(__file__).resolve().parents[1]  # frontend/
angular = root / "angular.json"
if not angular.exists():
    # Some workspaces keep angular.json one level up
    angular = root.parent / "angular.json"
if not angular.exists():
    print("angular.json not found")
    raise SystemExit(1)

data = json.loads(angular.read_text(encoding="utf-8"))
projects = data.get("projects") or {}

def patch_target(target: dict):
    if not target: return False
    opts = target.get("options")
    if not isinstance(opts, dict): 
        target["options"] = opts = {}
    if opts.get("tailwindConfig") != "tailwind.config.js":
        opts["tailwindConfig"] = "tailwind.config.js"
        return True
    return False

changed = False
for name, proj in projects.items():
    arch = proj.get("architect") or proj.get("targets")
    if not arch: 
        continue
    for key in ("build", "test"):
        if key in arch and patch_target(arch[key]):
            changed = True
            print(f"[+] {name}:{key} -> tailwindConfig=tailwind.config.js")

if changed:
    angular.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[✓] Saved:", angular)
else:
    print("[i] No changes needed.")

print("Done.")
