/**
 * Trinetra AI Engine
 * Handles sophisticated risk assessment, fraud detection, and parametric evaluation.
 */

class AIEngine {
    /**
     * Calculates a multi-factor risk score for a policy.
     * Factors: Job Type (40%), Income Level (20%), Zone Historical Risk (30%), Platform Reliability (10%)
     */
    static calculateRiskScore(jobType, income, zone) {
        let score = 0;

        // 1. Job Type Risk (Higher score = Higher risk)
        const jobRisks = {
            'Delivery': 0.85,
            'Driver': 0.65,
            'Freelancer': 0.35,
            'Other': 0.50
        };
        score += (jobRisks[jobType] || 0.5) * 0.4;

        // 2. Income Level (Lower income often correlates with higher dependency and risk sensitivity)
        const incomeScore = income < 20000 ? 0.8 : income < 50000 ? 0.5 : 0.2;
        score += incomeScore * 0.2;

        // 3. Zone Risk (Simulation: Coastal/Metro areas higher weather risk)
        const highRiskZones = ['Mumbai', 'Chennai', 'Kolkata', 'Kochi'];
        const isHighRiskZone = highRiskZones.some(city => zone.includes(city));
        score += (isHighRiskZone ? 0.75 : 0.3) * 0.3;

        // 4. Random fluctuation (Simulating ML uncertainty/nuance)
        score += (Math.random() * 0.1) * 0.1;

        return Math.min(Math.max(score, 0), 1).toFixed(2);
    }

    /**
     * AI Fraud Detection
     * Checks for anomalies in claim amount, frequency, and simulated behavioral signals.
     */
    static async detectFraud(claimData, history = []) {
        let fraudScore = 0.1; // Baseline
        let reasons = [];
        const isManual = claimData.trigger_type === 'manual_trigger';

        // 1. Unusual Amount Check (compared to job/income)
        if (claimData.amount > 3000) {
            fraudScore += 0.25;
            reasons.push("High claim amount threshold exceeded");
        }

        // 2. Frequency Check
        const recentClaims = history.filter(c => {
            const date = new Date(c.date);
            const now = new Date();
            return (now - date) < (7 * 24 * 60 * 60 * 1000); // last 7 days
        });

        if (recentClaims.length > 2) {
            fraudScore += 0.4;
            reasons.push("High claim frequency detected (Anomaly)");
        }

        // 3. Manual vs Parametric Scrutiny
        if (isManual) {
            fraudScore += 0.2;
            reasons.push("Manual trigger: Self-reported incident requires verification");
            
            // Lack of detailed proof text also increases score
            if (!claimData.proof || claimData.proof.length < 20) {
                fraudScore += 0.15;
                reasons.push("Insufficient descriptive proof for manual claim");
            }
        }

        // 4. Time Check (Late night claims often have higher manual fraud risk in some models)
        const hour = new Date().getHours();
        if (isManual && (hour < 5 || hour > 23)) {
            fraudScore += 0.1;
            reasons.push("Off-hours manual claim submission");
        }

        const isFraud = fraudScore > 0.6;
        
        return {
            isFraud,
            fraudScore: Math.min(fraudScore, 1).toFixed(2),
            analysis: reasons.length > 0 ? reasons.join(", ") : "Normal activity patterns detected."
        };
    }

    /**
     * Parametric Evaluator for Weather & AQI
     */
    static evaluateParametricTrigger(weather, aqi) {
        let conditionsMet = false;
        let type = "";
        let severity = "LOW";

        // Weather Triggers (WMO Codes: 80+ are heavy rain/storms)
        const isHeavyRain = weather.weatherCode >= 80 || weather.precipitation > 12;
        const isExtremeHeat = weather.temp > 44;

        // AQI Triggers (US AQI scale: > 200 is Very Unhealthy, > 300 is Hazardous)
        const isHazardousAQI = aqi > 250;

        if (isHeavyRain) {
            conditionsMet = true;
            type = "Severe Precipitation";
            severity = weather.precipitation > 25 ? "EXTREME" : "SEVERE";
        } else if (isHazardousAQI) {
            conditionsMet = true;
            type = "Hazardous Air Quality";
            severity = aqi > 350 ? "EXTREME" : "SEVERE";
        } else if (isExtremeHeat) {
            conditionsMet = true;
            type = "Extreme Heatwave";
            severity = "SEVERE";
        }

        return { conditionsMet, type, severity };
    }
}

module.exports = AIEngine;
