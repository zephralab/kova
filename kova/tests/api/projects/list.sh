#!/bin/bash

# List All Projects
# Replace <your-session-cookie> with actual value

curl http://localhost:3000/api/projects \
  -H "Cookie: sb-access-token=<your-session-cookie>" | jq '.'
