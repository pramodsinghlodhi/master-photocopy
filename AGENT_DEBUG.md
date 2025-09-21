# Agent Management Debug Script

This script helps identify and fix agent-related issues.

## Quick Check: List Existing Agents

```bash
# Test which agents exist in your database
curl -s http://localhost:9002/api/agents | jq '.data[] | {id: .id, name: (.first_name + " " + .last_name), status: .is_active}'
```

## Common Issues & Solutions

### 1. "No document to update: agents/agent3" Error

This error occurs when:
- Some code is trying to update an agent with ID "agent3" that doesn't exist
- An automatic assignment system is referencing a non-existent agent
- Test data or sample data contains references to missing agents

### 2. How to Fix

#### Option A: Create the missing agent
```bash
curl -X POST http://localhost:9002/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Agent 3",
    "email": "agent3@example.com",
    "phone_number": "+91-9876543213",
    "is_active": true
  }'
```

#### Option B: Clean up references to "agent3"
Search your code for any hardcoded references to "agent3" and remove them.

### 3. Check Current Agents
To see what agents currently exist in your database:
```bash
# Get all agents
curl -s http://localhost:9002/api/agents | jq '.'

# Get only active agents
curl -s http://localhost:9002/api/agents?active=true | jq '.'
```

### 4. Create Sample Agents (if needed)
```bash
# Create agent1
curl -X POST http://localhost:9002/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Rahul",
    "last_name": "Kumar",
    "email": "rahul@example.com",
    "phone_number": "+91-9876543210",
    "is_active": true
  }'

# Create agent2
curl -X POST http://localhost:9002/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Priya",
    "last_name": "Sharma",
    "email": "priya@example.com",
    "phone_number": "+91-9876543211",
    "is_active": true
  }'
```

## What I Fixed

1. **Updated agent API routes** to use Firebase Admin SDK
2. **Added proper error handling** for non-existent documents
3. **Improved error messages** to identify which agent ID is missing
4. **Added existence checks** before updating agents

The error should now return a proper 404 response instead of crashing, and will tell you exactly which agent ID is missing.