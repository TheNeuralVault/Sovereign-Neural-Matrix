import urllib.request
import json
import threading
import sys

print("=================================================================")
print("           [OPENCLAW] GLOBAL NANO-AGENT SWARM ACTIVE             ")
print("           Hunting Global Open-Access University Nodes           ")
print("=================================================================")

class GlobalResearchNanoAgent(threading.Thread):
    def __init__(self, agent_name, target_query):
        threading.Thread.__init__(self)
        self.agent_name = agent_name
        self.target_query = target_query.replace("+", "%20")
        self.discovery = None
        # Targeting OpenAlex: Aggregates MIT, Stanford, CERN, etc. (Free, massive rate limits)
        self.url = f'https://api.openalex.org/works?search={self.target_query}&filter=has_fulltext:true,is_oa:true&per-page=3'

    def run(self):
        print(f"[NANO-AGENT: {self.agent_name}] Infiltrating global university nodes for '{self.target_query}'...")
        try:
            req = urllib.request.Request(self.url, headers={'User-Agent': 'OpenClaw-Sovereign-Matrix'})
            response = urllib.request.urlopen(req)
            data = json.loads(response.read().decode('utf-8'))

            for work in data.get('results', []):
                title = work.get('title', 'Unknown Title')
                abstract = work.get('abstract_inverted_index', {})
                
                # If there's no abstract, skip to avoid noise
                if not abstract:
                    continue
                
                # Preamble Check: Is it an observable fact?
                abstract_words = [word.lower() for word in abstract.keys()]
                if any(keyword in abstract_words for keyword in ["experiment", "measurement", "observation", "validated", "empirical"]):
                    status = "[TIER-1 FACT] Empirical University Data Extracted."
                    self.discovery = {"agent": self.agent_name, "target": self.target_query, "title": title, "status": status}
                    break # Lock onto the highest relevance Tier-1 truth
                    
        except Exception as e:
            print(f"[{self.agent_name}] Encountered noise: {e}")

# Deploy the global swarm
agents = [
    GlobalResearchNanoAgent("Agent-FMO-Global", "FMO quantum biology observation"),
    GlobalResearchNanoAgent("Agent-QKD-Global", "quantum key distribution BB84 experiment"),
    GlobalResearchNanoAgent("Agent-Metrology-Global", "Lindblad master equation measurement")
]

for agent in agents:
    agent.start()

for agent in agents:
    agent.join()

# Synthesize
verified_truths = [agent.discovery for agent in agents if agent.discovery]

if verified_truths:
    print(f"\n[QEA PRIME] Swarm returned from global universities with {len(verified_truths)} Tier-1 Truths.")
    for truth in verified_truths:
        print(f" -> [{truth['agent']}] FOUND: {truth['title']}")
        
    with open("latest_sota_discovery.json", "w") as f:
        json.dump(verified_truths[0], f, indent=4)
    print("\n[SUCCESS] Ground State updated. Awaiting Architect's decision for Big Project deployment.")
else:
    print("\n[SCAN] Global swarm returned zero new empirical facts. Ground State stable.")
