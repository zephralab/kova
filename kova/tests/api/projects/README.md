# Projects API Tests

Test requests for the `/api/projects` endpoint.

## Files

- **`requests.http`** - VS Code REST Client format with all test cases
- **`create-template.sh`** - Create project using a template
- **`create-custom.sh`** - Create project with custom milestones
- **`list.sh`** - List all projects

## Setup

### For REST Client (requests.http)

1. Open `requests.http` in VS Code
2. Update variables at the top:
   ```
   @sessionCookie = <your-session-cookie>
   @templateId = <template-uuid>
   ```
3. Click "Send Request" above any request

### For Bash Scripts

1. Make executable: `chmod +x *.sh`
2. Edit each script to replace:
   - `<your-session-cookie>`
   - `<template-uuid>` (for create-template.sh)
3. Run: `./create-template.sh`

## Test Coverage

✅ **Success Cases:**
- Create project with template
- Create project with 2-stage custom milestones
- Create project with 4-stage custom milestones
- List all projects

✅ **Error Cases:**
- Missing required fields
- Invalid totalAmount (zero or negative)
- Milestones don't sum to 100%
- Both templateId and milestones provided
- Neither templateId nor milestones provided

## Getting Test Data

**Session Cookie:** See `../shared/get-session-cookie.md`

**Template ID:**
```sql
SELECT id, name FROM milestone_templates WHERE is_default = true;
```

## Expected Responses

See `docs/api.md` for detailed response formats.
