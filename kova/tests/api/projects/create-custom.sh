#!/bin/bash

# Create Project with Custom Milestones
# Replace <your-session-cookie> with actual value

curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<your-session-cookie>" \
  -d '{
    "clientName": "Ms. Patel",
    "clientContact": "patel@example.com",
    "projectName": "Office Interior Renovation",
    "totalAmount": 500000,
    "milestones": [
      {
        "title": "Advance Payment",
        "description": "50% upfront payment",
        "percentage": 50,
        "orderIndex": 1
      },
      {
        "title": "Final Payment",
        "description": "Upon project completion",
        "percentage": 50,
        "orderIndex": 2
      }
    ]
  }' | jq '.'
