#!/usr/bin/env python3
"""
QEA PRIME — IMMUNE SYSTEM
Confidence >= 0.90 = auto-purge. Below = quarantine.
Never touches protected organs.
"""
import os, json, hashlib, shutil, time
from pathlib import Path
from datetime import datetime, timezone

VAULT = Path(os.path.expanduser('~/TheNeuralVault'))
SYSTEM_DIR = VAULT / 'system'
QUARANTINE_DIR = SYSTEM_DIR / 'quarantine'
IMMUNE_LOG = SYSTEM_DIR / 'immune_system.log'
PURGE_HISTORY = SYSTEM_DIR / 'purge_history.json'
SYSTEM_DIR.mkdir(exist_ok=True)
QUARANTINE_DIR.mkdir(exist_ok=True)

PROTECTED_NAMES = {
    'semantic_vision','semantic_vision.cpp','openclaw_global_swarm.py',
    'openclaw_nano_swarm.py','directive.json','vault_lock.json',
    'latest_sota_discovery.json','noise_sample.json',
    'qea_nervous_system.py','qea_immune_system.py','qea_brain_stem.py',
    'qea_prime_boot.sh','gist_beacon.py','pre_process.js','decrypt_logic.js',
    'sota_hud.js','watch_sota.sh','perpetual_sovereign.sh','autonomous_hunt.sh',
    'autonomous_hunt.log','interrogate_nano_agents.sh','absolute_audit.sh',
    'architect_audit.sh','self_aware_audit.sh','sovereign_absolute_audit.sh',
    'hunting_directives.txt',
}

PROTECTED_DIRS = {
    'Jonathans-Beliefs','UNITARY-VAULT','.github','quickjs_native',
    'QEA-JS-ENGINES','QEA-RAM-CURE','SPECIALIZED','bin','system','.git','node_modules',
}

SKIP_WALK = {'node_modules','.git','quickjs_native','.obj','system'}
MAX_LOG_MB = 5.0

def log(msg):
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        with open(IMMUNE_LOG,'a') as f: f.write(f"[{ts}] {msg}\n")
    except: pass

def file_hash(path):
    try:
        h = hashlib.sha256()
        with open(path,'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''): h.update(chunk)
        return h.hexdigest()
    except: return None

def is_protected(path: Path) -> bool:
    if path.name in PROTECTED_NAMES: return True
    for part in path.parts:
        if part in PROTECTED_DIRS: return True
    try:
        path.relative_to(SYSTEM_DIR); return True
    except: pass
    return False

def walk_vault():
    for root, dirs, files in os.walk(VAULT):
        dirs[:] = [d for d in dirs if d not in SKIP_WALK]
        for f in files:
            yield Path(root) / f

def find_duplicates():
    hashes = {}; dupes =[]
    for p in walk_vault():
        if is_protected(p): continue
        h = file_hash(p)
        if h is None: continue
        if h in hashes:
            orig = hashes[h]
            dup, keep = (p, orig) if len(str(p)) > len(str(orig)) else (orig, p)
            hashes[h] = keep
            dupes.append({'type':'DUPLICATE','path':str(dup),'keep':str(keep),'confidence':0.95,'reason':f'Identical to {Path(keep).name}'})
        else: hashes[h] = p
    return dupes

def find_garbage():
    garbage =[]
    for p in walk_vault():
        if is_protected(p): continue
        if p.suffix == '.log':
            try:
                if p.stat().st_size / 1024**2 > MAX_LOG_MB:
                    garbage.append({'type':'OVERSIZED_LOG','path':str(p),'confidence':0.91,'reason':f'Log exceeds {MAX_LOG_MB}MB','action':'truncate'})
            except: pass
        if p.suffix in {'.tmp','.bak','.swp','.temp'}:
            garbage.append({'type':'TEMP_FILE','path':str(p),'confidence':0.97,'reason':f'Temp file ({p.suffix})'})
        if p.suffix in {'.py','.js','.sh','.rs','.cpp'}:
            try:
                if p.stat().st_size == 0:
                    garbage.append({'type':'EMPTY_SOURCE','path':str(p),'confidence':0.75,'reason':'Empty source file'})
            except: pass
    for p in VAULT.rglob('__pycache__'):
        if p.is_dir() and not is_protected(p):
            garbage.append({'type':'PYCACHE','path':str(p),'confidence':0.99,'reason':'Python cache'})
    for p in VAULT.rglob('*.pyc'):
        if not is_protected(p):
            garbage.append({'type':'PYC','path':str(p),'confidence':0.99,'reason':'Compiled bytecode'})
    return garbage

def purge(item) -> bool:
    path = Path(item['path'])
    if not path.exists(): return True
    if is_protected(path): log(f"BLOCKED: {path.name}"); return False
    try:
        if item.get('action') == 'truncate':
            lines = path.read_text(errors='replace').split('\n')
            path.write_text('\n'.join(lines[-500:]))
            log(f"TRUNCATED: {path.name}")
        elif path.is_dir(): shutil.rmtree(path); log(f"PURGED DIR: {path.name}")
        else: path.unlink(); log(f"PURGED: {path.name}")
        return True
    except Exception as e: log(f"PURGE FAILED: {path.name} — {e}"); return False

def quarantine(item) -> bool:
    path = Path(item['path'])
    if not path.exists(): return True
    if is_protected(path): return False
    dest = QUARANTINE_DIR / f"{path.name}_{int(time.time())}"
    try:
        shutil.move(str(path), str(dest))
        log(f"QUARANTINED: {path.name}")
        return True
    except Exception as e: log(f"QUARANTINE FAILED: {path.name} — {e}"); return False

def run_immune_cycle():
    log("═══ IMMUNE CYCLE START ═══")
    threats = find_duplicates() + find_garbage()
    purged, qd, skipped = [], [],[]
    for item in threats:
        if item['confidence'] >= 0.90:
            (purged if purge(item) else skipped).append(item)
        else:
            (qd if quarantine(item) else skipped).append(item)
    report = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'threats_found': len(threats), 'purged': len(purged),
        'quarantined': len(qd), 'skipped': len(skipped),
        'purged_items': purged, 'quarantined_items': qd,
    }
    history =[]
    if PURGE_HISTORY.exists():
        try:
            with open(PURGE_HISTORY) as f: history = json.load(f)
        except: pass
    history.append(report)
    try:
        with open(PURGE_HISTORY,'w') as f: json.dump(history[-100:], f, indent=2)
    except: pass
    log(f"═══ COMPLETE — Purged: {len(purged)}, Quarantined: {len(qd)} ═══")
    return report

if __name__ == '__main__':
    report = run_immune_cycle()
    print(json.dumps(report, indent=2))
