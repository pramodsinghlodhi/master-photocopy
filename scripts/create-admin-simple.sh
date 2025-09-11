#!/bin/bash

# Simple Admin User Setup via Cloud Function
# This script calls the deployed createAdminUser Cloud Function

echo "🔐 Master Photocopy - Admin User Setup (Cloud Function)"
echo "======================================================"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl is not available. Please install curl first."
    exit 1
fi

# Prompt for admin details
read -p "📧 Enter admin email address: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    echo "❌ Email address is required"
    exit 1
fi

read -s -p "🔑 Enter admin password (min 6 characters): " ADMIN_PASSWORD
echo ""
if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
    echo "❌ Password must be at least 6 characters long"
    exit 1
fi

read -p "👤 Enter admin full name: " ADMIN_NAME
if [ -z "$ADMIN_NAME" ]; then
    ADMIN_NAME="Administrator"
fi

echo ""
echo "📝 Creating admin user via Cloud Function..."
echo "   Email: $ADMIN_EMAIL"
echo "   Name: $ADMIN_NAME"
echo "   Role: Admin"
echo ""

# Call the Cloud Function
RESPONSE=$(curl -s -X POST \
  'https://us-central1-master-photocopy.cloudfunctions.net/createAdminUser' \
  -H 'Content-Type: application/json' \
  -d "{
    \"data\": {
      \"email\": \"$ADMIN_EMAIL\",
      \"password\": \"$ADMIN_PASSWORD\",
      \"name\": \"$ADMIN_NAME\",
      \"secretKey\": \"master-photocopy-admin-setup-2024\"
    }
  }")

# Check if the response contains success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Admin user created successfully!"
    echo ""
    echo "📋 Admin Details:"
    echo "$RESPONSE" | grep -o '"email":"[^"]*"' | sed 's/"email":"//;s/"//'
    echo "$RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"//;s/"//'
    echo ""
    echo "🔗 You can now access admin pages:"
    echo "   • Login: https://master-photocopy--master-photocopy.us-central1.hosted.app/login"
    echo "   • Configuration: https://master-photocopy--master-photocopy.us-central1.hosted.app/config"
    echo "   • Installation: https://master-photocopy--master-photocopy.us-central1.hosted.app/install"
    echo "   • Admin Dashboard: https://master-photocopy--master-photocopy.us-central1.hosted.app/admin"
    echo ""
    echo "🔐 Both /config and /install pages are now protected and require admin authentication."
else
    echo "❌ Failed to create admin user"
    echo "Response: $RESPONSE"
    exit 1
fi
