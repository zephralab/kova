# Week 5: Client Shareable Links - AI Agent Instructions
**Status:** Week 1-4 ✅ | Week 5 (Client Transparency) 🚀 Starting

---

## Overview
Build shareable links that allow clients to track project progress and payments without logging in. Clients see milestones, payment status, and expense summaries (category totals only).

### What We're Building This Week:
1. **Public Project Route** - No authentication required
2. **Client-Facing UI** - Professional project view
3. **Payment Status Display** - Show milestone payment progress
4. **Expense Category Summary** - Category totals only (no line-by-line)
5. **Share Link Management** - Designer can revoke/regenerate
6. **Real-time Updates** - Client sees updated status (page refresh or polling)

---

## Context

### Why No Client Authentication?
```
Initial approach considered: Full client login system
├─ Would require: Email verification, password reset, etc.
├─ Would take: 2-3 weeks extra
├─ Complexity: High

Chosen approach: Shareable links
├─ No login needed
├─ UUID provides security
├─ Instant access
├─ Simple to manage
└─ Solves transparency problem

Decision: Shareable links for MVP. Add client login in V2 if needed.
```

### Previous Weeks:
- Week 1: Authentication (designer login) ✅
- Week 2: Projects & milestones ✅
- Week 3: Manual payment tracking ✅
- Week 4: Expenses & dashboard ✅

### This Week:
- Designer generates unique link
- Sends to client via WhatsApp/Email
- Client opens link (no login)
- Client sees project progress
- Client sees payment status
- Client sees expense summary (category totals)
- Real-time updates

---

## Task 1: Create Public Project Route

**Location:** `/app/project/[uuid]/page.tsx` (NEW - no auth)

### Public Route (No Authentication):

```typescript
// This route DOES NOT require login
// It's publicly accessible
// Anyone with the UUID can view

export default async function PublicProjectPage({
  params: { uuid }
}: {
  params: { uuid: string }
}) {
  // 1. Get project by share_uuid (not by auth.uid())
  const project = await supabase
    .from('projects')
    .select(`
      id,
      project_name,
      client_name,
      total_amount,
      share_enabled,
      created_at,
      milestones(*),
      expenses(*)
    `)
    .eq('share_uuid', uuid)
    .eq('share_enabled', true)
    .single()

  if (!project) {
    return <div>Project not found</div>
  }

  // 2. Calculate financials
  const amountReceived = project.milestones.reduce((sum, m) => sum + m.amount_paid, 0)
  const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0)
  const balance = amountReceived - totalExpenses

  return (
    <PublicProjectView
      project={project}
      amountReceived={amountReceived}
      totalExpenses={totalExpenses}
      balance={balance}
    />
  )
}
```

### Security Considerations:

```
✅ UUID is cryptographically random (128-bit)
✅ share_enabled must be true (designer can revoke)
✅ Only returns public data (no sensitive info)
✅ Rate limiting: 100 requests/hour per IP

❌ NO authentication required (intentional)
❌ NO client login system
❌ NO personal information beyond project name
```

---

## Task 2: Public Project View Component

**Location:** `/app/components/PublicProjectView.tsx`

### Page Layout:

```
Public Project View
═════════════════════════════════════════════

Project: 3BHK Interior Design
Client Budget: ₹100,000
Last Updated: 11 Dec 2025

📊 PAYMENT STATUS
═════════════════════════════════════════════
✓ Advance: ₹40,000 (Paid)
⚠️ Design Approval: ₹16,000 / ₹20,000 (Partially Paid - 80%)
  └─ Remaining: ₹4,000
⏳ Execution Start: ₹0 / ₹20,000 (Pending)
⏳ Final Delivery: ₹0 / ₹20,000 (Pending)

Total Received: ₹56,000 / ₹100,000 (56%)

💰 PROJECT EXPENSES (By Category)
═════════════════════════════════════════════
Materials: ₹45,000
Labor: ₹8,000
Transport: ₹2,000
Other: ₹1,000

Total Spent: ₹56,000

💵 REMAINING BUDGET
═════════════════════════════════════════════
Received: ₹56,000
Spent: ₹56,000
Balance: ₹0 (even - no buffer)

⚠️ No remaining budget. Next milestone payment will use new funds.

═════════════════════════════════════════════
```

### Implementation:

