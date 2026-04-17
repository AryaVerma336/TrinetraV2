const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');

        // Setup initial tables
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                platform TEXT,
                zone TEXT,
                upi TEXT,
                pid TEXT
            )`, (err) => {
                if (err) console.error("Error creating users table:", err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS settings (
                user_id INTEGER PRIMARY KEY,
                config TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`, (err) => {
                if (err) console.error("Error creating settings table:", err);
            });

            // Alter users table to elegantly add dynamic policy fields if missing
            db.run(`ALTER TABLE users ADD COLUMN job_type TEXT;`, () => {});
            db.run(`ALTER TABLE users ADD COLUMN income INTEGER;`, () => {});

            db.run(`CREATE TABLE IF NOT EXISTS policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                income INTEGER,
                job_type TEXT,
                premium REAL,
                payout REAL,
                status TEXT DEFAULT 'Active',
                created_at TEXT
            )`, (err) => {
                if (err) console.error("Error creating policies table:", err);
            });

            db.run(`ALTER TABLE policies ADD COLUMN risk_score REAL DEFAULT 0.0;`, () => {});
            db.run(`ALTER TABLE policies ADD COLUMN zone TEXT;`, () => {});

            db.run(`CREATE TABLE IF NOT EXISTS claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                amount REAL NOT NULL,
                proof TEXT,
                status TEXT DEFAULT 'Pending Review',
                fraud_flag BOOLEAN DEFAULT 0,
                fraud_score REAL DEFAULT 0.0,
                ai_analysis TEXT,
                date TEXT NOT NULL
            )`, (err) => {
                if (err) console.error("Error creating claims table:", err);
            });

            db.run(`ALTER TABLE claims ADD COLUMN fraud_score REAL DEFAULT 0.0;`, () => {});
            db.run(`ALTER TABLE claims ADD COLUMN ai_analysis TEXT;`, () => {});
            db.run(`ALTER TABLE claims ADD COLUMN trigger_type TEXT DEFAULT 'Automatic';`, () => {});

            db.run(`CREATE TABLE IF NOT EXISTS betterment_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                prediction_date TEXT NOT NULL,
                insights TEXT NOT NULL,
                risk_profile TEXT,
                score REAL
            )`, (err) => {
                if (err) console.error("Error creating betterment_insights table:", err);
            });

            // Auto seed the 'demo worker' if it doesn't exist
            db.get("SELECT * FROM users WHERE phone = ?", ['+91 98765 43210'], (err, row) => {
                if (!err && !row) {
                    db.run(`INSERT INTO users (phone, password, name, platform, zone, upi, pid) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        ['+91 98765 43210', 'demo123', 'Rajan Kumar (Demo)', 'Zomato', 'Dharavi, Mumbai', 'rajan.kumar@upi', 'ZOM-DEL-2024-08421']
                    );
                }
            });

            // Auto seed the 'demo admin' if it doesn't exist
            db.get("SELECT * FROM users WHERE phone = ?", ['+91 99999 00000'], (err, row) => {
                if (!err && !row) {
                    db.run(`INSERT INTO users (phone, password, name, platform, zone, upi, pid) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        ['+91 99999 00000', 'admin123', 'Admin User', 'Admin', 'All Zones', 'admin@upi', 'ADMIN-001']
                    );
                }
            });
        });
    }
});

db.closeConnection = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

module.exports = db;
