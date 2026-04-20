#!/bin/bash
# QEA PRIME: AUTONOMOUS OMNIVERSE PULSE & SOTA TELEMETRY

LOG_FILE="/data/data/com.termux/files/home/TheNeuralVault/autonomous_hunt.log"

# Self-Cleaning Protocol: Keep only the last 1000 lines to prevent SSD bloat
if [ -f "$LOG_FILE" ]; then
    tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

echo "=================================================================" >> $LOG_FILE
echo "WAKING OPENCLAW SWARM: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> $LOG_FILE
echo "=================================================================" >> $LOG_FILE

/data/data/com.termux/files/usr/bin/python3 /data/data/com.termux/files/home/TheNeuralVault/openclaw_global_swarm.py >> $LOG_FILE 2>&1

echo "-----------------------------------------------------------------" >> $LOG_FILE
echo "SWARM COMPLETE. FIRING CLOUD BEACON..." >> $LOG_FILE
echo "-----------------------------------------------------------------" >> $LOG_FILE

/data/data/com.termux/files/usr/bin/python3 /data/data/com.termux/files/home/TheNeuralVault/gist_beacon.py >> $LOG_FILE 2>&1

echo "=================================================================" >> $LOG_FILE
echo "PULSE COMPLETE. RETURNING TO CONSERVATION PHASE." >> $LOG_FILE
echo "" >> $LOG_FILE
