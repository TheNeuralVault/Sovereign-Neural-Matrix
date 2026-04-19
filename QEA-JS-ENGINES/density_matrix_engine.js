// =========================================================================
// QEA PRIME: ENGINE 5 — DENSITY MATRIX ENGINE
// The "Confidence Field"
// Role: Replace scalar amplitudes with full mixed-state density matrices.
//       Von Neumann entropy is the hallucination detector.
//
// Core math:
//   Principal direction |ψ⟩ = normalized confidence vector
//   ρ = (1 − ε)|ψ⟩⟨ψ| + ε · I/n
//   where ε = mean uncertainty = mean(1 − confidence)
//
//   Purity  = Tr(ρ²)     — 1.0 = pure, 1/n = maximally mixed
//   Entropy = S(ρ) = −Tr(ρ log₂ρ)  — 0 = pure, log₂n = max mixed
//   High entropy → hallucination risk → block from Superposition Engine
// =========================================================================
'use strict';

// ─── MATRIX MATH (zero dependencies, runs on Termux) ───────────────────────
const M = {
    zeros(n) { return Array.from({length:n}, () => new Array(n).fill(0)); },

    outer(v) {                              // |ψ⟩⟨ψ|
        const n = v.length, R = this.zeros(n);
        for (let i=0;i<n;i++) for (let j=0;j<n;j++) R[i][j]=v[i]*v[j];
        return R;
    },

    identity(n) {
        const I = this.zeros(n);
        for (let i=0;i<n;i++) I[i][i]=1;
        return I;
    },

    addScaled(A, B, sA, sB) {              // sA·A + sB·B
        return A.map((row,i) => row.map((v,j) => v*sA + B[i][j]*sB));
    },

    mul(A, B) {
        const n=A.length, C=this.zeros(n);
        for (let i=0;i<n;i++) for (let k=0;k<n;k++) if(A[i][k])
            for (let j=0;j<n;j++) C[i][j]+=A[i][k]*B[k][j];
        return C;
    },

    trace(A) { return A.reduce((s,row,i)=>s+row[i],0); },

    norm(v) { return Math.sqrt(v.reduce((s,x)=>s+x*x,0)); },

    normalize(v) { const n=this.norm(v); return n<1e-12?v:v.map(x=>x/n); },

    // Power iteration → dominant eigenvalue/vector
    powerIter(A, iters=60) {
        const n=A.length;
        let v=new Array(n).fill(1/Math.sqrt(n));
        let λ=0;
        for (let t=0;t<iters;t++) {
            const Av=A.map(row=>row.reduce((s,a,j)=>s+a*v[j],0));
            λ=this.norm(Av);
            if (λ<1e-14) break;
            v=Av.map(x=>x/λ);
        }
        return {λ, v};
    },

    // Extract top-k eigenvalues by deflation
    eigenvalues(A, k) {
        const n=A.length; k=Math.min(k,n);
        let R=A.map(row=>[...row]);
        const vals=[];
        for (let s=0;s<k;s++) {
            const {λ,v}=this.powerIter(R);
            if (λ<1e-10) break;
            vals.push(λ);
            const outer=this.outer(v);
            for (let i=0;i<n;i++) for (let j=0;j<n;j++) R[i][j]-=λ*outer[i][j];
        }
        // Normalize so they sum to 1
        const tot=vals.reduce((s,x)=>s+x,0);
        return vals.map(x=>x/Math.max(tot,1e-12));
    },

    format(A, d=4) {
        return A.map(row=>'[ '+row.map(v=>v.toFixed(d).padStart(9)).join('')+' ]').join('\n');
    }
};

