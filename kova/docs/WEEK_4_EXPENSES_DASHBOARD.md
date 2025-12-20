# Week 4: Expenses & Dashboard - AI Agent Instructions
**Status:** Week 1-3 ✅ | Week 4 (Expenses & Dashboard) 🚀 Starting

---

## Overview
Build expense tracking system and comprehensive financial dashboard. Designers can track project costs by category and see real-time financial overview.

### What We're Building This Week:
1. **Add Expense Form** - Record project expenses with category
2. **Category-Based Tracking** - Group expenses by type
3. **Expense List View** - Show all expenses per project
4. **Financial Dashboard** - Summary of received, spent, balance
5. **Category Breakdown** - Visual breakdown of spending
6. **Balance Calculation** - Real-time balance (received - spent)

---

## Context

### Previous Weeks:
- Week 1: Authentication working ✅
- Week 2: Projects & milestones created ✅
- Week 3: Manual payment system (designer marks as paid) ✅

### This Week:
- Designer tracks expenses while project is in progress
- All expenses tied to specific project
- Dashboard shows financial health at a glance
- NO CLIENT-FACING EXPENSE DETAILS YET (that's Week 5)

---

## Task 1: Add Expense API Endpoint

**Location:** `/app/api/projects/[projectId]/expenses/route.ts`

### POST /api/projects/[projectId]/expenses (Create expense)

```typescript
Request Body:
{
  "description": string (required),
  "amount": number (required, > 0),
  "category": "materials" | "labor" | "transport" | "other" (required),
  "expenseDate": string (YYYY-MM-DD, required),
  "vendorName": string (optional)
}

Response:
{
  "id": string,
  "description": string,
  "amount": number,
  "category": string,
  "expenseDate": string,
  "vendorName": string,
  "createdAt": timestamp
}

Error Cases:
- 400: Missing required fields
- 400: amount <= 0
- 400: invalid category
- 400: invalid date
- 404: Project not found
- 403: User doesn't own project
- 401: User not authenticated
- 500: Database error
```

### GET /api/projects/[projectId]/expenses (Get all expenses)

```typescript
Response:
[
  {
    "id": string,
    "description": string,
    "amount": number,
    "category": string,
    "expenseDate": string,
    "vendorName": string,
    "createdAt": timestamp
  }
]

Query params (optional):
?category=materials&sortBy=date&order=desc
```

### Implementation:

```typescript
// POST: Create expense
const { data: project } = await supabase
  .from('projects')
  .select('user_id')
  .eq('id', projectId)
  .single()

if (project.user_id !== auth.uid()) {
  throw new Error('Unauthorized')
}

// Validate input
if (amount <= 0) throw new Error('Amount must be > 0')
if (!['materials', 'labor', 'transport', 'other'].includes(category)) {
  throw new Error('Invalid category')
}

const { data, error } = await supabase
  .from('expenses')
  .insert({
    project_id: projectId,
    description,
    amount,
    category,
    expense_date: expenseDate,
    vendor_name: vendorName || null,
    created_at: new Date()
  })
  .select()
  .single()

if (error) throw error
return data

// GET: Retrieve expenses
const query = supabase
  .from('expenses')
  .select('*')
  .eq('project_id', projectId)

if (category) query = query.eq('category', category)

const { data } = await query.order('expense_date', { ascending: false })
return data
```

---

## Task 2: Add Expense Form Component

**Location:** `/app/components/AddExpenseForm.tsx`

### Form Fields:

```
Add Expense Form:
├─ Input: "Description" (required)
│  └─ Placeholder: "e.g., Tiles for living room"
├─ Input: "Amount (₹)" (required, number > 0)
├─ Select: "Category" (required)
│  ├─ Materials
│  ├─ Labor
│  ├─ Transport
│  └─ Other
├─ Input: "Date" (required, default = today)
├─ Input: "Vendor Name" (optional)
│  └─ Placeholder: "e.g., ABC Tiles Store"
└─ Buttons: Cancel, Save Expense
```

### Component:

```typescript
'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/toast'

export function AddExpenseForm({
  projectId,
  onExpenseAdded
}: {
  projectId: string
  onExpenseAdded: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('materials')
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [vendorName, setVendorName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Validation
      if (!description.trim()) throw new Error('Description is required')
      if (!amount || parseFloat(amount) <= 0) throw new Error('Amount must be > 0')
      if (!category) throw new Error('Category is required')
      if (!expenseDate) throw new Error('Date is required')

      const response = await fetch(
        `/api/projects/${projectId}/expenses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            amount: parseFloat(amount),
            category,
            expenseDate,
            vendorName: vendorName || null
          })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add expense')
      }

      toast.success('✓ Expense added')
      onExpenseAdded()
      setIsOpen(false)
      // Reset form
      setDescription('')
      setAmount('')
      setCategory('materials')
      setVendorName('')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Expense
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Expense</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Tiles for living room"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="materials">Materials</option>
                <option value="labor">Labor</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Date *
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Vendor Name (Optional)
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., ABC Tiles Store"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 3: Expense List View

