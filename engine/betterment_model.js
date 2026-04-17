/**
 * Trinetra Betterment AI Model
 * Powered by TensorFlow.js
 * Predicts Income Loss Events to provide proactive "Betterment" insights.
 */

const tf = require('@tensorflow/tfjs');

class BettermentModel {
    constructor() {
        this.model = null;
        this.isReady = false;
    }

    /**
     * Initializes the Neural Network.
     * 5 Inputs: [Temperature, Precipitation, Wind Speed, AQI, Platform Uptime %]
     * 1 Output: Probability of Income Loss (0.0 to 1.0)
     */
    async init() {
        if (this.isReady) return;

        this.model = tf.sequential();
        this.model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [5] }));
        this.model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
        this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        this.model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        // Simulate initial "training" with synthetic historical data
        await this.trainHeuristic();
        
        this.isReady = true;
        console.log('🧠 Betterment AI: Neural Network initialized and optimized.');
    }

    /**
     * Predicts risk probability for a set of environmental factors.
     */
    async predictRisk(features) {
        if (!this.isReady) await this.init();

        return tf.tidy(() => {
            const inputTensor = tf.tensor2d([features], [1, 5]);
            const prediction = this.model.predict(inputTensor);
            return prediction.dataSync()[0];
        });
    }

    /**
     * Synthetic Training (Heuristic Alignment)
     * Aligns the Neural Network with known domain knowledge about gig hazards.
     */
    async trainHeuristic() {
        const xs = tf.tensor2d([
            [25, 0, 10, 50, 0.99], // Clear day - Low Risk
            [35, 2, 20, 150, 0.95], // Moderate heat/rain - Med Risk
            [40, 15, 45, 350, 0.40], // Extreme conditions - High Risk
            [30, 8, 30, 250, 0.85], // Heavy rain - High Risk
            [20, 0, 5, 40, 0.98],   // Perfect conditions - Low Risk
            [45, 0, 10, 100, 0.90]  // Heatwave - High Risk
        ]);

        const ys = tf.tensor2d([
            [0.1], [0.4], [0.95], [0.8], [0.05], [0.85]
        ]);

        await this.model.fit(xs, ys, {
            epochs: 50,
            verbose: 0
        });
    }

    /**
     * High-level analyst function for workers
     */
    async generateInsight(weather, aqi, platformStatus = 0.95) {
        // Normalize features
        const features = [
            weather.temp / 50,           // Temp normalized (0-50)
            weather.precipitation / 30,  // Rain normalized (0-30)
            (weather.windSpeed || 10) / 100, // Wind normalized (0-100)
            aqi / 500,                  // AQI normalized (0-500)
            platformStatus              // Platform reliability (0-1)
        ];

        const riskProb = await this.predictRisk(features);
        
        let insight = "";
        let recommendation = "";
        
        if (riskProb > 0.75) {
            insight = "Critical Risk detected for the 6 PM window.";
            recommendation = "Our AI suggests taking a rest or upgrading to 'Pro Shield' to cover imminent hazardous rain.";
        } else if (riskProb > 0.4) {
            insight = "Moderate volatility expected in current zone.";
            recommendation = "Consider a 1-day top-up if planning late-night shifts.";
        } else {
            insight = "Optimal conditions for maximum earnings.";
            recommendation = "No additional coverage required. Safe for all vehicle types.";
        }

        return {
            prob: riskProb.toFixed(2),
            insight,
            recommendation,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new BettermentModel();
