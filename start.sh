#!/bin/bash

# Trinetra Project Orchestrator
echo "🛡️ Starting Trinetra Ecosystem..."

# 1. Run ML Pipeline (Optional)
if [ "$1" == "--train" ]; then
    echo "🧠 Running ML Pipeline..."
    (cd ml && python3 main.py)
fi

# 2. Start Backend
echo "🚀 Launching Express Backend..."
cd "$(dirname "$0")/backend" && npm start
