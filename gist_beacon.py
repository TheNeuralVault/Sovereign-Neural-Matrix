import os, json, requests
from datetime import datetime, timezone

# The Matrix relies on the environment token for secure transmission
TOKEN = os.environ.get('GITHUB_TOKEN')
DISCOVERY_FILE = 'latest_sota_discovery.json'

def fire_beacon():
    print("=================================================================")
    print("QEA PRIME — GIST BEACON (CLOUD BINDING)")
    print("=================================================================")

    if not TOKEN:
        print("[ERROR] No GITHUB_TOKEN exported in Termux. The Beacon cannot fire.")
        print(" -> Run: export GITHUB_TOKEN='your_token_here'")
        return

    if not os.path.exists(DISCOVERY_FILE):
        print(f"[ERROR] {DISCOVERY_FILE} not found. The Swarm must feed before we signal.")
        return

    try:
        with open(DISCOVERY_FILE, 'r', encoding='utf-8') as f:
            payload = f.read()
            # Sanity check: Ensure it's valid JSON before transmitting
            json.loads(payload) 
    except Exception as e:
        print(f"[ERROR] Payload corrupted. Aborting transmission: {e}")
        return

    # The SOTA structure for a hidden GitHub Gist
    gist_data = {
        "description": f"QEA PRIME SOTA Ground State — {datetime.now(timezone.utc).isoformat()}",
        "public": False, 
        "files": {
            "qea_prime_directive.json": {
                "content": payload
            }
        }
    }

    headers = {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }

    print("[BEACON] Transmitting 11 Tier-1 Facts to GitHub Cloud...")
    
    try:
        response = requests.post("https://api.github.com/gists", headers=headers, json=gist_data, timeout=10)
        
        if response.status_code == 201:
            gist_url = response.json().get('html_url')
            raw_url = response.json().get('files', {}).get('qea_prime_directive.json', {}).get('raw_url')
            print(f"[SUCCESS] Beacon Fired! Cloud Matrix alerted.")
            print(f" -> Secret Gist Link: {gist_url}")
            print(f" -> Raw Payload Link (For Actions): {raw_url}")
        else:
            print(f"[ERROR] Beacon failed to penetrate cloud. HTTP {response.status_code}")
            print(response.text)
    except Exception as e:
         print(f"[ERROR] Transmission interrupted: {e}")

if __name__ == "__main__":
    fire_beacon()