**Location:** `/app/components/ExpenseList.tsx`

### Component:

```
ExpenseList:
├─ Table/List of all expenses
│  ├─ Date
│  ├─ Description
│  ├─ Category (with color badge)
│  ├─ Amount (₹)
│  ├─ Vendor (if set)
│  └─ Actions: Edit / Delete
│
├─ Category Summary:
│  ├─ Materials: ₹45,000 (8 items)
│  ├─ Labor: ₹30,000 (5 items)
│  ├─ Transport: ₹5,000 (2 items)
│  └─ Other: ₹2,000 (1 item)
│
└─ Total Expenses: ₹82,000
```

### Implementation:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const CATEGORY_COLORS = {
  materials: { bg: 'bg-blue-100', text: 'text-blue-800' },
  labor: { bg: 'bg-green-100', text: 'text-green-800' },
  transport: { bg: 'bg-orange-100', text: 'text-orange-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export function ExpenseList({ projectId }: { projectId: string }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpenses()
  }, [projectId])

  const fetchExpenses = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false })

    setExpenses(data || [])
    setLoading(false)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>
  if (!expenses.length) return <div className="text-sm text-gray-500">No expenses yet</div>

  // Calculate totals by category
  const categoryTotals = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { total: 0, count: 0 }
    }
    acc[exp.category].total += exp.amount
    acc[exp.category].count += 1
    return acc
  }, {})

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Expenses</h3>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(categoryTotals).map(([category, { total, count }]) => (
          <div
            key={category}
            className={`p-3 rounded ${CATEGORY_COLORS[category].bg}`}
          >
            <p className={`text-xs font-medium ${CATEGORY_COLORS[category].text}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </p>
            <p className={`text-sm font-bold ${CATEGORY_COLORS[category].text}`}>
              ₹{total.toLocaleString('en-IN')}
            </p>
            <p className={`text-xs ${CATEGORY_COLORS[category].text}`}>
              {count} item{count !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-left py-2 px-3">Description</th>
              <th className="text-left py-2 px-3">Category</th>
              <th className="text-right py-2 px-3">Amount</th>
              <th className="text-left py-2 px-3">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id} className="border-t hover:bg-gray-50">
                <td className="py-2 px-3">
                  {new Date(exp.expense_date).toLocaleDateString('en-IN')}
                </td>
                <td className="py-2 px-3">{exp.description}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      CATEGORY_COLORS[exp.category].bg
                    } ${CATEGORY_COLORS[exp.category].text}`}
                  >
                    {exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-medium">
                  ₹{exp.amount.toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-gray-600">
                  {exp.vendor_name || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="bg-gray-50 p-3 rounded text-right">
        <p className="text-sm text-gray-600">Total Expenses:</p>
        <p className="text-lg font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
      </div>
    </div>
  )
}
```

---

## Task 4: Dashboard with Financial Summary

**Location:** `/app/projects/[projectId]/page.tsx` (add section)

### Dashboard Section:

```
Financial Summary Card:
├─ Total Budget: ₹100,000
├─ Amount Received: ₹40,000 (green)
├─ Total Expenses: ₹15,000 (orange)
├─ Current Balance: ₹25,000 (₹40K - ₹15K)
│  └─ Show if balance > 0: ✓ Positive balance
│  └─ Show if balance < 0: ⚠️ Over budget!
│  └─ Show if balance = 0: ⚠️ No buffer
│
└─ Visual:
   ├─ Progress bar: Received / Budget (40%)
   ├─ Progress bar: Spent / Budget (15%)
   └─ Progress bar: Balance / Budget (25%)
```

### Implementation:

```typescript
// In project detail page
const calculateFinancials = (milestones, expenses) => {
  const totalBudget = milestones[0]?.projects?.total_amount || 0
  const amountReceived = milestones.reduce((sum, m) => sum + m.amount_paid, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const balance = amountReceived - totalExpenses

  return {
    totalBudget,
    amountReceived,
    totalExpenses,
    balance,
    receivedPercent: (amountReceived / totalBudget) * 100,
    spentPercent: (totalExpenses / totalBudget) * 100,
    balancePercent: (balance / totalBudget) * 100
  }
}

// UI Component
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
  <div className="bg-blue-50 p-4 rounded">
    <p className="text-xs text-gray-600">Total Budget</p>
    <p className="text-2xl font-bold text-blue-600">
      ₹{financials.totalBudget.toLocaleString('en-IN')}
    </p>
  </div>

  <div className="bg-green-50 p-4 rounded">
    <p className="text-xs text-gray-600">Amount Received</p>
    <p className="text-2xl font-bold text-green-600">
      ₹{financials.amountReceived.toLocaleString('en-IN')}
    </p>
    <p className="text-xs text-gray-600 mt-1">
      {Math.round(financials.receivedPercent)}%
    </p>
  </div>

  <div className="bg-orange-50 p-4 rounded">
    <p className="text-xs text-gray-600">Total Expenses</p>
    <p className="text-2xl font-bold text-orange-600">
      ₹{financials.totalExpenses.toLocaleString('en-IN')}
    </p>
    <p className="text-xs text-gray-600 mt-1">
      {Math.round(financials.spentPercent)}%
    </p>
  </div>

  <div className={`p-4 rounded ${
    financials.balance > 0
      ? 'bg-green-50'
      : financials.balance < 0
      ? 'bg-red-50'
      : 'bg-yellow-50'
  }`}>
    <p className="text-xs text-gray-600">Current Balance</p>
    <p className={`text-2xl font-bold ${
      financials.balance > 0
        ? 'text-green-600'
        : financials.balance < 0
        ? 'text-red-600'
        : 'text-yellow-600'
    }`}>
      ₹{financials.balance.toLocaleString('en-IN')}
    </p>
    <p className="text-xs text-gray-600 mt-1">
      {financials.balance > 0 ? '✓ Positive' : financials.balance < 0 ? '⚠️ Over budget' : '⚠️ No buffer'}
    </p>
  </div>
</div>
```

---

## Task 5: Category Breakdown Visual

**Location:** `/app/components/ExpenseCategoryBreakdown.tsx`

```
Visual representation of expenses by category:
├─ Pie chart or bar chart
├─ Shows: Materials 50%, Labor 35%, Transport 10%, Other 5%
└─ Colors: Match category color coding
```

---

## Deliverables Checklist

### Backend APIs
- [ ] POST /api/projects/[id]/expenses (create)
- [ ] GET /api/projects/[id]/expenses (list)
- [ ] PUT /api/projects/[id]/expenses/[id] (update)
- [ ] DELETE /api/projects/[id]/expenses/[id] (delete)

### Frontend Components
- [ ] AddExpenseForm component
- [ ] ExpenseList component
- [ ] ExpenseCategoryBreakdown component
- [ ] Update project detail page with financials

### Pages
- [ ] Update project detail page

### Testing
- [ ] Add expense for each category
- [ ] View expense list
- [ ] Delete expense
- [ ] Verify totals calculate correctly
- [ ] Check financial dashboard updates
- [ ] RLS: Only project owner can see expenses

---

## Success Criteria

- ✅ Designer can add expense with category
- ✅ Expenses display with category badges
- ✅ Category totals calculate correctly
- ✅ Dashboard shows received, spent, balance
- ✅ Balance updates when expense added/removed
- ✅ Calculations are accurate
- ✅ Only project owner can see expenses

---

## Estimated Timeline
- **APIs:** 1.5 hours
- **Form & List components:** 2 hours
- **Dashboard & breakdown:** 1.5 hours
- **Testing:** 1 hour
- **Total: ~6 hours** (0.75 day)

---

**This week is straightforward - just expense tracking. No payment processing. Go build! 🚀**
