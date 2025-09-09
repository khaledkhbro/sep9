#!/bin/bash

# One-click database setup script
# Make executable with: chmod +x scripts/setup-database.sh
# Run with: ./scripts/setup-database.sh

echo "🚀 Starting Microjob Marketplace Database Setup..."

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   SUPABASE_URL"
    echo "   SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Run the Node.js setup script
echo "📦 Running database setup..."
node scripts/run-master-setup.js

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo "🎯 Your microjob marketplace is ready to use!"
else
    echo "❌ Database setup failed. Please check the logs above."
    exit 1
fi
