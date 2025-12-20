# Week 2: Projects & Milestones - AI Agent Instructions
**Status:** Week 1 (Auth) ✅ Complete | Week 2 (Projects & Milestones) 🚀 Starting

---

## Overview
Build the core project creation and milestone management system. This is the foundation for everything else.

### What We're Building This Week:
1. **Create Project Form** - Designer enters client details and project amount
2. **Milestone Templates** - Pre-built templates (Design+Execution, Design Only) + custom option
3. **Custom Milestone Builder** - Add/edit/delete milestones with percentages
4. **Projects List View** - Dashboard showing all projects
5. **Project Detail Page** - View project and manage milestones
6. **Validation Logic** - Ensure milestones sum to 100%

---

## Database Context (Already Created)
- `projects` table: user_id, client_name, client_contact, project_name, total_amount, share_uuid, created_at, updated_at
- `milestones` table: project_id, title, description, amount, percentage, order_index, status, amount_paid, due_date, completed_at
- `milestone_templates` table: name, description, is_default, user_id
- `milestone_template_items` table: template_id, title, percentage, order_index
- Default templates already seeded in database

### RLS Policies:
- Users can only see/edit their own projects and milestones
- Public access to projects with share_enabled=TRUE for shareable links

---

## Task 1: Create Project API Endpoint
**Location:** `/app/api/projects/route.ts`

### POST /api/projects (Create new project)
```typescript
Request Body:
{
  "clientName": string (required),
  "clientContact": string (optional),
  "projectName": string (required),
  "totalAmount": number (required, > 0),
  "templateId": string (optional - if using template),
  "milestones": array (optional - if custom milestones)
}

Response:
{
  "id": string,
  "projectName": string,
  "clientName": string,
  "totalAmount": number,
  "milestones": array,
  "shareUuid": string,
  "createdAt": timestamp
}

Error Cases:
- 400: Missing required fields (clientName, projectName, totalAmount)
- 400: totalAmount <= 0
- 401: User not authenticated
- 500: Database error
```

### GET /api/projects (List all projects for user)
```typescript
Response:
[
  {
    "id": string,
    "projectName": string,
    "clientName": string,
    "totalAmount": number,
    "amountReceived": number,
    "amountSpent": number,
    "balance": number,
    "milestonePaid": number,
    "milestonePending": number,
    "shareUuid": string,
    "createdAt": timestamp
  }
]
```

