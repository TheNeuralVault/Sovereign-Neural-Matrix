'use strict';
const crypto = require('crypto');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const DB_PATH = path.join(__dirname, 'qea_ledger.db');

function openDB() {
    const db = new DatabaseSync(DB_PATH);
    db.exec(`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;`);
    db.exec(`
        CREATE TABLE IF NOT EXISTS ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            action TEXT NOT NULL, 
            data TEXT NOT NULL, 
            hash TEXT NOT NULL UNIQUE, 
            prev_hash TEXT NOT NULL, 
            task TEXT, 
            timestamp INTEGER NOT NULL
        );
    `);
    db.exec(`INSERT OR IGNORE INTO ledger (id, action, data, hash, prev_hash, task, timestamp) VALUES (1, 'PREAMBLE_INSTANTIATION', '"QEA PRIME does not invent. QEA PRIME discovers."', '0000000000000000000000000000000000000000000000000000000000000000', '0', 'GENESIS', 0);`);
    return db;
}

class UnitaryLedger {
    constructor() {
        this.db = openDB();
        this._insert = this.db.prepare(`INSERT INTO ledger (action, data, hash, prev_hash, task, timestamp) VALUES (?, ?, ?, ?, ?, ?)`);
        this._lastRow = this.db.prepare(`SELECT hash FROM ledger ORDER BY id DESC LIMIT 1`);
        this._history = this.db.prepare(`SELECT id, action, data, hash, prev_hash, task, timestamp FROM ledger ORDER BY id DESC LIMIT ?`);
    }
    
    _hash(action, data, prevHash) { 
        return crypto.createHash('sha256').update(action + JSON.stringify(data) + prevHash).digest('hex'); 
    }
    
    getLastHash() { 
        return this._lastRow.get()?.hash || '0'; 
    }
    
    evolveState(action, data, task = null) {
        const prevHash = this.getLastHash();
        const hash = this._hash(action, data, prevHash);
        try { 
            this._insert.run(action, JSON.stringify(data), hash, prevHash, task || action, Date.now()); 
            return hash; 
        } catch (err) { 
            if (err.message.includes('UNIQUE')) return hash; 
            throw err; 
        }
    }

    // SOTA FIX: Restoring the history extraction function
    history(limit = 20) {
        return this._history.all(limit).map(row => ({
            id: row.id,
            action: row.action,
            task: row.task,
            hash: row.hash,
            prev_hash: row.prev_hash.substring(0, 16) + '...',
            timestamp: new Date(row.timestamp).toISOString(),
            data: JSON.parse(row.data)
        }));
    }
}
const ledger = new UnitaryLedger();
module.exports = { ledger, UnitaryLedger };
