#!/usr/bin/env python3
"""
QEA PRIME — BRAIN STEM
Persistent memory. Watches discoveries. Archives chronologically.
"""
import os, json, hashlib, time
from pathlib import Path
from datetime import datetime, timezone

VAULT = Path(os.path.expanduser('~/TheNeuralVault'))
SYSTEM_DIR = VAULT / 'system'
HISTORY_DIR = SYSTEM_DIR / 'history'
DISCOVERY_FILE = VAULT / 'latest_sota_discovery.json'
MEMORY_FILE = SYSTEM_DIR / 'vault_memory.json'
PID_DIR = SYSTEM_DIR / 'pids'
LOG_FILE = SYSTEM_DIR / 'brain_stem.log'
SYSTEM_DIR.mkdir(exist_ok=True)
HISTORY_DIR.mkdir(exist_ok=True)
PID_DIR.mkdir(exist_ok=True)

def log(msg):
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        with open(LOG_FILE,'a') as f: f.write(f"[{ts}] {msg}\n")
    except: pass

def file_hash(path):
    try:
        with open(path,'rb') as f: return hashlib.md5(f.read()).hexdigest()
    except: return None

def load_memory():
    if MEMORY_FILE.exists():
        try:
            with open(MEMORY_FILE) as f: return json.load(f)
        except: pass
    return {'last_hash':None,'total_discoveries':0,'total_runs':0,'first_run':None,'last_run':None,'top_sources':{},'first_seen':{},'high_scores':[],'evolution_log':[]}

def save_memory(mem):
    try:
        with open(MEMORY_FILE,'w') as f: json.dump(mem, f, indent=2)
    except: pass

def archive_run(data, mem):
    ts = datetime.now(timezone.utc)
    archive_file = HISTORY_DIR / f"run_{ts.strftime('%Y-%m-%d')}.json"
    existing =[]
    if archive_file.exists():
        try:
            with open(archive_file) as f: existing = json.load(f)
        except: pass
    tier1 = data.get('tier1',[])
    run = {
        'timestamp': ts.isoformat(),
        'run_number': mem['total_runs'] + 1,
        'tier1_count': len(tier1),
        'top_score': max((d.get('tier_score',0) for d in tier1), default=0),
        'sources': list({d.get('source','unknown') for d in tier1}),
        'discoveries': tier1,
    }
    existing.append(run)
    try:
        with open(archive_file,'w') as f: json.dump(existing, f, indent=2)
    except: pass
    mem['total_runs'] += 1
    mem['total_discoveries'] += len(tier1)
    mem['last_run'] = ts.isoformat()
    if not mem['first_run']: mem['first_run'] = ts.isoformat()
    for d in tier1:
        src = d.get('source','unknown')
        mem['top_sources'][src] = mem['top_sources'].get(src, 0) + 1
        title = d.get('title','').strip()
        if title and title not in mem['first_seen']:
            mem['first_seen'][title] = ts.isoformat()
        if d.get('tier_score',0) > 0.85:
            mem['high_scores'].append({'title':title,'score':d['tier_score'],'source':src,'date':ts.isoformat()})
            mem['high_scores'] = sorted(mem['high_scores'], key=lambda x: x['score'], reverse=True)[:20]
    save_memory(mem)
    log(f"Run #{mem['total_runs']} archived — {len(tier1)} Tier-1 discoveries")
    return run

def get_summary():
    mem = load_memory()
    if not mem['total_runs']:
        return {'summary':'No runs recorded yet. Brain stem is ready and waiting.'}
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    today_file = HISTORY_DIR / f'run_{today}.json'
    today_count = 0
    if today_file.exists():
        try:
            with open(today_file) as f:
                today_count = sum(r.get('tier1_count',0) for r in json.load(f))
        except: pass
    return {
        'total_runs': mem['total_runs'],
        'total_tier1_discoveries': mem['total_discoveries'],
        'today_discoveries': today_count,
        'first_run': mem.get('first_run'),
        'last_run': mem.get('last_run'),
        'top_sources': mem.get('top_sources', {}),
        'all_time_high_scores': mem.get('high_scores',[])[:5],
        'unique_titles_found': len(mem.get('first_seen', {})),
    }

def watch():
    log("BRAIN STEM ONLINE")
    try: (PID_DIR / 'brain_stem.pid').write_text(str(os.getpid()))
    except: pass
    mem = load_memory()
    last_hash = mem.get('last_hash')
    while True:
        try:
            if DISCOVERY_FILE.exists():
                h = file_hash(DISCOVERY_FILE)
                if h and h != last_hash:
                    try:
                        with open(DISCOVERY_FILE) as f: data = json.load(f)
                        archive_run(data, mem)
                        mem = load_memory()
                        last_hash = h
                        mem['last_hash'] = h
                        save_memory(mem)
                    except Exception as e: log(f"Process error: {e}")
        except Exception as e: log(f"Watch error: {e}")
        time.sleep(30)

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'summary':
        print(json.dumps(get_summary(), indent=2))
    else:
        watch()
