#!/usr/bin/env python3
import json, sys, pathlib

TOOLS_DIR = pathlib.Path(__file__).resolve().parent
CANDIDATES = [
    TOOLS_DIR.parent / "angular.json",     # ./frontend/angular.json (Angular workspace lives inside frontend)
    TOOLS_DIR.parent.parent / "angular.json"  # repo root fallback
]

angular_json = None
for c in CANDIDATES:
    if c.exists():
        angular_json = c
        break

if not angular_json:
    print("angular.json not found near", TOOLS_DIR)
    sys.exit(1)

data = json.loads(angular_json.read_text(encoding="utf-8"))
projects = data.get("projects") or {}
changed = False

def ensure_styles(styles):
    # styles can be list of strings or objects
    normalized = []
    for item in styles:
        if isinstance(item, str):
            normalized.append(item)
        elif isinstance(item, dict):
            normalized.append(item.get("input") or item.get("href") or "")
        else:
            normalized.append("")
    if "src/styles.css" not in normalized:
        styles.append("src/styles.css")
        return True
    return False

for name, proj in projects.items():
    arch = proj.get("architect") or proj.get("targets")
    if not arch: continue
    build = arch.get("build")
    if not build: continue
    opts = build.get("options", {})
    styles = opts.get("styles")
    if isinstance(styles, list) and ensure_styles(styles):
        changed = True
        print(f"[+] Inserted src/styles.css into project {name}")

if changed:
    angular_json.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[✓] angular.json updated at", angular_json)
else:
    print("[i] No changes required (src/styles.css already present).")
