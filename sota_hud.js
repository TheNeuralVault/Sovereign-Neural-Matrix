import * as std from "std";

function renderHUD() {
    const logPath = "/data/data/com.termux/files/home/TheNeuralVault/autonomous_hunt.log";
    const logData = std.loadFile(logPath);
    if (!logData) return "HUD ERROR: Logs not found at " + logPath;

    const lines = logData.split('\n').filter(l => l.trim() !== "");
    const totalEvents = lines.length;
    
    // V3.0 Logic: Differentiate between 0.95+ (SOTA) and 0.90+ (RECON)
    const sotaHits = lines.filter(l => l.includes("0.95") || l.includes("BEACON FIRED")).length;
    const reconHits = lines.filter(l => /0.9[0-4]/.test(l)).length;
    const noise = lines.filter(l => l.includes("INSUFFICIENT")).length;
    const memoryCures = lines.filter(l => l.includes("MEMORY RECOVERED")).length;

    const sotaMap = lines.slice(-10).map(l => {
        if (l.includes("0.95")) return "  [!] SOTA BREACH      ";
        if (/0.9[0-4]/.test(l)) return "  [+] RECON DETECTED   ";
        if (l.includes("RECOVERED")) return "  [R] RAM-CURE PULSE   ";
        if (l.includes("INSUFFICIENT")) return "  [.] Filtered (Noise) ";
        if (l.includes("ACTIVE"))     return "  [*] Pulsing Swarm... ";
        return "  [?] Scanning...      ";
    }).join('\n');

    return `
=================================================================
   QEA PRIME: SOVEREIGN NEURAL MATRIX HUD [V3.0 - RECON]
=================================================================
   [SYSTEM STATS]
   Total Events:   ${totalEvents} Lines
   RAM-CURE Hits:  ${memoryCures} Pulses
   
   [INTELLIGENCE FLOW]
   SOTA (0.95+):   ${sotaHits}  [CRYPTO-LOCKED]
   RECON (0.90+):  ${reconHits}  [INVESTIGATING]
   NOISE:          ${noise}  [CONSERVED]
   
   [LATEST LOGIC FLOW]
${sotaMap}
=================================================================
   STATUS: INVESTIGATING 0.90+ BREAKTHROUGHS
=================================================================
    `;
}

console.log(renderHUD());
