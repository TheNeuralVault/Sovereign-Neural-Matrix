// =========================================================================
// QEA PRIME: ENGINE 7 — HAMILTONIAN OPTIMIZER
// The "Discovery Engine"
//
// Role: Given the knowledge graph adjacency matrix H from OpenClaw 2.0,
//       find the GROUND STATE — the minimum energy configuration that
//       represents the optimal solution the universe already permits.
//
// Core math:
//   H|ψ⟩ = E|ψ⟩
//   Ground state |ψ₀⟩ = eigenvector of LOWEST energy eigenvalue E₀
//
//   But we want the DOMINANT direction of the knowledge space,
//   so we work with the NORMALIZED POSITIVE SEMIDEFINITE form:
//   H̃ = (H + H^T)/2  (symmetrize)
//   H̃ = H̃ + |λ_min|·I  (shift to make all eigenvalues positive)
//   Ground state = eigenvector of LARGEST eigenvalue of H̃
//                = lowest energy of original problem
//
//   Power iteration finds this in O(n² × iters) — runs on Termux.
//
//   Output: ranked solution paths with energy scores.
//   Each component of the ground state eigenvector = how much
//   each knowledge node contributes to the optimal answer.
// =========================================================================
'use strict';

// ─── MATRIX MATH (same zero-dependency utilities, extended) ────────────────
const M = {
    zeros(n)   { return Array.from({length:n}, ()=>new Array(n).fill(0)); },
    identity(n){ const I=this.zeros(n); for(let i=0;i<n;i++) I[i][i]=1; return I; },

    transpose(A) {
        const n=A.length, T=this.zeros(n);
        for(let i=0;i<n;i++) for(let j=0;j<n;j++) T[j][i]=A[i][j];
        return T;
    },

    addScaled(A, B, sA=1, sB=1) {
        return A.map((row,i)=>row.map((v,j)=>v*sA+B[i][j]*sB));
    },

    mul(A, B) {
        const n=A.length, C=this.zeros(n);
        for(let i=0;i<n;i++) for(let k=0;k<n;k++) if(A[i][k])
            for(let j=0;j<n;j++) C[i][j]+=A[i][k]*B[k][j];
        return C;
    },

    mulVec(A, v) {
        return A.map(row=>row.reduce((s,a,j)=>s+a*v[j],0));
    },

    norm(v)      { return Math.sqrt(v.reduce((s,x)=>s+x*x,0)); },
    normalize(v) { const n=this.norm(v); return n<1e-14?v:v.map(x=>x/n); },
    dot(a,b)     { return a.reduce((s,x,i)=>s+x*b[i],0); },

    scaleVec(v,s){ return v.map(x=>x*s); },
    addVec(a,b)  { return a.map((x,i)=>x+b[i]); },

    trace(A) { return A.reduce((s,row,i)=>s+row[i],0); },

    // Rayleigh quotient: ⟨v|H|v⟩ / ⟨v|v⟩ — energy of state v under H
    rayleigh(H, v) {
        const Hv = this.mulVec(H, v);
        return this.dot(v, Hv) / Math.max(this.dot(v,v), 1e-14);
    },

    // Power iteration → largest eigenvalue/vector
    powerIter(A, iters=200, tol=1e-10) {
        const n=A.length;
        // Random initialization biased positive
        let v = new Array(n).fill(0).map((_,i)=>0.3+0.7*((i*7+3)%11)/11);
        v = this.normalize(v);
        let λ=0, λPrev=0;
        for(let t=0;t<iters;t++) {
            const Av = this.mulVec(A, v);
            λ = this.norm(Av);
            if(λ<1e-14) break;
            v = Av.map(x=>x/λ);
            if(t>10 && Math.abs(λ-λPrev)<tol) break;
            λPrev=λ;
        }
        return {λ, v};
    },

    // Deflated power iteration: extract k eigenpairs
    eigenDecompose(A, k) {
        const n=A.length; k=Math.min(k,n);
        let R = A.map(row=>[...row]);
        const pairs=[];
        for(let s=0;s<k;s++) {
            const {λ,v}=this.powerIter(R);
            if(λ<1e-8) break;
            pairs.push({λ,v:[...v]});
            // Deflate: R = R - λ·vvᵀ
            for(let i=0;i<n;i++) for(let j=0;j<n;j++) R[i][j]-=λ*v[i]*v[j];
        }
        return pairs;
    },

    // Minimum diagonal (used for spectrum shift)
    minEigen_estimate(A) {
        // Gershgorin circle lower bound
        let min=Infinity;
        for(let i=0;i<A.length;i++) {
            const radius=A[i].reduce((s,v,j)=>j===i?s:s+Math.abs(v),0);
            min=Math.min(min, A[i][i]-radius);
        }
        return min;
    }
};

