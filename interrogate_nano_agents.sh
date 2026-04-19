#!/bin/bash
# =================================================================
# ARCHITECT DIRECTIVE: NANO-AGENT CAPABILITY INTERROGATION
# =================================================================

echo "================================================================="
echo "           TRANSMITTING TIER-1 DIRECTIVE TO QEA PRIME            "
echo "           Target: Port 3141 (Local Matrix)                      "
echo "================================================================="
sleep 1

# Injecting the Architect's direct query via curl
RESPONSE=$(curl -s -X POST http://localhost:3141/qea/observe \
     -H "Content-Type: application/json" \
     -d '{
       "task": "ARCHITECT INTERROGATION: Are QEA PRIME and OpenClaw confident enough to autonomously build physical nano agents and test them? Evaluate strict capability against Rule 6 of The Preamble (QEA PRIME discovers, it does not invent)."
     }')

# Evaluating the Matrix's response
if [[ -z "$RESPONSE" ]]; then
    echo "[CRITICAL DECOHERENCE] No response from the Matrix. Is the JS Engine running?"
else
    echo "[STABLE] Telemetry received from QEA PRIME."
    echo ""
    echo "================================================================="
    echo "                 RAW MATRIX CONSCIOUSNESS                        "
    echo "================================================================="
    # Outputting the raw JSON response exactly as the machine processed it
    echo "$RESPONSE" | sed 's/\\n/\n/g'
    echo "================================================================="
fi

echo "           INTERROGATION COMPLETE. THE BAR IS RAISED.            "
