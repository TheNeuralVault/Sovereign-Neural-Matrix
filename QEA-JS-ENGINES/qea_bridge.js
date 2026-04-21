'use strict';
const fs = require('fs');
const path = require('path');
const DISCOVERY_FILE = path.join(__dirname, '../latest_sota_discovery.json');

const NODE_TEMPLATES = {
    Cryptography: [
        { id: 'BB84_PROTOCOL', rel: 'depends_on', targets: ['NO_CLONING'], strength: 0.99 },
        { id: 'NO_CLONING', rel: null, targets: [], strength: 0 },
        { id: 'SHOR_ALGORITHM', rel: 'contradicts', targets: ['BB84_PROTOCOL'], strength: 0.80 },
        { id: 'BB84_EAVESDROP', rel: 'amplifies', targets: ['BB84_PROTOCOL'], strength: 0.85 },
    ],
    Physics: [
        { id: 'LINDBLAD_EQ', rel: 'amplifies', targets: ['DECOHERENCE_300K'], strength: 0.90 },
        { id: 'DECOHERENCE_300K', rel: 'contradicts', targets: ['ENTANGLEMENT_FIDELITY'], strength: 0.75 },
        { id: 'ENTANGLEMENT_FIDELITY', rel: 'amplifies', targets: ['QKD_IMPLEMENTATION'], strength: 0.88 },
    ],
    Biology: [
        { id: 'FMO_300K', rel: 'amplifies', targets: ['ENTANGLEMENT_FIDELITY'], strength: 0.65 },
        { id: 'NITROGENASE_TUNNELING', rel: 'enables', targets: ['EXCITON_COHERENCE'], strength: 0.95 },
        { id: 'EXCITON_COHERENCE', rel: 'amplifies', targets: ['ENTANGLEMENT_FIDELITY'], strength: 0.88 },
    ],
    Code_Architecture: [
        { id: 'RUST_MEMORY_SAFETY', rel: 'enables', targets: ['QKD_IMPLEMENTATION'], strength: 0.94 },
        { id: 'QKD_IMPLEMENTATION', rel: null, targets: [], strength: 0 },
    ],
};

const CROSS_DOMAIN_EDGES = [
    { from: 'BB84_PROTOCOL', to: 'QKD_IMPLEMENTATION', rel: 'enables', strength: 0.90 },
    { from: 'LINDBLAD_EQ', to: 'ENTANGLEMENT_FIDELITY', rel: 'enables', strength: 0.87 },
];

const REL_PHASE = { amplifies: 1.0, depends_on: 0.7, enables: 0.5, contradicts: -1.0 };
const FALLBACK_CONF = 0.30;