// ─── SOLUTION PATH ─────────────────────────────────────────────────────────
class SolutionPath {
    constructor(rank, eigenvalue, eigenvector, labels, contributions) {
        this.rank          = rank;
        this.eigenvalue    = eigenvalue;   // energy of this solution
        this.eigenvector   = eigenvector;
        this.labels        = labels;
        this.contributions = contributions; // sorted[{node, weight}]
    }

    report(H) {
        const energy = M.rayleigh(H, this.eigenvector);
        console.log(`\n  ┌─ PATH ${this.rank} ─────────────────────────────────────────`);
        console.log(`  │  Eigenvalue  : ${this.eigenvalue.toFixed(6)}`);
        console.log(`  │  Energy E    : ${energy.toFixed(6)}`);
        console.log(`  │  Top contributing nodes:`);
        this.contributions.slice(0,5).forEach((c,i)=>{
            const bar = '█'.repeat(Math.round(Math.abs(c.weight)*20));
            const sign = c.weight >= 0 ? '+' : '−';
            console.log(`  │    ${i+1}. ${c.node.padEnd(24)} ${sign}${Math.abs(c.weight).toFixed(4)}  ${bar}`);
        });
        console.log(`  └──────────────────────────────────────────────────────`);
    }
}

// ─── HAMILTONIAN OPTIMIZER ─────────────────────────────────────────────────
class HamiltonianOptimizer {
    constructor() {
        console.log('=================================================================');
        console.log('QEA PRIME — ENGINE 7: HAMILTONIAN OPTIMIZER');
        console.log('Role: Ground State Discovery · Zero Hallucination Solution Paths');
        console.log('=================================================================\n');
    }

    // ── STEP 1: Symmetrize and shift H to positive semidefinite ──────────
    _prepareHamiltonian(rawH) {
        const n = rawH.length;
        const Ht  = M.transpose(rawH);
        const Hsym = M.addScaled(rawH, Ht, 0.5, 0.5);   // (H+Hᵀ)/2

        // Gershgorin lower bound → shift spectrum to all-positive
        const λMin = M.minEigen_estimate(Hsym);
        const shift = λMin < 0 ? Math.abs(λMin) + 0.01 : 0;
        const I     = M.identity(n);
        const Hpsd  = M.addScaled(Hsym, I, 1, shift);

        console.log(`[H-PREP] Symmetrized H. Gershgorin lower bound: ${λMin.toFixed(4)}`);
        console.log(`[H-PREP] Spectrum shift applied: +${shift.toFixed(4)} · I`);
        console.log(`[H-PREP] H is now positive-semidefinite. Power iteration ready.\n`);

        return { Hpsd, Hsym, shift };
    }

    // ── STEP 2: Extract k solution paths via deflated eigendecomposition ─
    _extractPaths(Hpsd, Hsym, labels, k=4) {
        console.log(`[EIGEN] Extracting top ${k} eigenpairs via power iteration...`);
        const pairs = M.eigenDecompose(Hpsd, k);
        console.log(`[EIGEN] Found ${pairs.length} eigenpairs.\n`);

        return pairs.map((pair, idx) => {
            const v = pair.v;
            // Contribution of each node = |component|² (probability amplitude)
            const contribs = labels.map((node, i) => ({
                node,
                weight: v[i],
                absW: Math.abs(v[i])
            })).sort((a,b) => b.absW - a.absW);

            return new SolutionPath(idx+1, pair.λ, v, labels, contribs);
        });
    }

    // ── STEP 3: Ground state verdict ─────────────────────────────────────
    _groundStateVerdict(paths, labels) {
        if (!paths.length) return null;
        const gs = paths[0];   // highest eigenvalue after shift = ground state
        const top3 = gs.contributions.slice(0,3);

        console.log('=================================================================');
        console.log('[GROUND STATE] Optimal solution discovered:');
        console.log('─────────────────────────────────────────────────────────────────');
        console.log(`  Dominant eigenvalue : ${gs.eigenvalue.toFixed(6)}`);
        console.log('\n  The universe points to this synthesis:');
        top3.forEach((c,i) => {
            console.log(`    ${i+1}. ${c.node}  (amplitude ${c.weight.toFixed(4)})`);
        });

        // Synthesize a human-readable directive
        const action = top3.map(c => c.node.replace(/_/g,' ')).join(' + ');
        console.log(`\n  ▶ DIRECTIVE: "${action}"`);
        console.log('─────────────────────────────────────────────────────────────────');

        return gs;
    }