### Implementation Details:
- Get authenticated user from `auth.uid()`
- Insert into `projects` table with user_id from firms table (user's firm)
- If templateId provided: fetch template and create milestones from template items
- If custom milestones provided: validate they sum to 100%, then create
- Return new project with all milestones
- Set `share_uuid` automatically (already in schema)
- Set `share_enabled = true` by default

---

## Task 2: Get Milestone Templates API
**Location:** `/app/api/templates/route.ts`

### GET /api/templates (Get all templates)
```typescript
Response:
[
  {
    "id": string,
    "name": string,
    "description": string,
    "isDefault": boolean,
    "items": [
      {
        "id": string,
        "title": string,
        "percentage": number,
        "orderIndex": number
      }
    ]
  }
]

Example Response:
[
  {
    "id": "template-1",
    "name": "Design + Execution (4 stages)",
    "description": "Standard 4-milestone structure for design and execution projects",
    "isDefault": true,
    "items": [
      { "title": "Advance Payment", "percentage": 40.00, "orderIndex": 1 },
      { "title": "Design Approval", "percentage": 20.00, "orderIndex": 2 },
      { "title": "Execution Start", "percentage": 20.00, "orderIndex": 3 },
      { "title": "Final Delivery", "percentage": 20.00, "orderIndex": 4 }
    ]
  },
  {
    "id": "template-2",
    "name": "Design Only (3 stages)",
    "description": "Simplified 3-milestone structure for design-only projects",
    "isDefault": true,
    "items": [
      { "title": "Advance Payment", "percentage": 50.00, "orderIndex": 1 },
      { "title": "Concept Approval", "percentage": 30.00, "orderIndex": 2 },
      { "title": "Final Delivery", "percentage": 20.00, "orderIndex": 3 }
    ]
  }
]
```

### Implementation:
- Query `milestone_templates` WHERE `is_default = true` OR `user_id = auth.uid()`
- For each template, fetch related `milestone_template_items`
- Order by `order_index` (templates are already seeded with default values)
- Return in format above

---

## Task 3: Create Project Form UI
**Location:** `/app/projects/create/page.tsx`

### Form Components:
```
1. Client Information Section
   - Input: Client Name (required)
   - Input: Client Contact (optional, email or phone)
   - Input: Phone Number (optional)

2. Project Details Section
   - Input: Project Name (required)
   - Input: Total Project Amount (required, number > 0)
   - Help text: "This is the total project budget"

3. Milestone Structure Section
   - Radio: "Use Template" / "Custom Milestones"
   
   If "Use Template":
     - Select: Choose template (dropdown with Design+Execution, Design Only)
     - Show preview of selected template's milestones
   
   If "Custom Milestones":
     - "Add Milestone" button
     - For each milestone: Title, Percentage, Description (optional)
     - Show running total of percentages
     - Validation: Must equal 100% (show error if not)
     - Allow reorder (drag and drop or up/down buttons)

4. Buttons
   - Cancel (go back to projects list)
   - Create Project (submit form)
```

### Form Behavior:
- All required fields marked with *
- Real-time percentage validation (show warning if not 100%)
- Show template preview when selected
- Show custom milestone builder when that option selected
- Loading state on "Create Project" button during submission
- Success: Redirect to project detail page
- Error: Show toast notification with error message

### Component Structure:
```
ProjectCreatePage
  ├─ ClientInfoSection
  ├─ ProjectDetailsSection
  ├─ MilestoneStructureSection
  │  ├─ TemplateSelector
  │  │  └─ TemplatePreview
  │  └─ CustomMilestoneBuilder
  │     └─ MilestoneItem (repeating)
  └─ FormButtons
```

---

## Task 4: Projects List View
**Location:** `/app/projects/page.tsx`

### List Display:
```
Header: "Your Projects"

For each project, show card with:
  ├─ Project Name (large, bold)
  ├─ Client Name (gray, smaller)
  ├─ Total Budget: ₹X
  ├─ Financial Status:
  │  ├─ Received: ₹Y (green)
  │  ├─ Spent: ₹Z (gray)
  │  └─ Balance: ₹(Y-Z) (blue/green if positive, red if negative)
  ├─ Progress:
  │  ├─ Milestones: X paid / Y total (e.g., 1 paid / 4 total)
  │  └─ Visual progress bar
  └─ Actions:
     ├─ "View" button → project detail page
     ├─ "Share" button → copy project share link
     └─ "⋮" menu
        ├─ Edit Project
        ├─ Archive Project
        └─ Delete Project
```

### Empty State:
```
If no projects:
  "No projects yet"
  "Create your first project to get started"
  Button: "Create Project"
```

### Sorting/Filtering:
- Default: Sort by created_at DESC (newest first)
- Future: Could add filter by status, client name, etc.

### Data to Fetch:
- Use the summary view or calculate from project_summary view
- Show: projectName, clientName, totalAmount, amountReceived, amountSpent, balance, milestones_paid, milestones_pending

---

## Task 5: Project Detail Page
**Location:** `/app/projects/[projectId]/page.tsx`

### Page Layout:
```
Header Section:
  ├─ Project Name (large)
  ├─ Client: [Client Name] | Contact: [Phone/Email]
  └─ Buttons: [Edit] [Share] [⋮ More]

Financial Summary:
  ├─ Total Budget: ₹X
  ├─ Amount Received: ₹Y (green badge)
  ├─ Amount Spent: ₹Z (gray badge)
  └─ Balance: ₹(Y-Z) (blue badge)

Milestones Section:
  For each milestone:
    ├─ Order Index (e.g., "1.")
    ├─ Milestone Title
    ├─ Expected Amount: ₹X (percentage shown as "(40%)")
    ├─ Status Badge:
    │  ├─ If Paid: ✓ Paid (green)
    │  ├─ If Partially Paid: ⚠ Partially Paid ₹X/₹Y (yellow)
    │  └─ If Pending: ⏳ Pending (gray)
    ├─ Due Date (if set)
    └─ Action:
       ├─ If Pending: "Request Payment" button (goes to Week 3)
       ├─ If Paid: "View Payments" (shows payment history)
       └─ Edit / Delete milestone

Expenses Section (from Week 4):
  └─ (Leave empty for now, will populate in Week 4)

Share Section:
  ├─ Share Link: [URL with share_uuid]
  ├─ Copy Button
  └─ "Revoke Access" link
```

### Key Behaviors:
- Click "Request Payment" → Week 3 (not implemented yet, show placeholder)
- Click milestone → Edit modal (add/change title, description, amount, due date)
- Delete milestone → Confirm dialog (warn if milestones sum check fails)
- Edit Project → Go to edit page (same form as create, but pre-filled)

---

## Task 6: Milestone Validation Logic
**Location:** `/lib/validation/milestones.ts`

### Validation Functions:
```typescript
// Check if milestones sum to 100%
validateMilestoneTotal(milestones: MilestoneInput[]): {
  isValid: boolean;
  total: number;
  error?: string;
}

// Example:
validateMilestoneTotal([
  { title: "Advance", percentage: 40 },
  { title: "Design", percentage: 20 },
  { title: "Execution", percentage: 20 },
  { title: "Final", percentage: 20 }
])
// Returns: { isValid: true, total: 100 }

// Check if individual milestone is valid
validateMilestone(milestone: MilestoneInput): {
  isValid: boolean;
  errors: string[];
}
// Checks: title not empty, percentage > 0 and <= 100, etc.

// Calculate milestone amounts from percentages
calculateMilestoneAmounts(
  totalAmount: number, 
  milestones: MilestoneWithPercentage[]
): MilestoneWithAmount[]
// Example:
// Input: totalAmount = ₹100,000, milestone with percentage 40%
// Output: milestone with amount = ₹40,000

```

### Usage:
- Call in Create Project endpoint BEFORE inserting
- Call in Project Edit endpoint BEFORE updating
- Call in front-end form for real-time validation
- Show warning if total !== 100% (don't allow submit)

---

## Task 7: Project Edit Page (Bonus - Same as Create but Pre-filled)
**Location:** `/app/projects/[projectId]/edit/page.tsx`

### Same form as create page BUT:
- Pre-fill all fields from existing project
- Title: "Edit Project" instead of "Create Project"
- Button: "Update Project" instead of "Create Project"
- Can edit: clientName, clientContact, projectName, totalAmount
- Cannot edit: created_at, share_uuid (show as read-only)
- DELETE button (with confirm dialog)
- "Go Back" link/button

---

## Deliverables Checklist

### Backend (API Routes)
- [ ] POST /api/projects (create with validation)
- [ ] GET /api/projects (list all for user)
- [ ] GET /api/projects/[projectId] (get one project with milestones)
- [ ] PUT /api/projects/[projectId] (update project)
- [ ] DELETE /api/projects/[projectId] (delete project, cascade to milestones)
- [ ] GET /api/templates (list all templates)
- [ ] POST /api/projects/[projectId]/milestones (create/update milestone)
- [ ] DELETE /api/projects/[projectId]/milestones/[milestoneId] (delete milestone)

### Frontend (Pages & Components)
- [ ] /app/projects/page.tsx (projects list)
- [ ] /app/projects/create/page.tsx (create project form)
- [ ] /app/projects/[projectId]/page.tsx (project detail)
- [ ] /app/projects/[projectId]/edit/page.tsx (edit project)
- [ ] Create reusable components (ProjectCard, MilestoneItem, TemplateSelector, etc.)

### Type Safety
- [ ] Create TypeScript types/interfaces for all API responses
- [ ] Create zod schemas for form validation

### Testing
- [ ] Test create project with template
- [ ] Test create project with custom milestones
- [ ] Test percentage validation (must equal 100%)
- [ ] Test edit project and milestones
- [ ] Test delete project
- [ ] Test that only project owner can view/edit (RLS)

---

## Dependencies on Previous Work
✅ Week 1: Authentication - User is logged in, auth.uid() available
✅ Database: Schema already in Supabase with RLS policies
❌ Week 3: Payment Links - Not needed yet (placeholder for "Request Payment")
❌ Week 4: Expenses - Not needed yet (leave empty in detail page)

---

## Tips for Implementation

### Use Supabase Client Pattern:
```typescript
// Client component
'use client'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

// Get projects
const { data, error } = await supabase
  .from('projects')
  .select('*, milestones(*)')
  .eq('user_id', userId)

// Server component
import { createClient } from '@/utils/supabase/server'

const supabase = await createClient()
const { data } = await supabase
  .from('projects')
  .select('*')
```

### Redirect After Create:
```typescript
import { redirect } from 'next/navigation'

// After creating project
redirect(`/projects/${projectId}`)
```

### Form Handling:
```typescript
// Use Server Actions for form submission
'use server'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  // ... save to database
  redirect(`/projects/${id}`)
}
```

### Real-time Percentage Calculation:
```typescript
const total = milestones.reduce((sum, m) => sum + m.percentage, 0)
const isValid = total === 100
```

---

## Estimated Time
- **API Routes:** 2 hours
- **Pages & Components:** 4 hours
- **Form Validation & UX:** 2 hours
- **Testing:** 1 hour
- **Total: ~9 hours** (1 day of focused development)

---

## Next: Week 3 Instructions
Once this is complete, you'll move to Razorpay Payment Links integration:
- Generate payment link endpoint
- Request Payment button functionality
- Webhook handler for payment success
- Update milestone status on payment
- Partial payment tracking

---

## Questions to Answer During Implementation:
1. Should we allow milestones to be reordered after creation? (Recommend: Yes, via drag-drop)
2. Should we soft-delete projects or hard-delete? (Recommend: Soft delete with deleted_at column added in V2)
3. Should we allow editing/deleting milestones if payment started? (Recommend: Block if amount_paid > 0)
4. Should milestones have due dates? (Recommend: Optional field, but show in detail page)

---

## Success Criteria for Week 2
- ✅ Create project with template
- ✅ Create project with custom milestones  
- ✅ List all projects with financial summary
- ✅ View project details with milestone breakdown
- ✅ Edit project details
- ✅ Edit/delete milestones
- ✅ Percentage validation prevents invalid milestones
- ✅ Only authenticated user can see their projects (RLS works)
- ✅ No critical bugs found during testing

---

**Ready to build? Start with Task 1 (API endpoints), then Task 2 (templates), then move to UI (Tasks 3-5). Good luck! 🚀**
