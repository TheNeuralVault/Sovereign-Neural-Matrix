import asyncio, aiohttp, json, time, os, glob, random, subprocess
from datetime import datetime, timezone
from bs4 import BeautifulSoup

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'latest_sota_discovery.json')
# SOTA FIX: Absolute path guaranteed by Android OS
ORGAN_PATH = '/data/data/com.termux/files/home/TheNeuralVault/semantic_vision'

OPENALEX_BASE = 'https://api.openalex.org/works'
GITHUB_BASE = 'https://api.github.com/search/repositories'
EMAIL = 'qeaprime@sovereignmatrix.local'
MAX_RESULTS = 5
RATE_PER_SEC = 9
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')

def empirical_score(text: str) -> float:
    if not text: return 0.0
    try:
        clean_text = text.replace('\n', ' ').replace('"', '')[:5000]
        result = subprocess.check_output([ORGAN_PATH, clean_text], text=True, stderr=subprocess.DEVNULL)
        return float(result.strip())
    except Exception as e:
        # CLAUDE'S SOTA FIX: Do not fail silently!
        print(f"  [C++ ORGAN ERROR] {e}")
        return 0.40

def anchor_confidence(score: float, source_type: str = 'arXiv') -> dict:
    if source_type in ['GitHub', 'Qeaclaw', 'OmniWeb']:
        return {'Wikipedia': round(max(0.1, score - 0.15), 4), 'arXiv': round(max(0.1, score - 0.05), 4), 'NIST': round(score, 4)}
    return {'Wikipedia': round(max(0.1, score - 0.10), 4), 'arXiv': round(score, 4), 'NIST': round(max(0.1, score - 0.05) if score >= 0.70 else score * 0.6, 4)}

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

async def get_proxy_mesh(session):
    print("[MESH] Pulling fresh global IP proxies...")
    try:
        async with session.get("https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt") as r:
            text = await r.text()
            proxies = [f"http://{line.strip()}" for line in text.split('\n') if line.strip()]
            print(f"[MESH] Locked {len(proxies)} nodes.")
            return proxies
    except:
        print("[MESH] ⚠ Proxy fetch failed. Falling back to direct IP.")
        return []

async def smart_request(session, url, headers=None, params=None, agent_id="Agent", proxies=None):
    max_retries = 3
    for attempt in range(max_retries):
        use_proxy = random.choice(proxies) if proxies and attempt < (max_retries - 1) else None
        try:
            async with session.get(url, headers=headers, params=params, proxy=use_proxy, timeout=12, ssl=False) as resp:
                if resp.status == 429:
                    retry_after = resp.headers.get('Retry-After')
                    wait_time = int(retry_after) if retry_after and retry_after.isdigit() else 5 * (attempt + 1)
                    print(f"  [{agent_id}] 🛡 Guardrail Detected. Server requested {wait_time}s cooldown. Adapting.")
                    await asyncio.sleep(wait_time)
                    continue 
                if resp.status != 200: continue
                content_type = resp.headers.get('Content-Type', '')
                if 'text/html' in content_type: return await resp.text()
                return await resp.json()
        except Exception as e:
            # CLAUDE'S SOTA FIX: Log the silent network failures!
            print(f"  [{agent_id}] Request attempt {attempt+1} failed: {type(e).__name__}")
            continue
    return None

async def omni_web_agent(session, bucket, proxies, agent_id, query, domain):
    await bucket.acquire()
    search_url = "https://html.duckduckgo.com/html/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Sovereign/QEA-PRIME'}
    print(f"  [{agent_id}] Casting net into the vast open web for: '{query}'")
    html = await smart_request(session, search_url, headers=headers, params={'q': query}, agent_id=agent_id, proxies=proxies)
    if not html: return []

    soup = BeautifulSoup(html, 'html.parser')
    discoveries = []
    for link in soup.find_all('a', class_='result__snippet'):
        snippet = link.text.strip()
        score = empirical_score(snippet)
        if score >= 0.50:
            discoveries.append({
                'agent_id': agent_id, 'domain': domain, 'query': query, 'title': f"Deep Web Extract: {snippet[:80]}...",
                'tier_score': score, 'anchors': anchor_confidence(score, 'OmniWeb'), 'tier': 'Tier-1' if score >= 0.60 else 'Tier-5', 'source': 'Vast_Web'
            })
    return discoveries