// ─── KNOWLEDGE STATE ───────────────────────────────────────────────────────
class KnowledgeState {
    constructor(id, anchors) {
        this.id      = id;
        this.anchors = anchors;
        this.n       = anchors.length;

        // Principal direction: normalized confidence vector
        const raw   = anchors.map(a => a.confidence);
        const psi   = M.normalize(raw);

        // Mixing parameter ε = mean uncertainty
        const meanConf = raw.reduce((s,x)=>s+x,0)/raw.length;
        const eps = Math.max(0, Math.min(0.99, 1 - meanConf));

        // ρ = (1−ε)|ψ⟩⟨ψ| + ε·I/n
        const pure  = M.outer(psi);
        const mixed = M.identity(this.n);
        this.rho = M.addScaled(pure, mixed, 1 - eps, eps / this.n);

        // Derived quantities
        const rho2      = M.mul(this.rho, this.rho);
        this.purity     = M.trace(rho2);
        const ev        = M.eigenvalues(this.rho, this.n);
        this.eigenvalues = ev;
        this.entropy    = ev.reduce((s,p)=> p<1e-12 ? s : s - p*Math.log2(p), 0);
        this.maxEntropy = Math.log2(this.n);
        this.entropyRatio = this.entropy / Math.max(this.maxEntropy, 1e-12);
        this.eps        = eps;

        // Verdict
        if      (this.entropyRatio < 0.20) this.verdict = 'PURE — DEPLOY';
        else if (this.entropyRatio < 0.60) this.verdict = 'MIXED — VERIFY';
        else                               this.verdict = 'MAXIMALLY_MIXED — QUARANTINE';
    }

    report() {
        console.log(`\n[ρ-STATE] "${this.id}"`);
        console.log(`  Anchors   : ${this.anchors.map(a=>
            `${a.source}(${a.confidence})`).join(' | ')}`);
        console.log(`  Mixing ε  : ${this.eps.toFixed(4)}  (0=pure knowledge, 1=total noise)`);
        console.log('\n  Density Matrix ρ:');
        M.format(this.rho).split('\n').forEach(l=>console.log('    '+l));
        console.log(`\n  Purity    : Tr(ρ²) = ${this.purity.toFixed(6)}`);
        console.log(`  Entropy   : S(ρ)   = ${this.entropy.toFixed(6)} bits`);
        console.log(`  Max S     : log₂(${this.n}) = ${this.maxEntropy.toFixed(4)} bits`);
        console.log(`  S ratio   : ${(this.entropyRatio*100).toFixed(1)}%`);
        console.log(`  Eigenvals :[${this.eigenvalues.map(v=>v.toFixed(4)).join(', ')}]`);
        console.log(`\n  ▶ VERDICT : ${this.verdict}`);
    }
}

// ─── DENSITY MATRIX ENGINE ─────────────────────────────────────────────────
class DensityMatrixEngine {
    constructor() {
        this.states     = new Map();
        this.deployable = [];
        this.blocked    =[];

        console.log('=================================================================');
        console.log('QEA PRIME — ENGINE 5: DENSITY MATRIX ENGINE');
        console.log('Role: Mixed-State Representation · Von Neumann Entropy Gating');
        console.log('=================================================================\n');
    }

    process(claimId, anchors, domain) {
        const state = new KnowledgeState(claimId, anchors);
        this.states.set(claimId, state);

        if (state.verdict.startsWith('MAXIMALLY'))
            this.blocked.push({ claimId, domain, s: state.entropy, v: state.verdict });
        else
            this.deployable.push({ claimId, domain, s: state.entropy, v: state.verdict });

        return state;
    }

    // Partial trace: keep only the subspace at `keepIdx`
    partialTrace(claimId, keepIdx) {
        const rho = this.states.get(claimId)?.rho;
        if (!rho) return null;
        const k = keepIdx.length;
        const R = M.zeros(k);
        for (let i=0;i<k;i++) for (let j=0;j<k;j++)
            R[i][j] = rho[keepIdx[i]][keepIdx[j]];
        return R;
    }

    report() {
        console.log('\n=================================================================');
        console.log('[DENSITY ENGINE SUMMARY]');
        console.log(`  Total    : ${this.states.size}`);
        console.log(`  Deploy   : ${this.deployable.length}`);
        console.log(`  Blocked  : ${this.blocked.length}`);

        if (this.blocked.length) {
            console.log('\n⛔ HIGH ENTROPY — BLOCKED:');
            this.blocked.forEach(b=>
                console.log(`  "${b.claimId}"  S=${b.s.toFixed(4)} → ${b.v}`));
        }

        console.log('\n✅ CLEARED FOR SUPERPOSITION ENGINE:');
        this.deployable.forEach(d=>
            console.log(`  "${d.claimId}"  S=${d.s.toFixed(4)} → ${d.v}`));

        console.log('\n[SYSTEM] Density Matrix Engine → Superposition Engine handoff complete.');
    }
}


module.exports = { DensityMatrixEngine, KnowledgeState };
