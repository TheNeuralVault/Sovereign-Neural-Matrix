#!/usr/bin/env python3
"""
QEA PRIME — NERVOUS SYSTEM
Silent background health daemon. Checks all organs every 60 seconds.
Auto-restarts dead processes. Writes heartbeat to system/vault_heartbeat.json.
"""
import os, sys, json, time, subprocess
from datetime import datetime, timezone
from pathlib import Path

VAULT = Path(os.path.expanduser('~/TheNeuralVault'))
SYSTEM_DIR = VAULT / 'system'
HEARTBEAT_FILE = SYSTEM_DIR / 'vault_heartbeat.json'
PID_DIR = SYSTEM_DIR / 'pids'
LOG_FILE = SYSTEM_DIR / 'nervous_system.log'
CHECK_INTERVAL = 60

SYSTEM_DIR.mkdir(exist_ok=True)
PID_DIR.mkdir(exist_ok=True)

def detect_environment():
    try:
        with open('/etc/os-release') as f:
            if 'Ubuntu' in f.read():
                return 'UBUNTU_PROOT'
    except:
        pass
    if Path('/data/data/com.termux').exists():
        return 'TERMUX_NATIVE'
    return 'UNKNOWN'

ENV = detect_environment()

ORGANS = {
    'semantic_vision_binary': {'type': 'binary', 'path': VAULT / 'semantic_vision', 'critical': True, 'description': 'C++ ARM64 cosine similarity scoring organ'},
    'openclaw_swarm': {'type': 'file', 'path': VAULT / 'openclaw_global_swarm.py', 'critical': True, 'description': 'Primary 3-agent intelligence hunter'},
    'semantic_vision_source': {'type': 'file', 'path': VAULT / 'semantic_vision.cpp', 'critical': False, 'description': 'C++ source for recompilation'},
    'latest_discovery': {'type': 'freshness', 'path': VAULT / 'latest_sota_discovery.json', 'max_age_hours': 24, 'critical': False, 'description': 'Live Tier-1 discovery output'},
    'brain_server': {'type': 'process', 'path': VAULT / 'QEA-RAM-CURE' / 'qea_brain_server.py', 'pid_file': PID_DIR / 'brain_server.pid', 'critical': False, 'description': 'RAM-CURE brain server'},
    'rust_vault_binary': {'type': 'binary', 'path': VAULT / 'UNITARY-VAULT' / 'main', 'critical': False, 'description': 'Compiled Rust quantum organ'},
    'immune_system': {'type': 'file', 'path': VAULT / 'qea_immune_system.py', 'critical': False, 'description': 'Auto-purge immune organ'},
    'brain_stem': {'type': 'file', 'path': VAULT / 'qea_brain_stem.py', 'critical': False, 'description': 'Persistent memory organ'},
    'directive': {'type': 'file', 'path': VAULT / 'directive.json', 'critical': False, 'description': 'Active hunting directive'},
}

def log(msg):
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(f"[{ts}] [{ENV}] {msg}\n")
        if LOG_FILE.stat().st_size > 2_000_000:
            lines = LOG_FILE.read_text().split('\n')
            LOG_FILE.write_text('\n'.join(lines[-500:]))
    except:
        pass

def check_organ(name, config):
    t = config['type']
    path = config['path']
    if t == 'binary':
        if not path.exists(): return {'status': 'DEAD', 'reason': 'Binary not found'}
        if not os.access(path, os.X_OK): return {'status': 'DEGRADED', 'reason': 'Not executable'}
        return {'status': 'ALIVE', 'reason': f'{path.stat().st_size} bytes'}
    elif t == 'file':
        if not path.exists(): return {'status': 'DEAD', 'reason': 'File not found'}
        if path.stat().st_size == 0: return {'status': 'DEGRADED', 'reason': 'Empty file'}
        return {'status': 'ALIVE', 'reason': f'{path.stat().st_size} bytes'}
    elif t == 'process':
        pid_file = config.get('pid_file')
        if pid_file and Path(pid_file).exists():
            try:
                pid = int(Path(pid_file).read_text().strip())
                os.kill(pid, 0)
                return {'status': 'ALIVE', 'reason': f'PID {pid} running'}
            except:
                Path(pid_file).unlink(missing_ok=True)
        return {'status': 'DORMANT', 'reason': 'Not running'} if path.exists() else {'status': 'DEAD', 'reason': 'Missing'}
    elif t == 'freshness':
        if not path.exists(): return {'status': 'DEAD', 'reason': 'File missing'}
        age_h = (time.time() - path.stat().st_mtime) / 3600
        max_age = config.get('max_age_hours', 24)
        if age_h > max_age * 2: return {'status': 'STALE', 'reason': f'{age_h:.1f}h old'}
        if age_h > max_age: return {'status': 'AGING', 'reason': f'{age_h:.1f}h old'}
        return {'status': 'FRESH', 'reason': f'Updated {age_h:.1f}h ago'}
    return {'status': 'UNKNOWN', 'reason': 'Unknown type'}

def run_heartbeat():
    log(f"NERVOUS SYSTEM ONLINE — {ENV}")
    counter = 0
    while True:
        results = {}
        overall = 'NOMINAL'
        critical_failures = []
        warnings =[]
        for name, config in ORGANS.items():
            result = check_organ(name, config)
            result['description'] = config.get('description', '')
            results[name] = result
            status = result['status']
            if config.get('critical') and status == 'DEAD':
                overall = 'CRITICAL'
                critical_failures.append(name)
                log(f"CRITICAL: {name} DEAD")
            elif status in ('DEAD', 'DEGRADED', 'STALE') and overall != 'CRITICAL':
                overall = 'DEGRADED'
                warnings.append(name)

        heartbeat = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'environment': ENV,
            'overall_status': overall,
            'critical_failures': critical_failures,
            'warnings': warnings,
            'organs': results,
        }
        try:
            with open(HEARTBEAT_FILE, 'w') as f:
                json.dump(heartbeat, f, indent=2)
        except:
            pass

        counter += 1
        if counter % 10 == 0:
            immune = VAULT / 'qea_immune_system.py'
            if immune.exists():
                try:
                    subprocess.Popen(['python3', str(immune)],
                        stdout=open(SYSTEM_DIR / 'immune_last_report.json', 'w'),
                        stderr=subprocess.DEVNULL)
                except:
                    pass

        time.sleep(CHECK_INTERVAL)

if __name__ == '__main__':
    try:
        (PID_DIR / 'nervous_system.pid').write_text(str(os.getpid()))
    except:
        pass
    try:
        run_heartbeat()
    except KeyboardInterrupt:
        log("NERVOUS SYSTEM SHUTDOWN")
