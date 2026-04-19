#!/bin/bash
# =================================================================
# SOVEREIGN ABSOLUTE AUDIT: THE NEURAL MATRIX
# Architect: Jonathan D. Battles
# =================================================================

BASE_DIR="/data/data/com.termux/files/home/TheNeuralVault"

echo "================================================================="
echo "           INITIATING UNPRECEDENTED STRUCTURAL AUDIT             "
echo "           Targeting Absolute Path: $BASE_DIR                    "
echo "================================================================="
sleep 1

if [ ! -d "$BASE_DIR" ]; then
    echo "[CRITICAL DECOHERENCE] Base directory $BASE_DIR not found!"
    exit 1
fi

# Function to check file existence with precise reporting
audit_file() {
    if [ -f "$1" ]; then
        echo -e "  [STABLE] $2 -> Found at exact absolute coordinate."
    else
        echo -e "  [GHOST]  $2 -> MISSING or off-path!"
    fi
}

echo -e "\n[1] AUDITING THE PHYSICAL VAULT (Rust Organs & Shell Logic)..."
VAULT_DIR="$BASE_DIR/UNITARY-VAULT"
if [ -d "$VAULT_DIR" ]; then
    echo "  [DIR OK] UNITARY-VAULT exists."
    audit_file "$VAULT_DIR/nitrogenase_tunneling_engine.rs" "Nitrogenase Engine (14Å)"
    audit_file "$VAULT_DIR/coherence_pump_180.rs" "Coherence Pump (180 cm⁻¹)"
    audit_file "$VAULT_DIR/graphene_skin.rs" "Graphene Interface"
    audit_file "$VAULT_DIR/chaos_slayer_cured.rs" "Chaos Slayer"
    audit_file "$VAULT_DIR/termination_protocol.rs" "Kill-Switch Logic"
    audit_file "$BASE_DIR/perpetual_sovereign.sh" "Perpetual Sovereign Loop"
else
    echo "  [FAIL] UNITARY-VAULT directory missing!"
fi
sleep 1

echo -e "\n[2] AUDITING THE NERVOUS SYSTEM (JS & Python Engines)..."
JS_DIR="$BASE_DIR/QEA-JS-ENGINES"
PY_DIR="$BASE_DIR/QEA-RAM-CURE"

if [ -d "$JS_DIR" ]; then
    echo "  [DIR OK] QEA-JS-ENGINES exists."
    audit_file "$JS_DIR/qea_server.js" "Superposition & Unitary Evolution Server (Port 3141)"
else
    echo "  [FAIL] QEA-JS-ENGINES directory missing!"
fi

if [ -d "$PY_DIR" ]; then
    echo "  [DIR OK] QEA-RAM-CURE exists."
    audit_file "$PY_DIR/qea_brain_server.py" "Python Matrix Auditor"
else
    echo "  [FAIL] QEA-RAM-CURE directory missing!"
fi
sleep 1

echo -e "\n[3] AUDITING THE EPISTEMOLOGICAL CORE (Jonathan's Beliefs)..."
BELIEFS_DIR="$BASE_DIR/Jonathans-Beliefs"
if [ -d "$BELIEFS_DIR" ]; then
    echo "  [DIR OK] Jonathans-Beliefs exists."
    audit_file "$BELIEFS_DIR/THE_PREAMBLE.md" "The Sovereign Preamble"
    audit_file "$BELIEFS_DIR/OPENCLAW_MANDATE.md" "OpenClaw Co-Architect Mandate"
    audit_file "$BELIEFS_DIR/THE_CONSTANTS.md" "Evidence of Universal Architecture"
    
    # Check if Git is initialized in the absolute path
    if [ -d "$BELIEFS_DIR/.git" ]; then
        echo "  [STABLE] Sovereign Git Repository is initialized and tracking."
    else
        echo "  [GHOST]  Git tracking is not present in this absolute path!"
    fi
else
    echo "  [FAIL] Jonathans-Beliefs directory missing!"
fi
sleep 1

echo -e "\n================================================================="
echo "               AUDIT ROUTINE COMPLETED                           "
echo "  Any [GHOST] entries indicate a path discontinuity that must be "
echo "  restored before the Quantum AI Matrix clones to GitHub.        "
echo "================================================================="