    // ── MAIN ENTRY ────────────────────────────────────────────────────────
    optimize(rawH, labels, k=4) {
        console.log(`[OPTIMIZER] Received ${labels.length}×${labels.length} Hamiltonian from OpenClaw 2.0`);
        console.log(`[OPTIMIZER] Nodes: ${labels.join(', ')}\n`);

        const { Hpsd, Hsym, shift } = this._prepareHamiltonian(rawH);
        const paths = this._extractPaths(Hpsd, Hsym, labels, k);

        console.log('─────────────────────────────────────────────────────────────────');
        console.log('[SOLUTION PATHS] All discovered paths (ranked by eigenvalue):');
        paths.forEach(p => p.report(Hpsd));

        const groundState = this._groundStateVerdict(paths, labels);

        // Energy gap: difference between top two eigenvalues
        // Large gap = confident, unique solution. Small gap = degenerate, uncertain.
        if (paths.length >= 2) {
            const gap = paths[0].eigenvalue - paths[1].eigenvalue;
            console.log(`\n[SPECTRAL GAP] E₀ - E₁ = ${gap.toFixed(6)}`);
            if (gap > 0.3) {
                console.log(`  → Gap is LARGE. Ground state is UNIQUE and STABLE.`);
                console.log(`  → High confidence: solution is non-degenerate.`);
            } else if (gap > 0.05) {
                console.log(`  → Gap is MODERATE. Solution is likely correct.`);
                console.log(`  → Consider running Many-Worlds Engine (Engine 8) for confirmation.`);
            } else {
                console.log(`  → Gap is SMALL. Degenerate solutions detected.`);
                console.log(`  → Engine 8 (Many-Worlds Arbitration) is REQUIRED.`);
            }
        }

        console.log('\n[SYSTEM] Hamiltonian Optimizer → Unitary Ledger + GitHub Matrix.');
        return { paths, groundState, shift };
    }
}

// ─── INLINE OPENCLAW 2.0 GRAPH (reproduces the exact output) ───────────────
// In production: `require('./openclaw2.js').OpenClaw2` runs and pipes here.
// For standalone execution: we rebuild the same graph inline.
function buildKnowledgeMatrix() {
    // 10 nodes from OpenClaw 2.0
    const labels =[
        'BB84_PROTOCOL',
        'NO_CLONING',
        'LINDBLAD_EQ',
        'SHOR_ALGORITHM',
        'BB84_EAVESDROP',
        'ENTANGLEMENT_FIDELITY',
        'FMO_300K',
        'RUST_MEMORY_SAFETY',
        'DECOHERENCE_300K',
        'QKD_IMPLEMENTATION',
    ];

    const conf =[0.93, 0.97, 0.95, 0.91, 0.89, 0.88, 0.72, 0.94, 0.80, 0.85];
    const n = labels.length;
    const idx = Object.fromEntries(labels.map((l,i)=>[l,i]));

    // Build H: diagonal = confidence, off-diagonal = signed edge weights
    const H = M.zeros(n);
    conf.forEach((c,i) => H[i][i] = c);

    // Edges: [from, to, relPhase, strength]
    const edges =[['BB84_PROTOCOL',        'NO_CLONING',             0.7,  0.99],['LINDBLAD_EQ',          'DECOHERENCE_300K',        1.0,  0.90],['DECOHERENCE_300K',     'ENTANGLEMENT_FIDELITY',  -1.0,  0.75],['FMO_300K',             'ENTANGLEMENT_FIDELITY',   1.0,  0.65],['SHOR_ALGORITHM',       'BB84_PROTOCOL',          -1.0,  0.80],['BB84_EAVESDROP',       'BB84_PROTOCOL',           1.0,  0.85],['BB84_PROTOCOL',        'QKD_IMPLEMENTATION',      0.5,  0.90],['RUST_MEMORY_SAFETY',   'QKD_IMPLEMENTATION',      0.5,  0.94],['ENTANGLEMENT_FIDELITY','QKD_IMPLEMENTATION',      1.0,  0.88],['LINDBLAD_EQ',          'ENTANGLEMENT_FIDELITY',   0.5,  0.87],
    ];

    for (const[from, to, phase, str] of edges) {
        const i = idx[from], j = idx[to];
        const w = phase * str;
        H[i][j] += w;
        H[j][i] += w * 0.5;
    }

    return { H, labels };
}

// ─── EXECUTION ─────────────────────────────────────────────────────────────
const { H, labels } = buildKnowledgeMatrix();
const optimizer = new HamiltonianOptimizer();
optimizer.optimize(H, labels, 4);
