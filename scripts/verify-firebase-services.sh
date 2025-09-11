#!/bin/bash

# Firebase Services Verification Script
# Checks the status of all Firebase services

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔍 Firebase Services Status Check${NC}"
echo "================================"
echo ""

PROJECT_ID="master-photocopy"

# Test 1: Check Firestore
echo -e "${BLUE}📄 Testing Firestore Database...${NC}"
if curl -s -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null)" \
   "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Firestore: Available${NC}"
else
    echo -e "${YELLOW}⚠️  Firestore: Checking alternative method...${NC}"
    firebase firestore:databases:list --project=$PROJECT_ID > /dev/null 2>&1 && \
    echo -e "${GREEN}✅ Firestore: Available via Firebase CLI${NC}" || \
    echo -e "${RED}❌ Firestore: Not accessible${NC}"
fi

# Test 2: Check Authentication
echo -e "${BLUE}🔐 Testing Authentication...${NC}"
if firebase auth:export /dev/null --project=$PROJECT_ID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Authentication: Service available${NC}"
else
    echo -e "${YELLOW}⚠️  Authentication: May need configuration${NC}"
fi

# Test 3: Check Realtime Database
echo -e "${BLUE}🗄️ Testing Realtime Database...${NC}"
if curl -s "https://$PROJECT_ID-default-rtdb.firebaseio.com/.json?shallow=true" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Realtime Database: Available${NC}"
else
    echo -e "${YELLOW}⚠️  Realtime Database: May need initialization${NC}"
fi

# Test 4: Check Cloud Functions
echo -e "${BLUE}⚡ Testing Cloud Functions...${NC}"
if curl -s "https://us-central1-$PROJECT_ID.cloudfunctions.net/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Cloud Functions: API available${NC}"
else
    echo -e "${YELLOW}⚠️  Cloud Functions: API may not be deployed${NC}"
fi

# Test 5: Check App Hosting
echo -e "${BLUE}🚀 Testing App Hosting...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://master-photocopy--master-photocopy.us-central1.hosted.app" | grep -q "200"; then
    echo -e "${GREEN}✅ App Hosting: Live and running${NC}"
else
    echo -e "${RED}❌ App Hosting: Not responding${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}📋 Setup Summary:${NC}"
echo "  🏠 Main App: https://master-photocopy--master-photocopy.us-central1.hosted.app"
echo "  🔧 Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "  ⚙️ App Config: https://master-photocopy--master-photocopy.us-central1.hosted.app/config"
echo "  👨‍💼 Admin Panel: https://master-photocopy--master-photocopy.us-central1.hosted.app/admin"
echo ""

echo -e "${BLUE}🔗 Manual Setup Required:${NC}"
echo "  1. Visit: https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"
echo "  2. Enable Email/Password authentication"
echo "  3. Enable Google authentication (optional)"
echo "  4. Configure any additional providers needed"
echo ""

echo -e "${GREEN}🎉 Firebase services setup verification complete!${NC}"
