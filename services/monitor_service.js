/**
 * Trinetra Automated Monitor Service
 * Periodically checks environmental triggers and processes auto-payouts.
 */

const db = require('../database');
const AIEngine = require('../engine/ai_engine');

class MonitorService {
    constructor() {
        this.interval = null;
        this.checkFrequency = 10 * 60 * 1000; // Check every 10 minutes
    }

    start() {
        console.log('🛡️ Trinetra Monitor Service: Starting autonomous parametric monitoring...');
        this.runCheck();
        this.interval = setInterval(() => this.runCheck(), this.checkFrequency);
    }

    async runCheck() {
        console.log(`[${new Date().toISOString()}] Monitor Check Initiated...`);
        try {
            // 1. Get all unique zones from active policies
            const zones = await this.getActiveZones();
            if (zones.length === 0) return;

            for (const zone of zones) {
                // 2. Fetch Environmental Data (Weather + AQI)
                const data = await this.getEnvironmentalData(zone);
                if (!data) continue;

                // 3. Evaluate Triggers via AI Engine
                const evaluation = AIEngine.evaluateParametricTrigger(data.weather, data.aqi);

                if (evaluation.conditionsMet) {
                    console.log(`🚨 TRIGGER DETECTED in ${zone}: ${evaluation.type} (${evaluation.severity})`);
                    await this.logTrigger(zone, evaluation.type, data);
                    await this.processAutoPayouts(zone, evaluation);
                }
            }
        } catch (error) {
            console.error('Monitor Service Error:', error);
        }
    }

    getActiveZones() {
        return new Promise((resolve, reject) => {
            db.all("SELECT DISTINCT zone FROM policies WHERE status = 'Active'", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.zone).filter(Boolean));
            });
        });
    }

    async getEnvironmentalData(zone) {
        try {
            // We need lat/lon for the zone. Nominatim can provide this.
            const fetch = (await import('node-fetch')).default;
            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zone)}&limit=1`;
            const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'Trinetra-Monitor/1.0' } });
            const geoData = await geoRes.json();
            
            if (!geoData || geoData.length === 0) return null;
            const { lat, lon } = geoData[0];

            // Fetch Weather
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&forecast_days=1`;
            const weatherRes = await fetch(weatherUrl);
            const weatherJson = await weatherRes.json();
            const current = weatherJson.current || {};

            // Fetch AQI
            const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
            const aqiRes = await fetch(aqiUrl);
            const aqiJson = await aqiRes.json();
            const aqi = aqiJson.current?.us_aqi || 0;

            return {
                weather: {
                    temp: current.temperature_2m,
                    precipitation: current.precipitation,
                    weatherCode: current.weather_code
                },
                aqi: aqi,
                raw: { weather: weatherJson, aqi: aqiJson }
            };
        } catch (e) {
            console.error(`Failed to fetch data for zone ${zone}:`, e.message);
            return null;
        }
    }

    logTrigger(zone, type, data) {
        return new Promise((resolve, reject) => {
            const query = "INSERT INTO triggers_log (zone, trigger_type, data, date) VALUES (?, ?, ?, ?)";
            const date = new Date().toISOString();
            db.run(query, [zone, type, JSON.stringify(data), date], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async processAutoPayouts(zone, evaluation) {
        return new Promise((resolve, reject) => {
            // Payout matches the severity
            const payoutAmount = evaluation.severity === 'EXTREME' ? 1500 : 500;
            const date = new Date().toISOString();

            // Find all users in this zone with active policies
            db.all("SELECT phone FROM policies WHERE zone = ? AND status = 'Active'", [zone], (err, policies) => {
                if (err) return reject(err);
                
                policies.forEach(policy => {
                    // Check if they already have a claim for this trigger today to prevent double-payouts
                    const today = date.split('T')[0];
                    db.get("SELECT id FROM claims WHERE phone = ? AND date LIKE ? AND proof LIKE ?", 
                        [policy.phone, `${today}%`, `%${evaluation.type}%`], (err, exists) => {
                        if (!err && !exists) {
                            db.run("INSERT INTO claims (phone, amount, proof, status, fraud_flag, date) VALUES (?, ?, ?, 'Approved', 0, ?)",
                                [policy.phone, payoutAmount, `Auto-Trigger: ${evaluation.type}`, date]);
                            console.log(`✅ Auto-Payout processed for ${policy.phone}: ₹${payoutAmount}`);
                        }
                    });
                });
                resolve();
            });
        });
    }
}

module.exports = new MonitorService();
