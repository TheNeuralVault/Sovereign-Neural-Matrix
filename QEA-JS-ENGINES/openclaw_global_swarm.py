import asyncio, aiohttp, json, time, os, hashlib
from datetime import datetime, timezone

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'latest_sota_discovery.json')
OPENALEX_BASE = 'https://api.openalex.org/works'
GITHUB_BASE = 'https://api.github.com/search/repositories'
EMAIL = 'qeaprime@sovereignmatrix.local'
MAX_RESULTS = 5
TIMEOUT_SEC = 10
RATE_PER_SEC = 9

# Checking for GitHub Token for higher rate limits
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')

TIER1_HIGH = ["measured","experimentally confirmed","laboratory","spectroscopy","fabricated","synthesized","nanometer","kelvin","ghz","thz","observation confirmed","room temperature","300k","298k","fidelity", "production-ready", "state-of-the-art", "sota", "memory-safe"]
TIER1_MEDIUM = ["observed","demonstrated","experiment","measurement","empirical", "implementation", "algorithm", "optimized"]
TIER1_LOW = ["proposed","theoretical","suggests","model predicts","we conjecture","hypothesize","philosophical","speculate","post-singularity", "deprecated", "untested"]

def tier_score(text: str) -> float:
    if not text: return 0.0
    t = text.lower()
    score = 0.40
    for w in TIER1_HIGH:
        if w in t: score += 0.12
    for w in TIER1_MEDIUM:
        if w in t: score += 0.06
    for w in TIER1_LOW:
        if w in t: score -= 0.15
    return round(max(0.0, min(1.0, score)), 4)

def anchor_confidence(score: float, source_type: str = 'arXiv') -> dict:
    if source_type == 'GitHub':
        return {
            'Wikipedia': round(max(0.1, score - 0.15), 4),
            'arXiv': round(max(0.1, score - 0.05), 4),
            'NIST': round(score, 4), # Treating high-star GitHub code as rigorous execution
        }
    return {
        'Wikipedia': round(max(0.1, score - 0.10), 4),
        'arXiv': round(score, 4),
        'NIST': round(max(0.1, score - 0.05) if score >= 0.70 else score * 0.6, 4),
    }

class TokenBucket:
    def __init__(self, rate=RATE_PER_SEC, capacity=RATE_PER_SEC):
        self.rate = rate
        self.capacity = float(capacity)
        self.tokens = self.capacity
        self._last = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            self.tokens = min(self.capacity, self.tokens + (now - self._last) * self.rate)
            self._last = now
            if self.tokens < 1.0:
                await asyncio.sleep((1.0 - self.tokens) / self.rate)
                self.tokens = 0.0
            else:
                self.tokens -= 1.0

async def openalex_agent(session, bucket, agent_id, query, domain):
    await bucket.acquire()
    params = {'search': query, 'filter': 'is_oa:true', 'per_page': MAX_RESULTS, 'mailto': EMAIL, 'select': 'id,doi,title,abstract_inverted_index,authorships,publication_year,cited_by_count,primary_location'}
    try:
        async with session.get(OPENALEX_BASE, params=params, timeout=aiohttp.ClientTimeout(total=TIMEOUT_SEC)) as resp:
            if resp.status == 429:
                await asyncio.sleep(5)
                return []
            if resp.status != 200: return []
            data = await resp.json()
            discoveries = []
            for work in data.get('results', []):
                inv = work.get('abstract_inverted_index') or {}
                abstract = ''
                if inv:
                    max_pos = max((p for positions in inv.values() for p in positions), default=0)
                    words = [''] * (max_pos + 1)
                    for word, positions in inv.items():
                        for pos in positions:
                            if pos <= max_pos: words[pos] = word
                    abstract = ' '.join(w for w in words if w)
                score = tier_score(abstract)
                discoveries.append({
                    'agent_id': agent_id, 'domain': domain, 'query': query, 'title': work.get('title', 'Unknown'),
                    'tier_score': score, 'anchors': anchor_confidence(score, 'arXiv'), 'tier': 'Tier-1' if score >= 0.60 else 'Tier-5',
                    'source': 'OpenAlex'
                })
            return discoveries
    except:
        return []

