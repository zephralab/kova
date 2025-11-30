# Projects API Documentation

## Overview
The Projects API provides endpoints for creating and managing interior design projects with milestone-based payment tracking.

## Authentication
All endpoints require authentication via Supabase session cookies. The user must be authenticated and have an associated firm in the database.

## Base URL
```
/api/projects
```

---

## Endpoints

### POST /api/projects
Create a new project with milestones.

#### Request Body
```typescript
{
  "clientName": string (required),
  "clientContact": string (optional),
  "projectName": string (required),
  "totalAmount": number (required, > 0),
  "templateId": string (optional - UUID),
  "milestones": array (optional - custom milestones)
}
```

**Note**: Either `templateId` OR `milestones` must be provided, but not both.

#### Custom Milestones Format
```typescript
{
  "milestones": [
    {
      "title": string (required),
      "description": string (optional),
      "percentage": number (required, 0-100),
      "orderIndex": number (required, >= 1)
    }
  ]
}
```

**Validation**: Custom milestone percentages must sum to 100%.

#### Response (201 Created)
```json
{
  "id": "uuid",
  "projectName": "3BHK Interior Design",
  "clientName": "Mr. Sharma",
  "clientContact": "+91 98765 43210",
  "totalAmount": 800000,
  "shareUuid": "uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  "milestones": [
    {
      "id": "uuid",
      "title": "Advance Payment",
      "description": "Initial advance before starting",
      "amount": 320000,
      "percentage": 40,
      "orderIndex": 1,
      "status": "pending",
      "amountPaid": 0,
      "dueDate": null
    }
  ]
}
```

#### Error Responses

**400 Bad Request** - Validation errors
```json
{
  "error": "Validation failed",
  "details": "Total amount must be greater than 0"
}
```

**401 Unauthorized** - Not authenticated
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden** - User has no firm association
```json
{
  "error": "Access denied"
}
```

**404 Not Found** - Template not found
```json
{
  "error": "Template not found"
}
```

**500 Internal Server Error** - Database or server error
```json
{
  "error": "Database operation failed"
}
```

---

### GET /api/projects
List all projects for the authenticated user's firm.

#### Query Parameters
None

#### Response (200 OK)
```json
[
  {
    "id": "uuid",
    "projectName": "3BHK Interior Design",
    "clientName": "Mr. Sharma",
    "totalAmount": 800000,
    "amountReceived": 320000,
    "amountSpent": 150000,
    "balance": 170000,
    "milestonePaid": 1,
    "milestonePending": 3,
    "shareUuid": "uuid",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Response Fields
- `amountReceived`: Total amount paid by client across all milestones
- `amountSpent`: Total expenses recorded for the project
- `balance`: `amountReceived - amountSpent`
- `milestonePaid`: Count of fully paid milestones
- `milestonePending`: Count of pending or partially paid milestones

#### Error Responses

**401 Unauthorized** - Not authenticated
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden** - User has no firm association
```json
{
  "error": "Access denied"
}
```

**500 Internal Server Error** - Database error
```json
{
  "error": "Database operation failed"
}
```

---

## Usage Examples

### Create Project with Template
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "clientName": "Mr. Sharma",
    "clientContact": "+91 98765 43210",
    "projectName": "3BHK Interior Design",
    "totalAmount": 800000,
    "templateId": "template-uuid-here"
  }'
```

### Create Project with Custom Milestones
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "clientName": "Mr. Sharma",
    "projectName": "Office Interior",
    "totalAmount": 500000,
    "milestones": [
      {
        "title": "Advance",
        "percentage": 50,
        "orderIndex": 1
      },
      {
        "title": "Final Payment",
        "percentage": 50,
        "orderIndex": 2
      }
    ]
  }'
```

### List All Projects
```bash
curl http://localhost:3000/api/projects \
  -H "Cookie: sb-access-token=..."
```

---

## Business Rules

1. **Firm Association**: Projects belong to firms, not individual users. All firm members can access firm projects.

2. **Milestone Creation**: Projects must have milestones created either from:
   - A template (system or firm-specific)
   - Custom milestone array (percentages must sum to 100%)

3. **Share Links**: Each project gets a unique `share_uuid` for public sharing (enabled by default).

4. **Project Status**: New projects are created with `status: 'active'`.

5. **Milestone Status**: New milestones are created with `status: 'pending'` and `amount_paid: 0`.

---

## Database Schema Reference

See [schema.md](./schema.md) for complete database structure including:
- Firms and users relationship
- Projects table structure
- Milestones and milestone_payments
- Row Level Security (RLS) policies
- Available views and functions
