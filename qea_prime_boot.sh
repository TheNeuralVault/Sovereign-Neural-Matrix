#!/bin/bash
VAULT="$HOME/TheNeuralVault"
SYSTEM="$VAULT/system"
mkdir -p "$SYSTEM/pids" "$SYSTEM/history" "$SYSTEM/quarantine"

detect_env() {
    if[ -f /etc/os-release ] && grep -qi "ubuntu" /etc/os-release 2>/dev/null; then echo "UBUNTU_PROOT"
    elif[ -d /data/data/com.termux ]; then echo "TERMUX_NATIVE"
    else echo "UNKNOWN"; fi
}
ENV=$(detect_env)

echo "================================================================="
echo "  QEA PRIME BOOT — $ENV"
echo "================================================================="

# Kill old daemons
for daemon in nervous_system brain_stem; do
    pid_file="$SYSTEM/pids/${daemon}.pid"
    if[ -f "$pid_file" ]; then
        kill "$(cat $pid_file)" 2>/dev/null
        rm -f "$pid_file"
    fi
done

# Start nervous system
nohup python3 "$VAULT/qea_nervous_system.py" > "$SYSTEM/ns_stdout.log" 2>&1 &
echo $! > "$SYSTEM/pids/nervous_system.pid"
sleep 1
kill -0 "$(cat $SYSTEM/pids/nervous_system.pid)" 2>/dev/null && echo "  ✓ Nervous System ONLINE" || echo "  ✗ Nervous System FAILED"

# Start brain stem
nohup python3 "$VAULT/qea_brain_stem.py" > "$SYSTEM/bs_stdout.log" 2>&1 &
echo $! > "$SYSTEM/pids/brain_stem.pid"
sleep 1
kill -0 "$(cat $SYSTEM/pids/brain_stem.pid)" 2>/dev/null && echo "  ✓ Brain Stem ONLINE" || echo "  ✗ Brain Stem FAILED"

# Immune cycle
echo "  [IMMUNE] Running boot cycle..."
python3 "$VAULT/qea_immune_system.py" > "$SYSTEM/immune_boot_report.json" 2>&1
python3 -c "
import json
try:
    r = json.load(open('$SYSTEM/immune_boot_report.json'))
    print(f\"  ✓ Immune Cycle: {r['threats_found']} threats | {r['purged']} purged | {r['quarantined']} quarantined\")
except: print('  ? Immune report unreadable')
" 2>/dev/null

echo ""
echo "  Heartbeat : cat $SYSTEM/vault_heartbeat.json"
echo "  Memory    : python3 $VAULT/qea_brain_stem.py summary"
echo "  Stop all  : kill \$(cat $SYSTEM/pids/nervous_system.pid) \$(cat $SYSTEM/pids/brain_stem.pid)"
echo "================================================================="