async def github_agent(session, bucket, agent_id, query, domain):
    await bucket.acquire()
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if GITHUB_TOKEN:
        headers['Authorization'] = f'token {GITHUB_TOKEN}'
    
    # Searching for SOTA repositories sorted by stars
    params = {'q': query, 'sort': 'stars', 'order': 'desc', 'per_page': MAX_RESULTS}
    try:
        async with session.get(GITHUB_BASE, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=TIMEOUT_SEC)) as resp:
            if resp.status == 403 or resp.status == 429:
                print(f"[API LIMIT] GitHub rate limit hit for {agent_id}.")
                await asyncio.sleep(5)
                return []
            if resp.status != 200: return []
            data = await resp.json()
            discoveries = []
            for repo in data.get('items', []):
                description = repo.get('description') or ''
                readme_mock = repo.get('name', '') + " " + description
                # Score the repo based on its description and name
                score = tier_score(readme_mock)
                # Boost score slightly for highly starred repos (empirical community validation)
                stars = repo.get('stargazers_count', 0)
                if stars > 500: score = min(1.0, score + 0.1)
                
                discoveries.append({
                    'agent_id': agent_id, 'domain': domain, 'query': query, 
                    'title': f"GitHub Repo: {repo.get('full_name')} ({stars} stars) - {description[:100]}",
                    'tier_score': score, 'anchors': anchor_confidence(score, 'GitHub'), 
                    'tier': 'Tier-1' if score >= 0.60 else 'Tier-5',
                    'source': 'GitHub'
                })
            return discoveries
    except:
        return []

# The Swarm now contains both OpenAlex Academic Agents and GitHub Code Agents
AGENTS = [
    # Academic Physics/Biology Agents
    (openalex_agent, 'Agent-QKD-Global', 'quantum key distribution room temperature experimental', 'Cryptography'),
    (openalex_agent, 'Agent-Lindblad-Physics', 'Lindblad master equation decoherence measured open quantum', 'Physics'),
    (openalex_agent, 'Agent-FMO-Global', 'FMO complex quantum coherence 300K experimental', 'Biology'),
    # GitHub Autonomous Code Seekers
    (github_agent, 'Agent-Rust-Crypto-Code', 'quantum cryptography implementation language:rust', 'Code_Architecture'),
    (github_agent, 'Agent-Quantum-Sim-Code', 'quantum circuit simulator state vector', 'Code_Architecture')
]

async def swarm():
    print("=================================================================")
    print("OPENCLAW 2.0 — OMNI-DIRECTIONAL SWARM ACTIVE")
    print("Hunting OpenAlex Nodes + Global GitHub Repositories")
    print("=================================================================")
    bucket = TokenBucket()
    connector = aiohttp.TCPConnector(limit=8)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [func(session, bucket, aid, query, domain) for func, aid, query, domain in AGENTS]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_discoveries = [d for r in results if isinstance(r, list) for d in r]
    tier1 = sorted([d for d in all_discoveries if d['tier'] == 'Tier-1'], key=lambda x: x['tier_score'], reverse=True)
    
    summary = {}
    for d in tier1:
        if d['domain'] not in summary: summary[d['domain']] = {'scores': [], 'top_anchors': d['anchors']}
        summary[d['domain']]['scores'].append(d['tier_score'])
    for d in summary:
        summary[d] = {'avg_tier_score': round(sum(summary[d]['scores'])/len(summary[d]['scores']), 4), 'count': len(summary[d]['scores']), 'top_anchors': summary[d]['top_anchors']}
    
    # SOTA FIX: Using timezone-aware UTC to resolve the DeprecationWarning
    output = {'timestamp': datetime.now(timezone.utc).isoformat(), 'tier1': tier1, 'domain_summary': summary}
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f: json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f'\n[SUCCESS] Swarm locked {len(tier1)} Tier-1 facts.')
    for d in tier1[:3]:
        print(f" -> [{d['source']}] {d['title']}")

if __name__ == '__main__':
    asyncio.run(swarm())