```typescript
'use client'

import { useState, useEffect } from 'react'

export function PublicProjectView({
  project,
  amountReceived,
  totalExpenses,
  balance
}: {
  project: any
  amountReceived: number
  totalExpenses: number
  balance: number
}) {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      window.location.reload()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Calculate category totals
  const categoryTotals = project.expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = 0
    acc[exp.category] += exp.amount
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{project.project_name}</h1>
          <p className="text-gray-600 mb-4">Client: {project.client_name}</p>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600">Total Budget</p>
              <p className="text-xl font-bold text-blue-600">
                ₹{project.total_amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Amount Received</p>
              <p className="text-xl font-bold text-green-600">
                ₹{amountReceived.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">💳 Payment Status</h2>
          
          <div className="space-y-4">
            {project.milestones.map((milestone, idx) => (
              <div key={milestone.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{idx + 1}. {milestone.title}</p>
                    <p className="text-sm text-gray-600">
                      Expected: ₹{milestone.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    milestone.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : milestone.status === 'partially_paid'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {milestone.status === 'paid' ? '✓ Paid' :
                     milestone.status === 'partially_paid' ? 
                       `⚠️ Partially Paid ₹${milestone.amount_paid.toLocaleString('en-IN')} / ₹${milestone.amount.toLocaleString('en-IN')}` :
                     '⏳ Pending'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.round((milestone.amount_paid / milestone.amount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div
                      className="bg-green-600 h-2 rounded"
                      style={{
                        width: `${Math.min(100, (milestone.amount_paid / milestone.amount) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {milestone.status !== 'paid' && milestone.amount_paid < milestone.amount && (
                  <p className="text-sm text-orange-600 mt-2">
                    Remaining: ₹{(milestone.amount - milestone.amount_paid).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Overall Progress */}
          <div className="bg-blue-50 p-4 rounded mt-6">
            <p className="text-sm text-gray-600 mb-2">Overall Payment Status</p>
            <p className="text-2xl font-bold text-blue-600 mb-2">
              ₹{amountReceived.toLocaleString('en-IN')} / ₹{project.total_amount.toLocaleString('en-IN')}
            </p>
            <div className="w-full bg-gray-200 rounded h-3">
              <div
                className="bg-blue-600 h-3 rounded"
                style={{
                  width: `${Math.min(100, (amountReceived / project.total_amount) * 100)}%`
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {Math.round((amountReceived / project.total_amount) * 100)}% Complete
            </p>
          </div>
        </div>

        {/* Expenses Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Project Expenses</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div
                key={category}
                className="bg-gray-50 p-3 rounded"
              >
                <p className="text-xs text-gray-600 mb-1">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </p>
                <p className="text-lg font-bold">
                  ₹{(total as number).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-600">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">💵 Budget Status</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-xs text-gray-600">Received</p>
              <p className="text-lg font-bold text-green-600">
                ₹{amountReceived.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <p className="text-xs text-gray-600">Spent</p>
              <p className="text-lg font-bold text-orange-600">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </p>
            </div>
            <div className={`text-center p-3 rounded ${
              balance > 0
                ? 'bg-green-50'
                : balance < 0
                ? 'bg-red-50'
                : 'bg-yellow-50'
            }`}>
              <p className="text-xs text-gray-600">Balance</p>
              <p className={`text-lg font-bold ${
                balance > 0
                  ? 'text-green-600'
                  : balance < 0
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}>
                ₹{balance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {balance > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded mt-3">
              <p className="text-sm text-green-800">
                ✓ Project has ₹{balance.toLocaleString('en-IN')} buffer remaining
              </p>
            </div>
          )}
          {balance < 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded mt-3">
              <p className="text-sm text-red-800">
                ⚠️ Project is over budget by ₹{Math.abs(balance).toLocaleString('en-IN')}
              </p>
            </div>
          )}
          {balance === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-3">
              <p className="text-sm text-yellow-800">
                ⚠️ No remaining budget. All funds are allocated.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>This link will auto-refresh every 30 seconds</p>
          <p className="mt-2">
            Questions? Contact your designer directly
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 3: Share Link Generation & Management

**Location:** `/app/components/ShareProjectModal.tsx`

### Component:

```
ShareProjectModal
├─ Display current share URL
│  └─ Format: https://kova.app/project/[uuid]
│
├─ Actions:
│  ├─ Copy Link button
│  ├─ Regenerate Link button (creates new UUID, invalidates old)
│  └─ Disable Sharing toggle
│
├─ Info:
│  ├─ "Share this link with your client"
│  ├─ "They can track payments and expenses"
│  └─ "No login required"
│
└─ Security:
   ├─ "You can regenerate to invalidate old link"
   └─ "Disable sharing anytime"
```

### Implementation:

```typescript
'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/toast'

export function ShareProjectModal({
  projectId,
  currentShareUuid,
  shareEnabled
}: {
  projectId: string
  currentShareUuid: string
  shareEnabled: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uuid, setUuid] = useState(currentShareUuid)
  const [enabled, setEnabled] = useState(shareEnabled)

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/project/${uuid}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!')
  }

  const handleRegenerateLink = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/regenerate-share`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to regenerate')

      const data = await response.json()
      setUuid(data.newUuid)
      toast.success('New share link generated! Old link is now invalid.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSharing = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/toggle-share`, {
        method: 'PUT',
        body: JSON.stringify({ shareEnabled: !enabled })
      })

      if (!response.ok) throw new Error('Failed to update sharing')

      setEnabled(!enabled)
      toast.success(
        !enabled ? 'Sharing enabled' : 'Sharing disabled'
      )
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Share with Client
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md">
        <h2 className="text-xl font-bold mb-4">Share Project</h2>

        <p className="text-sm text-gray-600 mb-4">
          Share this link with your client to track project progress and payments
        </p>

        {enabled ? (
          <>
            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-xs text-gray-600 mb-2">Share Link:</p>
              <p className="font-mono text-sm break-all text-blue-600 mb-3">
                {shareUrl}
              </p>
              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Copy Link
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Client can view this link anytime without logging in. They'll see:
              <br/>
              ✓ Milestone payment status
              <br/>
              ✓ Expense category totals
              <br/>
              ✓ Project budget and balance
            </p>
          </>
        ) : (
          <div className="bg-gray-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-600">
              Sharing is currently disabled. Enable it to generate a share link.
            </p>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <button
            onClick={handleRegenerateLink}
            disabled={!enabled || isLoading}
            className="w-full px-3 py-2 border rounded text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Regenerate Link
          </button>
          <button
            onClick={handleToggleSharing}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            {enabled ? 'Disable Sharing' : 'Enable Sharing'}
          </button>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  )
}
```

---

## Task 4: API Endpoints

### PUT /api/projects/[projectId]/regenerate-share

```typescript
// Generates new UUID, invalidates old
// Returns: { newUuid: string }
```

### PUT /api/projects/[projectId]/toggle-share

```typescript
// Enable/disable sharing
Request: { shareEnabled: boolean }
// Returns: { shareEnabled: boolean }
```

---

## Task 5: Add Share Button to Project Detail Page

Update project detail page:
```typescript
<ShareProjectModal
  projectId={projectId}
  currentShareUuid={project.share_uuid}
  shareEnabled={project.share_enabled}
/>
```

---

## Deliverables Checklist

### Backend APIs
- [ ] GET /project/[uuid] (public route, no auth)
- [ ] PUT /api/projects/[id]/regenerate-share
- [ ] PUT /api/projects/[id]/toggle-share

### Frontend Components
- [ ] PublicProjectView (public page)
- [ ] ShareProjectModal (project detail)

### Pages
- [ ] /app/project/[uuid]/page.tsx (public, no auth)
- [ ] Update project detail page

### Testing
- [ ] Test public link (no login required)
- [ ] Test payment progress display
- [ ] Test expense category totals
- [ ] Test copy link functionality
- [ ] Test regenerate link
- [ ] Test disable sharing
- [ ] Verify RLS: Old UUID doesn't work after regenerate
- [ ] Verify auto-refresh works

---

## Security Notes

### UUID as Security:
```
✅ 128-bit cryptographically random
✅ Extremely hard to guess
✅ Not predictable
✅ Each project has unique UUID
✅ Regenerate invalidates old
```

### What NOT to Show Public:
```
❌ Designer's bank details
❌ Designer's personal info
❌ Line-by-line expenses (only categories)
❌ Client's personal info beyond name
❌ Transaction references
```

### Rate Limiting:
```
Implement: 100 requests/hour per IP
Purpose: Prevent brute force UUID guessing
Method: Use middleware or Vercel edge functions
```

---

## Success Criteria

- ✅ Public link works without login
- ✅ Client sees milestone payment status
- ✅ Client sees payment progress bars
- ✅ Client sees expense category totals (not line-by-line)
- ✅ Client sees remaining budget and alerts
- ✅ Designer can regenerate link
- ✅ Designer can disable sharing
- ✅ Auto-refresh updates client view
- ✅ URL is copyable and shareable

---

## Estimated Timeline
- **Public route + component:** 2 hours
- **Share modal + APIs:** 1.5 hours
- **Testing & polish:** 1 hour
- **Total: ~4.5 hours** (0.5 day)

---

**The simplest week yet - just read-only public view. Go build! 🚀**
