# API Tests

Organized test requests for all Kova API endpoints.

## Structure

```
tests/api/
├── README.md                    # This file
├── projects/                    # Projects API tests
│   ├── requests.http           # REST Client format
│   ├── create-template.sh      # Create with template
│   ├── create-custom.sh        # Create with custom milestones
│   └── list.sh                 # List all projects
├── milestones/                  # Milestones API tests (future)
├── expenses/                    # Expenses API tests (future)
├── templates/                   # Templates API tests (future)
└── shared/                      # Shared utilities
    └── get-session-cookie.md   # Instructions for getting cookies
```

## Quick Start

### Option 1: VS Code REST Client (Recommended)

1. Install [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
2. Navigate to the endpoint folder (e.g., `projects/`)
3. Open `requests.http`
4. Update variables at the top
5. Click "Send Request" above any request

### Option 2: Bash Scripts

1. Navigate to the endpoint folder
2. Make scripts executable: `chmod +x *.sh`
3. Edit script to replace placeholders
4. Run: `./create-template.sh`

## Available Test Suites

### ✅ Projects API
- Create project with template
- Create project with custom milestones
- List all projects
- Error validation tests

### 🔜 Coming Soon
- Milestones API (create payment links, update status)
- Expenses API (add/list/update expenses)
- Templates API (list/create custom templates)

## Getting Started

See `shared/get-session-cookie.md` for instructions on obtaining authentication cookies.

Each endpoint folder contains:
- `requests.http` - VS Code REST Client format with all test cases
- `*.sh` - Individual bash scripts for command-line testing
