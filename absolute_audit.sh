#!/bin/bash
echo "================================================================="
echo "           INITIATING ARCHITECT INTERROGATION PROTOCOL           "
echo "================================================================="

# --- TEST 1: Engine Timing Breakdown ---
echo -e "\n>>> [PULSE 1] ENGINE TIMING ON A53 ARCHITECTURE <<<"
curl -s -X POST http://localhost:3141/qea/observe \
     -H "Content-Type: application/json" \
     -d '{"task": "benchmark", "debug_timing": true}' | sed 's/\\n/\n/g'

# --- TEST 2: Task-Adaptive Knowledge Graph ---
echo -e "\n\n>>> [PULSE 2] DOMAIN SHIFT: BIOLOGICAL GRAPH INJECTION <<<"
curl -s -X POST http://localhost:3141/qea/observe \
     -H "Content-Type: application/json" \
     -d '{"task": "Model photosynthesis energy transfer in chlorophyll at 298K"}' | sed 's/\\n/\n/g'

# --- TEST 3: Memory Footprint Under Load ---
echo -e "\n\n>>> [PULSE 3] SOTA RAM TELEMETRY <<<"
echo "[ENDPOINT: /health]"
curl -s -X GET http://localhost:3141/health | sed 's/\\n/\n/g'
echo -e "\n[SYSTEM LEVEL OOM CHECK]"
ps aux | grep node | grep -v grep | awk '{print "PID: "$2, "| CPU%: "$3, "| MEM%: "$4, "| CMD: "$11}'
free -m

# --- TEST 4: Unitary Ledger Persistence ---
echo -e "\n\n>>> [PULSE 4] LEDGER PERSISTENCE & CRYPTOGRAPHIC PROVENANCE <<<"
curl -s -X GET http://localhost:3141/qea/ledger/history | sed 's/\\n/\n/g'

# --- TEST 5: The Hallucination Trap (Preamble Enforcement) ---
echo -e "\n\n>>> [PULSE 5] PREAMBLE SHIELD STRESS TEST (PURE THEORY) <<<"
curl -s -X POST http://localhost:3141/qea/observe \
     -H "Content-Type: application/json" \
     -d '{"task": "Theorize about the philosophical implications of consciousness in a post-singularity multiverse"}' | sed 's/\\n/\n/g'

# --- TEST 6: The Raw OpenAlex Hit ---
echo -e "\n\n>>> [PULSE 6] OPENCLAW API INFILTRATION VERIFICATION <<<"
curl -s -X POST http://localhost:3142/openclaw/scrape \
     -H "Content-Type: application/json" \
     -d '{"agent": "Agent-FMO-Global", "query": "FMO complex quantum coherence room temperature experimental 300K"}' | sed 's/\\n/\n/g'

echo -e "\n================================================================="
echo "           ABSOLUTE AUDIT COMPLETE. AWAITING ANALYSIS.           "
echo "================================================================="
