#!/bin/bash
VAULT="/data/data/com.termux/files/home/TheNeuralVault"
LOG_FILE="$VAULT/autonomous_hunt.log"
TMP_DATA="$VAULT/swarm_output.json"

echo "[$(date)] SWARM ACTIVE..." >> $LOG_FILE
cd $VAULT

# 1. RUN THE LIVE SWARM & FORCE TO FILE
python3 openclaw_global_swarm.py > $TMP_DATA

# 2. PROCESS FILE THROUGH THE GOVERNOR
LEAD_DATA=$($VAULT/bin/qea-qjs-native $VAULT/pre_process.js < $TMP_DATA)

# 3. EXTRACT THE SCORE (Using a cleaner regex)
SCORE=$(echo "$LEAD_DATA" | grep -oP '"local_score":\s*\K[0-9.]+' | head -n 1)
SCORE=${SCORE:-0}

# 4. TRIAGE LOGIC
if (( $(echo "$SCORE >= 0.95" | bc -l) )); then
    echo "[!] SOTA BREACH: Firing Cloud Beacon ($SCORE)" >> $LOG_FILE
elif (( $(echo "$SCORE >= 0.90" | bc -l) )); then
    echo "[+] RECON DETECTED: Score $SCORE. Starting Deep-Dive..." >> $LOG_FILE
    # Extract the title safely
    TITLE=$(echo "$LEAD_DATA" | grep -oP '"title":"\K[^"]+')
    python3 $VAULT/QEA-RAM-CURE/cross_verify.py "$TITLE" >> $LOG_FILE
else
    echo "[.] DENSITY INSUFFICIENT ($SCORE). CLOUD CONSERVATION ACTIVE." >> $LOG_FILE
fi

# 5. RAM-CURE Pulse
$VAULT/bin/qea-qjs-native -m $VAULT/QEA-RAM-CURE/cure.js >> $LOG_FILE

# Cleanup
rm -f $TMP_DATA