async def openalex_agent(session, bucket, proxies, agent_id, query, domain):
    await bucket.acquire()
    params = {'search': query, 'filter': 'is_oa:true', 'per_page': MAX_RESULTS, 'mailto': EMAIL, 'select': 'id,doi,title,abstract_inverted_index'}
    data = await smart_request(session, OPENALEX_BASE, params=params, agent_id=agent_id, proxies=proxies)
    if not data or not isinstance(data, dict): return []
    discoveries = []
    for work in data.get('results', []):
        inv = work.get('abstract_inverted_index') or {}
        words = [''] * (max((p for positions in inv.values() for p in positions), default=0) + 1) if inv else []
        for word, positions in inv.items():
            for pos in positions: 
                if pos < len(words): words[pos] = word
        abstract = ' '.join(w for w in words if w)
        score = empirical_score(abstract)
        discoveries.append({
            'agent_id': agent_id, 'domain': domain, 'query': query, 'title': work.get('title', 'Unknown'),
            'tier_score': score, 'anchors': anchor_confidence(score, 'arXiv'), 'tier': 'Tier-1' if score >= 0.60 else 'Tier-5', 'source': 'OpenAlex'
        })
    return discoveries

async def github_agent(session, bucket, proxies, agent_id, query, domain):
    await bucket.acquire()
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if GITHUB_TOKEN: headers['Authorization'] = f'token {GITHUB_TOKEN}'
    params = {'q': query, 'sort': 'stars', 'order': 'desc', 'per_page': MAX_RESULTS}
    data = await smart_request(session, GITHUB_BASE, headers=headers, params=params, agent_id=agent_id, proxies=proxies)
    if not data or not isinstance(data, dict): return []
    discoveries = []
    for repo in data.get('items', []):
        readme_mock = repo.get('name', '') + " " + (repo.get('description') or '')
        score = empirical_score(readme_mock)
        stars = repo.get('stargazers_count', 0)
        if stars > 100: score = min(1.0, score + 0.15)
        discoveries.append({
            'agent_id': agent_id, 'domain': domain, 'query': query, 'title': f"GitHub Repo: {repo.get('full_name')} ({stars} stars)",
            'tier_score': score, 'anchors': anchor_confidence(score, 'GitHub'), 'tier': 'Tier-1' if score >= 0.60 else 'Tier-5', 'source': 'GitHub'
        })
    return discoveries

AGENTS = [
    (openalex_agent, 'Agent-QKD-Global', 'quantum key distribution room temperature experimental', 'Cryptography'),
    (github_agent, 'Agent-Rust-Crypto', 'quantum cryptography implementation language:rust', 'Code_Architecture'),
    (omni_web_agent, 'Agent-Omni-Physics', 'latest breakthrough room temperature quantum coherence', 'Physics')
]

async def swarm():
    print("=================================================================")
    print("OPENCLAW 5.1 — TELEMETRY UNLOCKED (C++ VISION ACTIVE)")
    print("=================================================================")
    bucket = TokenBucket()
    connector = aiohttp.TCPConnector(limit=10, force_close=True)
    async with aiohttp.ClientSession(connector=connector) as session:
        proxies = await get_proxy_mesh(session)
        tasks = [func(session, bucket, proxies, aid, query, domain) for func, aid, query, domain in AGENTS]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_discoveries = [d for r in results if isinstance(r, list) for d in r]
    tier1 = sorted([d for d in all_discoveries if d['tier'] == 'Tier-1'], key=lambda x: x['tier_score'], reverse=True)
    
    output = {'timestamp': datetime.now(timezone.utc).isoformat(), 'tier1': tier1}
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f: json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f'\n[SUCCESS] Cyborg Swarm locked {len(tier1)} Tier-1 facts utilizing C++ Vision.')
    for d in tier1[:5]:
        print(f" -> [{d['source']}] {d['title']} (Semantic Score: {d['tier_score']})")

if __name__ == '__main__':
    asyncio.run(swarm())
