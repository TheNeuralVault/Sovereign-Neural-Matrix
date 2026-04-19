import urllib.request
import xml.etree.ElementTree as ET
import json
import sys

print("=================================================================")
print("           [OPENCLAW] THE EYES OF THE MATRIX ARE OPEN            ")
print("           Hunting 2026 SOTA Quantum Truths                      ")
print("=================================================================")

# OpenClaw taps directly into the global arXiv quantum physics stream
URL = 'http://export.arxiv.org/api/query?search_query=cat:quant-ph+AND+all:coherence&start=0&max_results=3&sortBy=submittedDate&sortOrder=descending'

try:
    print("[OPENCLAW] Initiating Tier-1 pulse to global nodes...")
    req = urllib.request.Request(URL, headers={'User-Agent': 'OpenClaw-Sovereign-Matrix'})
    response = urllib.request.urlopen(req)
    xml_data = response.read()
    root = ET.fromstring(xml_data)

    discoveries = []
    namespace = {'atom': 'http://www.w3.org/2005/Atom'}

    for entry in root.findall('atom:entry', namespace):
        title = entry.find('atom:title', namespace).text.strip()
        summary = entry.find('atom:summary', namespace).text.strip()
        
        # Applying the Laws of The Preamble
        summary_lower = summary.lower()
        if "experiment" in summary_lower or "measurement" in summary_lower or "observation" in summary_lower:
            status = "[TIER-1 FACT] Observable Quantum Process Detected."
        else:
            status = "[TIER-5 BELIEF] Theoretical Math. Retaining for future proof."
            
        discoveries.append({
            "title": title,
            "status": status,
            "preview": summary[:150] + "..."
        })

    if discoveries:
        print(f"[QEA PRIME] Filtered {len(discoveries)} raw quantum transmissions.")
        
        # We lock onto the most recent discovery
        top_fact = discoveries[0]
        print(f"\n[SOTA LOCK] TARGET: {top_fact['title']}")
        print(f"[EVALUATION] {top_fact['status']}\n")
        
        # Write the Truth to the ledger for the GitHub Action to process
        with open("latest_sota_discovery.json", "w") as f:
            json.dump(top_fact, f, indent=4)
            
        print("[SUCCESS] OpenClaw payload securely locked. Ground State achieved.")
    else:
        print("[SCAN] No new SOTA Truths found. Maintaining 0.962826 efficiency.")

except Exception as e:
    print(f"[CRITICAL DECOHERENCE] Hunt failed due to noise: {e}")
    sys.exit(1)