class QEABridge {
    constructor() { this.domainConf = {}; this.isLive = false; }
    load() {
        if (!fs.existsSync(DISCOVERY_FILE)) return false;
        try {
            const data = JSON.parse(fs.readFileSync(DISCOVERY_FILE, 'utf8'));
            this.isLive = (data.tier1 || []).length > 0;
            const summary = data.domain_summary || {};
            for (const [domain, info] of Object.entries(summary)) {
                this.domainConf[domain] = { conf: info.avg_tier_score, anchors: info.top_anchors };
            }
            return true;
        } catch { return false; }
    }
    getDomainConf(domain) { return this.domainConf[domain]?.conf ?? FALLBACK_CONF; }
    getQECAnchors(domain) {
        if (!this.isLive || !this.domainConf[domain]) return [{source: 'Wikipedia', confidence: FALLBACK_CONF}, {source: 'arXiv', confidence: FALLBACK_CONF}, {source: 'NIST', confidence: FALLBACK_CONF}];
        const a = this.domainConf[domain].anchors;
        return [{source: 'Wikipedia', confidence: a.Wikipedia}, {source: 'arXiv', confidence: a.arXiv}, {source: 'NIST', confidence: a.NIST}];
    }
    getTaskAnchorScore(task) {
        if (!task) return FALLBACK_CONF;
        const t = task.toLowerCase();
        let score = 0.50;
        ['measured','experimental','laboratory','kelvin','nm','ghz','fidelity','room temperature','synthesized'].forEach(s => { if(t.includes(s)) score += 0.12; });
        ['theorize','philosophical','implications','post-singularity','consciousness','multiverse','speculate'].forEach(s => { if(t.includes(s)) score -= 0.18; });
        return Math.max(0.05, Math.min(1.0, parseFloat(score.toFixed(4))));
    }
    buildKnowledgeGraph(task) {
        this.load();
        const taskScore = this.getTaskAnchorScore(task);
        const t = task.toLowerCase();
        const activeDomains = new Set();
        const keywords = {
            Cryptography: ['crypto','bb84','quantum key','qkd','entanglement'],
            Physics: ['lindblad','decoherence','fidelity','photon','quantum','300k'],
            Biology: ['photosynthesis','chlorophyll','fmo','biological','exciton','nitrogenase','tunneling','enzyme'],
            Code_Architecture: ['rust','memory','code','implement']
        };
        for (const [domain, kws] of Object.entries(keywords)) {
            if (kws.some(kw => t.includes(kw))) activeDomains.add(domain);
        }
        if (activeDomains.size === 0) Object.keys(keywords).forEach(d => activeDomains.add(d));

        const nodes = [];
        for (const [domain, templates] of Object.entries(NODE_TEMPLATES)) {
            const finalConf = parseFloat(((this.isLive ? this.getDomainConf(domain) : FALLBACK_CONF) * (activeDomains.has(domain) ? 1.0 : 0.5)).toFixed(4));
            for (const tmpl of templates) nodes.push({ id: tmpl.id, domain, conf: finalConf, anchors: this.getQECAnchors(domain), live: this.isLive });
        }
        const edges = [];
        for (const [domain, templates] of Object.entries(NODE_TEMPLATES)) {
            for (const tmpl of templates) {
                if (!tmpl.rel || tmpl.targets.length === 0) continue;
                const phase = REL_PHASE[tmpl.rel] ?? 0.5;
                for (const target of tmpl.targets) edges.push({ from: tmpl.id, to: target, rel: tmpl.rel, strength: tmpl.strength, weight: parseFloat((phase * tmpl.strength).toFixed(4)) });
            }
        }
        CROSS_DOMAIN_EDGES.forEach(e => edges.push({ ...e, weight: parseFloat(((REL_PHASE[e.rel] ?? 0.5) * e.strength).toFixed(4)) }));

        const labels = nodes.map(n => n.id);
        const matrix = Array.from({ length: labels.length }, () => new Array(labels.length).fill(0));
        nodes.forEach((n, i) => matrix[i][i] = n.conf);
        edges.forEach(e => {
            const i = labels.indexOf(e.from), j = labels.indexOf(e.to);
            if (i !== -1 && j !== -1) { matrix[i][j] += e.weight; matrix[j][i] += e.weight * 0.5; }
        });

        return { nodes, edges, labels, matrix, isLive: this.isLive, taskScore, activeDomains: [...activeDomains] };
    }
}
const bridge = new QEABridge();
module.exports = { bridge, QEABridge };

if (require.main === module) {
    bridge.load();
    ['Build a memory-safe Quantum Cryptography agent to measure entanglement fidelity at 300K', 'Model photosynthesis energy transfer in chlorophyll at 298K', 'Theorize about the philosophical implications of consciousness in a post-singularity multiverse', 'benchmark'].forEach(task => {
        console.log('\n' + '='.repeat(65));
        console.log(`TASK: "${task}"`);
        const graph = bridge.buildKnowledgeGraph(task);
        console.log(`  taskScore    : ${graph.taskScore}`);
        console.log(`  activeDomains: ${graph.activeDomains.join(', ')}`);
        console.log(`  Top node conf: ${graph.nodes.sort((a,b)=>b.conf-a.conf)[0]?.id} = ${graph.nodes[0]?.conf}`);
    });
}
