#!/bin/bash

# Seed quotes script
# This script calls the admin API endpoint to seed default quote sets
# Usage: ./scripts/seed-quotes.sh

echo "🌱 Seeding default quote sets..."
echo ""

# You can call this via curl or just visit the URL in your browser after logging in
echo "To seed the database:"
echo "1. Start your dev server: npm run dev"
echo "2. Login to your app"
echo "3. Visit: http://localhost:3000/api/admin/seed-quotes"
echo ""
echo "Or run this curl command after getting your session cookie:"
echo "curl -X POST http://localhost:3000/api/admin/seed-quotes -H 'Cookie: <your-session-cookie>'"
echo ""
echo "For production, visit your production URL after logging in:"
echo "https://your-domain.com/api/admin/seed-quotes"
