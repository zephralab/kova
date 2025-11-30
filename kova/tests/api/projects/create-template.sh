#!/bin/bash

# Create Project with Template
# Replace <your-session-cookie> and <template-uuid> with actual values

curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<your-session-cookie>" \
  -d '{
    "clientName": "Mr. Sharma",
    "clientContact": "+91 98765 43210",
    "projectName": "3BHK Interior Design",
    "totalAmount": 800000,
    "templateId": "<template-uuid>"
  }' | jq '.'
