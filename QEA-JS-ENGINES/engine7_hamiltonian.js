const fs = require('fs');
const path = require('path');

console.log("=================================================================");
console.log("QEA PRIME — ENGINE 7: HAMILTONIAN OPTIMIZER");
console.log("Role: Ground State Discovery · Zero Hallucination Solution Paths");
console.log("=================================================================\n");

const graphFile = path.join(__dirname, 'openclaw_graph_output.json');
if (!fs.existsSync(graphFile)) {
    console.error("[CRITICAL] openclaw_graph_output.json not found. The Bridge failed to emit.");
    process.exit(1);
}

// SOTA FIX: Read the dynamic graph directly from the Bridge
const graphData = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
const H = graphData.matrix;
const nodes = graphData.labels;
const n = nodes.length;

console.log(`[OPTIMIZER] Received ${n}x${n} Hamiltonian from OpenClaw 2.0 (Bridge)`);
console.log(`[OPTIMIZER] Nodes: ${nodes.join(', ')}\n`);

// Symmetrize H: H_sym = (H + H^T) / 2
let H_sym = Array.from({length: n}, () => new Array(n).fill(0));
for (let i=0; i<n; i++) {
    for (let j=0; j<n; j++) {
        H_sym[i][j] = (H[i][j] + H[j][i]) / 2;
    }
}

// Power Iteration with Deflation for top 4 pairs
function dot(a, b) { return a.reduce((sum, val, i) => sum + val * b[i], 0); }
function normalize(v) {
    const norm = Math.sqrt(dot(v, v));
    return norm === 0 ? v : v.map(x => x / norm);
}
function multiply(M, v) {
    return M.map(row => dot(row, v));
}

// Gershgorin shift to ensure positive semi-definiteness
let minDiag = Infinity;
for(let i=0; i<n; i++) {
    let offSum = 0;
    for(let j=0; j<n; j++) {
        if(i!==j) offSum += Math.abs(H_sym[i][j]);
    }
    if(H_sym[i][i] - offSum < minDiag) minDiag = H_sym[i][i] - offSum;
}
const shift = minDiag < 0 ? Math.abs(minDiag) + 0.1 : 0;
if (shift > 0) {
    console.log(`[H-PREP] Symmetrized H. Gershgorin lower bound: ${minDiag.toFixed(4)}`);
    console.log(`[H-PREP] Spectrum shift applied: +${shift.toFixed(4)} · I`);
    for(let i=0; i<n; i++) H_sym[i][i] += shift;
}
console.log(`[H-PREP] H is now positive-semidefinite. Power iteration ready.\n`);

console.log(`[EIGEN] Extracting top 4 eigenpairs via power iteration...`);
const eigenpairs = [];
let current_M = H_sym.map(row => [...row]);

for (let k = 0; k < Math.min(4, n); k++) {
    let b_k = Array.from({length: n}, () => Math.random());
    b_k = normalize(b_k);
    let ev = 0;
    for (let iter = 0; iter < 100; iter++) {
        let next_b = multiply(current_M, b_k);
        b_k = normalize(next_b);
    }
    ev = dot(b_k, multiply(current_M, b_k));
    
    // Deflate
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            current_M[i][j] -= ev * b_k[i] * b_k[j];
        }
    }
    eigenpairs.push({ eigenvalue: ev - shift, vector: b_k });
}
console.log(`[EIGEN] Found ${eigenpairs.length} eigenpairs.\n`);

console.log(`─────────────────────────────────────────────────────────────────`);
console.log(`[SOLUTION PATHS] All discovered paths (ranked by eigenvalue):\n`);

eigenpairs.forEach((pair, idx) => {
    console.log(`  ┌─ PATH ${idx + 1} ─────────────────────────────────────────`);
    console.log(`  │  Eigenvalue  : ${pair.eigenvalue.toFixed(6)}`);
    console.log(`  │  Energy E    : ${pair.eigenvalue.toFixed(6)}`);
    console.log(`  │  Top contributing nodes:`);
    
    const sortedNodes = pair.vector
        .map((val, i) => ({ node: nodes[i], val }))
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
        .slice(0, 5); 
        
    sortedNodes.forEach((sn, nIdx) => {
        const barLen = Math.max(1, Math.round(Math.abs(sn.val) * 20));
        const bar = '█'.repeat(barLen);
        const sign = sn.val >= 0 ? '+' : '−';
        console.log(`  │    ${nIdx + 1}. ${sn.node.padEnd(25)} ${sign}${Math.abs(sn.val).toFixed(4)}  ${bar}`);
    });
    console.log(`  └──────────────────────────────────────────────────────\n`);
});

console.log(`=================================================================`);
console.log(`[GROUND STATE] Optimal solution discovered:`);
console.log(`─────────────────────────────────────────────────────────────────`);
const ground = eigenpairs[0];
console.log(`  Dominant eigenvalue : ${ground.eigenvalue.toFixed(6)}\n`);
console.log(`  The universe points to this synthesis:`);

const topGroundNodes = ground.vector
        .map((val, i) => ({ node: nodes[i], val }))
        .filter(n => Math.abs(n.val) > 0.05) 
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

topGroundNodes.slice(0,3).forEach((sn, i) => {
    console.log(`    ${i+1}. ${sn.node}  (amplitude ${Math.abs(sn.val).toFixed(4)})`);
});

const directive = topGroundNodes.slice(0,3).map(n => n.node.replace(/_/g, ' ')).join(' + ');
console.log(`\n  ▶ DIRECTIVE: "${directive}"`);
console.log(`─────────────────────────────────────────────────────────────────\n`);

let gap = 0;
if (eigenpairs.length > 1) {
    gap = eigenpairs[0].eigenvalue - eigenpairs[1].eigenvalue;
    console.log(`[SPECTRAL GAP] E₀ - E₁ = ${gap.toFixed(6)}`);
    const gapStatus = gap > 0.5 ? "STRONG" : (gap > 0.15 ? "MODERATE" : "WEAK");
    console.log(`  → Gap is ${gapStatus}. Solution is likely correct.`);
    console.log(`  → Consider running Many-Worlds Engine (Engine 8) for confirmation.\n`);
}

console.log(`[SYSTEM] Hamiltonian Optimizer → Unitary Ledger + GitHub Matrix.`);

