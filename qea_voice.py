import json, os
from pathlib import Path

VAULT = Path(os.path.expanduser('~/TheNeuralVault'))
SYSTEM = VAULT / 'system'

def read_json(path):
    try:
        with open(path, 'r') as f: return json.load(f)
    except: return None

def speak():
    print("\n=================================================================")
    print("                 QEA PRIME — ARCHITECT'S BRIDGE")
    print("=================================================================\n")
    
    heartbeat = read_json(SYSTEM / 'vault_heartbeat.json')
    if heartbeat:
        print(f"[*] SYSTEM STATUS : {heartbeat.get('overall_status', 'UNKNOWN')}")
    else:
        print("[!] SYSTEM STATUS : OFFLINE")

    memory = read_json(SYSTEM / 'vault_memory.json')
    if memory:
        runs = memory.get('total_runs', 0)
        found = memory.get('total_discoveries', 0)
        print(f"[*] BRAIN STEM    : Active. Hunts completed: {runs} | Tier-1 Discoveries: {found}")
    
    latest = read_json(VAULT / 'latest_sota_discovery.json')
    if latest and 'tier1' in latest and len(latest['tier1']) > 0:
        top = latest['tier1'][0]
        print(f"\n[+] LATEST FINDING: {top.get('title', 'Unknown')}")
        print(f"    -> Source: {top.get('source', 'Unknown')} | Score: {top.get('tier_score', 0)}")
    
    print("\n-----------------------------------------------------------------")
    print("ARCHITECT ADVISORY / WHAT NEEDS ATTENTION:")
    print("1.[NETWORK BOTTLENECK]: OpenClaw's proxy nodes are timing out.")
    print("   -> We need to patch OpenClaw to bypass dead proxies.")
    print("2. [AUTONOMY]: OpenClaw currently requires manual activation.")
    print("   -> We need to activate 'perpetual_sovereign.sh' so it hunts while you sleep.")
    print("=================================================================\n")

if __name__ == '__main__':
    speak()
