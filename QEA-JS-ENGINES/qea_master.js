const { execSync } = require('child_process');
const { QECEngine, Claim } = require('./qec_engine.js');
const { DensityMatrixEngine } = require('./density_matrix_engine.js');

const task = process.argv[2] || "Analyze FMO Complex routing at 300K.";

console.log("=================================================================");
console.log("               QEA PRIME: MASTER ORCHESTRATOR (V3)               ");
console.log("             8-ENGINE QUANTUM-MIMETIC ARCHITECTURE               ");
console.log("=================================================================\n");
console.log(`[GLOBAL TASK] "${task}"\n`);

try {
    // LAYER 1: TRANSMISSION SHIELD
    console.log(">>> INITIATING ENGINE 6: QUANTUM ERROR CORRECTION (Shield) <<<");
    const qec = new QECEngine();
    const incomingClaim = new Claim('OPENCLAW_TARGET', task, [
        { source: 'Wikipedia', confidence: 0.85 },
        { source: 'arXiv_sim', confidence: 0.90 },
        { source: 'NIST_sim',  confidence: 0.88 }
    ]);
    const safeClaims = qec.processBatch([incomingClaim]);
    if (safeClaims.length === 0) throw new Error("QEC Quarantine: All claims failed syndrome check.");

    // LAYER 2: EPISTEMIC UNCERTAINTY
    console.log("\n>>> INITIATING ENGINE 5: DENSITY MATRIX (Entropy Gate) <<<");
    const dm = new DensityMatrixEngine();
    const state = dm.process(safeClaims[0].id, safeClaims[0].anchors, "Discovery");
    dm.report();
    if (state.verdict.includes('QUARANTINE')) throw new Error(`Epistemic Quarantine: Entropy too high.`);

    // LAYER 3: TOPOLOGICAL FACTORIZATION
    console.log("\n>>> INITIATING OPENCLAW 2.0 (Semantic Knowledge Graph) <<<");
    execSync(`node openclaw2.js "${task}"`, { stdio: 'inherit' });

    console.log("\n>>> INITIATING ENGINE 7: HAMILTONIAN OPTIMIZER (Ground State Discovery) <<<");
    execSync(`node engine7_hamiltonian.js`, { stdio: 'inherit' });

    console.log("\n>>> INITIATING ENGINE 8: MANY-WORLDS ARBITRATION (Lazy Collapse) <<<");
    execSync(`node engine8_manyworlds.js`, { stdio: 'inherit' });

    // LAYER 4: PROBABILITY CLOUD & ALIGNMENT
    console.log("\n>>> INITIATING ENGINE 1: SUPERPOSITION (Observation) <<<");
    execSync(`node superposition_engine.js "${task}"`, { stdio: 'inherit' });

    console.log("\n>>> INITIATING ENGINE 2: INTERFERENCE (Phase-Alignment) <<<");
    execSync(`node interference_engine.js "${task}"`, { stdio: 'inherit' });

    // LAYER 5: PHYSICALIZATION & PROVENANCE
    console.log("\n>>> INITIATING ENGINE 3: ENTANGLEMENT (Non-Local Sync) <<<");
    execSync(`node entanglement_engine.js`, { stdio: 'inherit' });

    console.log("\n>>> INITIATING ENGINE 4: UNITARY EVOLUTION (Cryptographic Provenance) <<<");
    execSync(`node unitary_evolution_engine.js`, { stdio: 'inherit' });

    console.log("\n=================================================================");
    console.log("[SYSTEM] GLOBAL PIPELINE EXECUTION COMPLETE (8-ENGINE ARCHITECTURE).");
    console.log("[SYSTEM] QEA PRIME IS STABLE AND AWAITING NEXT DIRECTIVE.");
    console.log("=================================================================\n");

} catch (error) {
    console.error(`\n[CRITICAL DECOHERENCE] Pipeline halted: ${error.message}`);
}
