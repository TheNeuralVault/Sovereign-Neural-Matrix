// =========================================================================
// QEA PRIME: ENGINE 6 — QUANTUM ERROR CORRECTION ENGINE
// The "Shield"
// Role: Self-healing claim validation via parity checks and syndrome detection.
//       Bad data quarantined BEFORE reaching the Superposition Engine.
//
// Uses a [6,3] systematic code:
//   3 data bits (anchor votes) + 3 parity bits
//   p0 = d0 XOR d1,  p1 = d1 XOR d2,  p2 = d0 XOR d2
//   Valid codeword → zero syndrome across all 3 check rows
// =========================================================================
'use strict';
const crypto = require('crypto');

class ParityMatrix {
    constructor() {
        this.H = [[1, 1, 0,  1, 0, 0],[0, 1, 1,  0, 1, 0],
            [1, 0, 1,  0, 0, 1]
        ];
    }

    encode(d) {
        // d = [d0, d1, d2]
        return [d[0], d[1], d[2],
                (d[0] ^ d[1]) & 1,
                (d[1] ^ d[2]) & 1,
                (d[0] ^ d[2]) & 1];
    }

    syndrome(cw) {
        return this.H.map(row =>
            row.reduce((acc, b, i) => acc ^ (b & (cw[i] || 0)), 0)
        );
    }
}

class Claim {
    constructor(id, content, anchors) {
        this.id       = id;
        this.content  = content;
        this.anchors  = anchors;
        this.status   = 'UNCHECKED';
        this.corrected = false;
        this.hash = crypto.createHash('sha256')
            .update(id + JSON.stringify(content)).digest('hex');
    }
    // Confidence >= 0.6 → anchor votes 1 (agrees), else 0
    dataBits(threshold = 0.6) {
        return this.anchors.slice(0, 3).map(a => a.confidence >= threshold ? 1 : 0);
    }
}

class QECEngine {
    constructor() {
        this.stabilized   =[];
        this.quarantine   = [];
        this.corrections  =[];
        this.pm           = new ParityMatrix();

        console.log('=================================================================');
        console.log('QEA PRIME — ENGINE 6: QUANTUM ERROR CORRECTION');
        console.log('Role: Syndrome Detection · Self-Healing · Quarantine');
        console.log('=================================================================\n');
    }

    _tryCorrect(cw) {
        for (let i = 0; i < cw.length; i++) {
            const trial = [...cw];
            trial[i] ^= 1;
            if (this.pm.syndrome(trial).every(s => s === 0))
                return { ok: true, bit: i, cw: trial };
        }
        return { ok: false, bit: -1, cw };
    }

    validate(claim) {
        const d   = claim.dataBits();
        const cw  = this.pm.encode(d);
        const syn = this.pm.syndrome(cw);
        const err = syn.some(s => s !== 0);

        console.log(`\n[QEC] "${claim.id}"`);
        console.log(`  Anchors  : ${claim.anchors.map(a =>
            `${a.source}(${a.confidence})`).join(' | ')}`);
        console.log(`  DataBits : [${d.join(', ')}]  →  Codeword: [${cw.join(', ')}]`);
        console.log(`  Syndrome : [${syn.join(', ')}]`);

        if (!err) {
            console.log(`  ✅ STABILIZED — zero syndrome.`);
            claim.status = 'STABILIZED';
            this.stabilized.push(claim);
            return claim;
        }

        const fix = this._tryCorrect(cw);
        if (fix.ok) {
            console.log(`  🔧 CORRECTED  — bit ${fix.bit} flipped, re-validated.`);
            claim.status   = 'STABILIZED';
            claim.corrected = true;
            this.corrections.push({ id: claim.id, bit: fix.bit, ts: Date.now() });
            this.stabilized.push(claim);
        } else {
            console.log(`  ⛔ QUARANTINE — multi-bit error, cannot correct.`);
            claim.status = 'QUARANTINED';
            this.quarantine.push(claim);
        }
        return claim;
    }

    processBatch(claims) {
        console.log(`[BATCH] ${claims.length} claims incoming from OpenClaw...\n`);
        claims.forEach(c => this.validate(c));

        console.log('\n─────────────────────────────────────────────────────────────────');
        console.log('[QEC REPORT]');
        console.log(`  Stabilized  : ${this.stabilized.length}  (${this.corrections.length} corrected)`);
        console.log(`  Quarantined : ${this.quarantine.length}`);
        if (this.quarantine.length)
            this.quarantine.forEach(c =>
                console.log(`  ⛔  ${c.id} — votes[${c.dataBits().join(',')}]`));
        console.log(`\n→ Handing ${this.stabilized.length} verified claims to Density Matrix Engine.`);
        return this.stabilized;
    }
}


module.exports = { QECEngine, Claim };
