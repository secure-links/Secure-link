#!/bin/bash
# Brain Link Tracker Production Startup Script

echo "🚀 Starting Brain Link Tracker..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
fi

# Apply database migrations
echo "🔧 Applying database migrations..."
cd src && python3 production_fixes.py

# Start the application with Gunicorn
echo "🚀 Starting application server..."
cd ..
gunicorn -c gunicorn.conf.py src.main:app
