# Week 3: Manual Payment System - AI Agent Instructions
**Status:** Week 1 (Auth) ✅ | Week 2 (Projects & Milestones) ✅ | Week 3 (Manual Payments) 🚀 Starting

---

## Overview
Implement manual payment tracking system. Designers will receive payment requests as professional invoices that they share with clients. No third-party payment processing (Razorpay) in MVP.

### What We're Building This Week:
1. **Designer Payment Settings** - Bank account and payment details form
2. **Invoice Generation** - Professional payment request templates
3. **Payment Request UI** - Button to generate and share invoices
4. **Manual Payment Recording** - Mark milestone as paid when received
5. **Payment History** - Track all payments per milestone
6. **Payment Status Display** - Show payment progress on dashboard

---

## Why Manual Payments?

### Business Decision:
```
Analysis revealed:
✅ UPI payments: 2% fee (not free as assumed)
✅ Manual bank transfer: 0% fee (designer keeps 100%)
✅ Interior designer clients trust direct bank transfer
✅ Simpler to build (no payment processing complexity)
✅ Faster MVP launch
✅ Validate market demand before adding online payments

Outcome:
├─ Better for designers (no transaction fees)
├─ Better for Kova (simpler code, fewer bugs)
├─ Better for validation (can add online payments later if needed)
└─ Solves core problem: prevents payment chasing
```

### Architecture:
```
Designer creates milestone: "Advance Payment ₹40,000"
    ↓
Designer clicks "Request Payment"
    ↓
Kova generates professional invoice template
    ↓
Designer copies and sends via WhatsApp/Email
    ↓
Client reads invoice (project name, amount, due date)
    ↓
Client transfers ₹40,000 to designer's bank account
    ↓
Designer marks milestone as "Paid" in Kova
    ↓
Milestone unlocks next phase
    ↓
(Future: Can add Razorpay/online payments as optional)
```

---

## Task 1: Designer Payment Settings

**Location:** `/app/settings/payment-methods/page.tsx`

### Settings Form:

```
Designer Settings → Payment Methods
├─ Section: "Bank Account Details"
│  ├─ Account Holder Name (required)
│  ├─ Bank Name (required)
│  ├─ Account Number (required)
│  ├─ IFSC Code (required)
│  ├─ Account Type: Savings / Current (dropdown)
│  └─ Save button
│
├─ Section: "UPI (Optional)"
│  ├─ UPI ID (optional, e.g., designer@okhdfcbank)
│  └─ Save button
│
└─ Display: "Payment Details Saved ✓"
   (Once saved, show: "Your clients will use these details to pay you")
```

### API Endpoint: PUT /api/designer/payment-methods

```typescript
Request Body:
{
  "bankAccountHolderName": string (required),
  "bankName": string (required),
  "accountNumber": string (required),
  "ifscCode": string (required),
  "accountType": "savings" | "current" (required),
  "upiId": string (optional)
}

Response:
{
  "success": boolean,
  "message": "Payment details saved",
  "paymentMethods": {
    "bankAccountHolderName": string,
    "bankName": string,
    "accountNumberMasked": "****1234", // Only last 4 digits visible
    "ifscCode": string,
    "accountType": string,
    "upiId": string,
    "updatedAt": timestamp
  }
}

Error Cases:
- 400: Missing required fields
- 400: Invalid IFSC code format
- 401: User not authenticated
- 500: Database error
```

### Database Update:
```
Add to users table:
├─ bank_account_holder_name (TEXT)
├─ bank_name (TEXT)
├─ account_number (ENCRYPTED TEXT) ← Store encrypted
├─ ifsc_code (TEXT)
├─ account_type (VARCHAR: 'savings' | 'current')
├─ upi_id (TEXT, nullable)
└─ payment_methods_updated_at (TIMESTAMP)
```

### Validation:
```
✅ IFSC Code: 11 alphanumeric characters
✅ Account Number: 9-18 digits
✅ Account Holder Name: Non-empty string
✅ UPI ID: Format username@bankname (if provided)

Security:
├─ Encrypt account_number at rest
├─ Never return full account number (only last 4 digits)
├─ Only designer can see their own details
├─ RLS policy: Users can only access their own data
```

### UI/UX:
```
On first visit:
├─ Show: "You haven't added payment details yet"
├─ Show: "This is required to request payments from clients"
├─ Form: Empty fields, focused on account details

After saving:
├─ Show: "✓ Payment details saved successfully"
├─ Show: Account holder name + Bank name (summary)
├─ Show: "****1234" for account number (masked)
├─ Button: "Edit Payment Details"

Validation feedback:
├─ Real-time: IFSC code validation (must be 11 chars)
├─ Real-time: Account number validation (must be 9-18 digits)
├─ On submit: All fields required (show error if missing)
```

---

## Task 2: Generate Payment Request Invoice

**Location:** `/app/api/milestones/[milestoneId]/generate-invoice/route.ts`

### POST /api/milestones/[milestoneId]/generate-invoice

```typescript
Request Body:
{
  "milestoneId": string (required)
}

Response:
{
  "invoiceId": string,
  "projectName": string,
  "milestoneName": string,
  "amount": number,
  "currency": "INR",
  "amountFormatted": "₹40,000",
  "dueDate": string (YYYY-MM-DD),
  "clientName": string,
  "designerName": string,
  "bankDetails": {
    "accountHolderName": string,
    "bankName": string,
    "accountNumberMasked": "****1234",
    "ifscCode": string,
    "accountType": string,
    "upiId": string (optional)
  },
  "invoiceText": string (formatted text for copy-paste),
  "generatedAt": timestamp
}

Error Cases:
- 400: Invalid milestoneId
- 404: Milestone not found
- 403: User doesn't own this milestone
- 400: Designer hasn't set payment details
- 401: User not authenticated
- 500: Database error
```

### Invoice Template (invoiceText):

```
PAYMENT REQUEST
═════════════════════════════════════════════

Project: 3BHK Interior Design
Milestone: Advance Payment
Amount Due: ₹40,000

PROJECT DETAILS:
Client: Mr. Sharma
Designer: [Designer Name]
Due Date: 15 Dec 2025

PAYMENT INSTRUCTIONS:
Please transfer ₹40,000 to the following bank account:

Account Holder: Priya Sharma
Bank: HDFC Bank
Account Number: ****1234
IFSC Code: HDFC0001234
Account Type: Savings

Or via UPI: priya@okhdfcbank

Once you transfer, please confirm via WhatsApp/message.

Thank you for your business!

═════════════════════════════════════════════
Generated on: 11 Dec 2025
Reference: MIL-abc123xyz
```

### Implementation:

```typescript
// 1. Get milestone with project and designer details
const milestone = await supabase
  .from('milestones')
  .select(`
    id,
    title,
    amount,
    due_date,
    projects(
      id,
      project_name,
      client_name,
      user_id,
      users(
        id,
        full_name,
        bank_account_holder_name,
        bank_name,
        account_number,
        ifsc_code,
        account_type,
        upi_id
      )
    )
  `)
  .eq('id', milestoneId)
  .single()

// 2. Verify user ownership
if (milestone.projects.user_id !== auth.uid()) {
  throw new Error('Unauthorized')
}

// 3. Check payment details are set
if (!milestone.projects.users.bank_account_holder_name) {
  throw new Error('Please set your bank account details in Settings')
}

// 4. Format invoice text
const invoiceText = `
PAYMENT REQUEST
═════════════════════════════════════════════

Project: ${milestone.projects.project_name}
Milestone: ${milestone.title}
Amount Due: ₹${milestone.amount.toLocaleString('en-IN')}

PROJECT DETAILS:
Client: ${milestone.projects.client_name}
Designer: ${milestone.projects.users.full_name}
Due Date: ${new Date(milestone.due_date).toLocaleDateString('en-IN')}

PAYMENT INSTRUCTIONS:
Please transfer ₹${milestone.amount.toLocaleString('en-IN')} to:

Account Holder: ${milestone.projects.users.bank_account_holder_name}
Bank: ${milestone.projects.users.bank_name}
Account Number: ****${milestone.projects.users.account_number.slice(-4)}
IFSC Code: ${milestone.projects.users.ifsc_code}
Account Type: ${milestone.projects.users.account_type}

${milestone.projects.users.upi_id ? `Or via UPI: ${milestone.projects.users.upi_id}` : ''}

Once transferred, please confirm via WhatsApp/message.

Thank you!

═════════════════════════════════════════════
Generated on: ${new Date().toLocaleDateString('en-IN')}
Reference: MIL-${milestone.id.slice(0, 8).toUpperCase()}
`

// 5. Return response with invoice text and copy-to-clipboard
return {
  invoiceId: generateId(),
  projectName: milestone.projects.project_name,
  milestoneName: milestone.title,
  amount: milestone.amount,
  amountFormatted: `₹${milestone.amount.toLocaleString('en-IN')}`,
  dueDate: milestone.due_date,
  clientName: milestone.projects.client_name,
  designerName: milestone.projects.users.full_name,
  bankDetails: {
    accountHolderName: milestone.projects.users.bank_account_holder_name,
    bankName: milestone.projects.users.bank_name,
    accountNumberMasked: `****${milestone.projects.users.account_number.slice(-4)}`,
    ifscCode: milestone.projects.users.ifsc_code,
    accountType: milestone.projects.users.account_type,
    upiId: milestone.projects.users.upi_id
  },
  invoiceText: invoiceText,
  generatedAt: new Date()
}
```

---

## Task 3: Request Payment Button & Modal

**Location:** `/app/components/RequestPaymentModal.tsx`

### Component Behavior:

```
RequestPaymentModal Component:
├─ Triggered by: "Request Payment" button on milestone
├─ Props:
│  ├─ milestoneId: string
│  ├─ milestoneName: string
│  ├─ amount: number
│  ├─ projectName: string
│  └─ clientName: string
│
├─ State:
│  ├─ isLoading: boolean
│  ├─ error: string | null
│  ├─ invoiceText: string | null
│  └─ copied: boolean
│
└─ UI Flow:
   1. Show confirmation: "Request ₹40,000 from Mr. Sharma?"
   2. Show invoice preview
   3. Button: "Generate Invoice"
   4. Loading state while calling API
   5. Success: Show formatted invoice text
   6. Button: "Copy to Clipboard"
   7. Info: "Paste this in WhatsApp and send to client"
   8. Button: "Done"
```

### Implementation:

```typescript
'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/toast'

export function RequestPaymentModal({
  milestoneId,
  milestoneName,
  amount,
  projectName,
  clientName,
  onSuccess
}: RequestPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [invoiceText, setInvoiceText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateInvoice = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/milestones/${milestoneId}/generate-invoice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestoneId })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate invoice')
      }

      const data = await response.json()
      setInvoiceText(data.invoiceText)
      onSuccess?.()
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoiceText)
    toast.success('Invoice copied to clipboard! ✓')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Request Payment
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl max-h-96 overflow-y-auto">
        {!invoiceText ? (
          <>
            <h2 className="text-xl font-bold mb-4">Request Payment</h2>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You're about to request payment for:
              </p>
              <p className="font-semibold">{projectName}</p>
              <p className="text-sm text-gray-600">{milestoneName}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                ₹{amount.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                From: {clientName}
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              We'll generate a professional payment request that you can copy and send 
              to your client via WhatsApp or email.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">✓ Invoice Ready</h2>
            
            <div className="bg-gray-50 p-4 rounded mb-4 font-mono text-xs whitespace-pre-wrap break-words">
              {invoiceText}
            </div>

            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-sm text-blue-800">
                <strong>How to use:</strong> Copy the invoice above and paste it in 
                WhatsApp or send via email to your client.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={handleCopyInvoice}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Copy Invoice
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## Task 4: Mark Payment as Received

**Location:** `/app/api/milestones/[milestoneId]/mark-paid/route.ts`

### POST /api/milestones/[milestoneId]/mark-paid

```typescript
Request Body:
{
  "amount": number (required),
  "paymentDate": string (YYYY-MM-DD, required),
  "reference": string (optional - transaction ID, confirmation number)
}

Response:
{
  "success": boolean,
  "milestone": {
    "id": string,
    "title": string,
    "amount": number,
    "amount_paid": number,
    "status": "pending" | "partially_paid" | "paid",
    "completedAt": timestamp (if fully paid)
  }
}

Error Cases:
- 400: Missing required fields
- 400: Amount > milestone amount
- 400: Invalid payment date
- 404: Milestone not found
- 403: User doesn't own this milestone
- 401: User not authenticated
- 500: Database error
```

### Implementation:

```typescript
// 1. Get milestone
const milestone = await supabase
  .from('milestones')
  .select('id, amount, amount_paid, status, project_id')
  .eq('id', milestoneId)
  .single()

// 2. Verify ownership
const project = await supabase
  .from('projects')
  .select('user_id')
  .eq('id', milestone.project_id)
  .single()

if (project.user_id !== auth.uid()) {
  throw new Error('Unauthorized')
}

// 3. Validate amount
const newTotalPaid = milestone.amount_paid + amount
if (newTotalPaid > milestone.amount) {
  throw new Error('Payment amount exceeds milestone amount')
}

// 4. Create payment record
const { data: paymentRecord } = await supabase
  .from('milestone_payments')
  .insert({
    milestone_id: milestoneId,
    amount: amount,
    status: 'paid',
    paid_at: paymentDate,
    reference: reference || null,
    created_at: new Date()
  })
  .select()
  .single()

// 5. Update milestone status
let newStatus = 'pending'
if (newTotalPaid >= milestone.amount) {
  newStatus = 'paid'
}else if (newTotalPaid > 0) {
  newStatus = 'partially_paid'
}

const { data: updatedMilestone } = await supabase
  .from('milestones')
  .update({
    amount_paid: newTotalPaid,
    status: newStatus,
    completed_at: newStatus === 'paid' ? new Date() : null,
    updated_at: new Date()
  })
  .eq('id', milestoneId)
  .select()
  .single()

// 6. Return response
return {
  success: true,
  milestone: updatedMilestone,
  message: newStatus === 'paid' ? 'Milestone fully paid!' : 'Payment recorded'
}
```

---

## Task 5: Manual Payment Recording UI

**Location:** `/app/components/MarkPaymentModal.tsx`

### Component:

```
MarkPaymentModal (appears on milestone detail)
├─ Props:
│  ├─ milestoneId: string
│  ├─ amountRemaining: number
│  └─ onSuccess: callback
│
├─ Form:
│  ├─ Input: "Amount Received" (default = remaining amount)
│  ├─ Input: "Payment Date" (default = today)
│  ├─ Input: "Reference/Transaction ID" (optional)
│  │  └─ Placeholder: "e.g., UTR 123456789"
│  └─ Buttons: Cancel, Mark as Paid
│
└─ After Submit:
   ├─ Show: "✓ Payment recorded"
   ├─ Show updated milestone status
   └─ Close modal
```

### Implementation:

```typescript
'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/toast'

export function MarkPaymentModal({
  milestoneId,
  amountRemaining,
  milestoneName,
  onSuccess
}: MarkPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState(amountRemaining)
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleMarkPaid = async () => {
    setIsLoading(true)
    setError(null)

    if (amount <= 0) {
      setError('Amount must be greater than 0')
      setIsLoading(false)
      return
    }

    if (amount > amountRemaining) {
      setError(`Amount cannot exceed ₹${amountRemaining.toLocaleString('en-IN')}`)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(
        `/api/milestones/${milestoneId}/mark-paid`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            paymentDate,
            reference: reference || null
          })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record payment')
      }

      toast.success('✓ Payment recorded successfully!')
      onSuccess?.()
      setIsOpen(false)
      setAmount(amountRemaining)
      setReference('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Mark as Paid
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md">
        <h2 className="text-xl font-bold mb-4">Record Payment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Mark payment received for: <strong>{milestoneName}</strong>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Amount Received (₹):
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Remaining: ₹{amountRemaining.toLocaleString('en-IN')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Date:
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Reference (Optional):
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., UTR 123456789 or Check #"
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
            onClick={handleMarkPaid}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Recording...' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 6: Update Milestone Detail Page

**Location:** `/app/projects/[projectId]/page.tsx` (modify existing)

### Changes to Milestone Display:

```
For each milestone, update action buttons:

├─ If Pending/Partially Paid:
│  ├─ Button: "Request Payment" (shows RequestPaymentModal)
│  ├─ Button: "Mark as Paid" (shows MarkPaymentModal)
│  └─ Show: Payment progress bar
│
├─ If Fully Paid:
│  └─ Badge: "✓ Fully Paid"
│
└─ Always show:
   ├─ Progress bar with ₹X / ₹Y paid
   ├─ Percentage paid
   └─ Payment history (expandable)
```

### Code Addition:

```typescript
// In milestone render section
<div className="border rounded p-4 mb-4">
  <div className="flex justify-between items-start mb-3">
    <div>
      <h3 className="font-bold">{milestone.title}</h3>
      <p className="text-sm text-gray-600">{milestone.description}</p>
    </div>
    <span className={`px-3 py-1 rounded text-sm font-medium ${
      milestone.status === 'paid'
        ? 'bg-green-100 text-green-800'
        : milestone.status === 'partially_paid'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-gray-100 text-gray-800'
    }`}>
      {milestone.status === 'paid' ? '✓ Paid' :
       milestone.status === 'partially_paid' ? `⚠ Partially Paid` :
       '⏳ Pending'}
    </span>
  </div>

  {/* Progress Bar */}
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1">
      <span>₹{milestone.amount_paid.toLocaleString('en-IN')} / ₹{milestone.amount.toLocaleString('en-IN')}</span>
      <span>{Math.round((milestone.amount_paid / milestone.amount) * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded h-2">
      <div
        className="bg-green-600 h-2 rounded"
        style={{ width: `${Math.min(100, (milestone.amount_paid / milestone.amount) * 100)}%` }}
      />
    </div>
  </div>

  {/* Amount */}
  <div className="text-sm text-gray-600 mb-3">
    Amount: ₹{milestone.amount.toLocaleString('en-IN')}
    {milestone.status !== 'paid' && (
      <span className="ml-2 text-orange-600">
        (₹{(milestone.amount - milestone.amount_paid).toLocaleString('en-IN')} remaining)
      </span>
    )}
  </div>

  {/* Due Date */}
  {milestone.due_date && (
    <div className="text-sm text-gray-600 mb-3">
      Due: {new Date(milestone.due_date).toLocaleDateString('en-IN')}
    </div>
  )}

  {/* Actions */}
  <div className="flex gap-2 flex-wrap">
    {milestone.status !== 'paid' && (
      <>
        <RequestPaymentModal
          milestoneId={milestone.id}
          milestoneName={milestone.title}
          amount={milestone.amount}
          projectName={projectName}
          clientName={clientName}
          onSuccess={() => refetchProject()}
        />
        <MarkPaymentModal
          milestoneId={milestone.id}
          amountRemaining={milestone.amount - milestone.amount_paid}
          milestoneName={milestone.title}
          onSuccess={() => refetchProject()}
        />
      </>
    )}
    {milestone.status !== 'pending' && (
      <button
        onClick={() => setExpandedPayments(milestone.id)}
        className="px-3 py-2 text-sm border rounded hover:bg-gray-100"
      >
        {expandedPayments === milestone.id ? 'Hide Payments' : 'View Payments'}
      </button>
    )}
  </div>

  {/* Payment History (expandable) */}
  {expandedPayments === milestone.id && (
    <PaymentHistory milestoneId={milestone.id} />
  )}
</div>
```

---

## Task 7: Payment History Component

**Location:** `/app/components/PaymentHistory.tsx`

### Component:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function PaymentHistory({ milestoneId }: { milestoneId: string }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    const fetchPayments = async () => {
      const { data } = await supabase
        .from('milestone_payments')
        .select('*')
        .eq('milestone_id', milestoneId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })

      setPayments(data || [])
      setLoading(false)
    }

    fetchPayments()
  }, [milestoneId])

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>
  if (!payments.length) return <div className="text-sm text-gray-500">No payments recorded</div>

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-semibold mb-3">Payment History</h4>
      
      {/* Summary */}
      <div className="bg-green-50 p-3 rounded mb-3">
        <div className="flex justify-between text-sm">
          <span>Total Received:</span>
          <span className="font-bold text-green-600">
            ₹{totalPaid.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-right py-2 px-2">Amount</th>
              <th className="text-left py-2 px-2">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-2">
                  {new Date(payment.paid_at).toLocaleDateString('en-IN')}
                </td>
                <td className="text-right py-2 px-2 font-medium">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-2 text-gray-600">
                  {payment.reference || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Task 8: Update Project Detail Page Payment Status

**Location:** `/app/projects/[projectId]/page.tsx` (modify existing)

Add payment status section to project overview:

```
Project Financial Summary:
├─ Total Budget: ₹100,000
├─ Amount Received: ₹40,000 (40%) - green badge
├─ Amount Pending: ₹60,000 (60%) - orange badge
└─ Payment Progress:
   ├─ Visual progress bar
   └─ Next milestone: "Design Approval ₹20,000 - PENDING"
```

---

## Database Schema Updates

No new tables needed, but ensure existing tables have:

```sql
-- milestones table (already exists)
├─ amount (already exists)
├─ amount_paid (already exists)
├─ status (already exists)
├─ due_date (already exists)
└─ completed_at (already exists)

-- milestone_payments table (already exists - keep for manual records)
├─ id
├─ milestone_id
├─ amount
├─ status ('paid' / 'pending')
├─ paid_at
├─ reference (nullable)
└─ created_at

-- users table (ADD NEW FIELDS)
├─ bank_account_holder_name (TEXT)
├─ bank_name (TEXT)
├─ account_number (TEXT, encrypted)
├─ ifsc_code (TEXT)
├─ account_type (VARCHAR: 'savings' | 'current')
├─ upi_id (TEXT, nullable)
└─ payment_methods_updated_at (TIMESTAMP)
```

---

## Deliverables Checklist

### Backend (API Routes)
- [ ] PUT /api/designer/payment-methods (save bank details)
- [ ] GET /api/designer/payment-methods (get designer's details)
- [ ] POST /api/milestones/[id]/generate-invoice (create invoice text)
- [ ] POST /api/milestones/[id]/mark-paid (record payment)
- [ ] GET /api/milestones/[id]/payment-history (get all payments)

### Frontend (Pages & Components)
- [ ] /app/settings/payment-methods/page.tsx (bank details form)
- [ ] RequestPaymentModal component (generate invoice)
- [ ] MarkPaymentModal component (record payment)
- [ ] PaymentHistory component (show payments)
- [ ] Update project detail page (show status)

### Type Safety
- [ ] TypeScript types for payment endpoints
- [ ] Zod schemas for form validation

### Testing
- [ ] Test saving bank details
- [ ] Test generating invoice
- [ ] Test marking payment as received
- [ ] Test partial payments (record 2 payments for 1 milestone)
- [ ] Test payment history display
- [ ] Test that only project owner can record payments (RLS)

---

## Key Implementation Notes

### Invoice Generation:
```
The invoice is PLAIN TEXT for easy copy-paste
├─ Designer copies text (button: Copy to Clipboard)
├─ Pastes in WhatsApp or email
├─ Client reads it with all payment details
├─ Client has full info to transfer money
└─ Simple, no fancy formatting needed
```

### Payment Recording:
```
Manual process (designer marks when paid):
├─ Designer receives money
├─ Designer goes to Kova milestone
├─ Clicks "Mark as Paid"
├─ Enters amount + optional reference
├─ Milestone status updates
└─ Progress bar shows updated amount
```

### Bank Details Storage:
```
Security:
✅ Account number encrypted at rest
✅ Only last 4 digits shown in UI
✅ Only designer can see their details
✅ RLS policy enforces ownership
└─ Designer can update anytime
```

---

## Migration from Week 2

No breaking changes to Week 2:
```
✅ Projects table: Unchanged
✅ Milestones table: Already has fields needed
✅ Payment recording: Uses existing milestone_payments
✅ All existing functionality: Still works
```

Week 3 just ADDS:
```
✅ New bank details form
✅ Invoice generation
✅ Manual payment marking
✅ No Razorpay integration
```

---

## Estimated Timeline
- **Bank details API + form:** 1 hour
- **Invoice generation:** 1 hour
- **Payment modals + UI:** 2 hours
- **Integration with milestone detail:** 1 hour
- **Payment history component:** 1 hour
- **Testing:** 1.5 hours
- **Total: ~7.5 hours** (1 day of development)

**Much simpler than Razorpay Week 3 (which was 8-9 hours)**

---

## Success Criteria for Week 3

- ✅ Designer can add bank account details
- ✅ Designer can generate professional invoice
- ✅ Invoice can be copied and shared
- ✅ Designer can mark milestone as paid
- ✅ Payment history displays all payments
- ✅ Partial payments work (record multiple payments per milestone)
- ✅ Progress bar updates after payment recorded
- ✅ Only designer can see/record their payments (RLS)
- ✅ No errors in payment recording

---

## Next Weeks Summary

### Week 4: Expenses & Dashboard
```
✅ Add expense form (category-based)
✅ Expense summary by category
✅ Dashboard with financial overview
✅ Balance calculation (received - spent)
```

### Week 5: Client Shareable Links
```
✅ Public project view (no login)
✅ Show milestones with payment status
✅ Show expense category totals only
✅ Show remaining balance
✅ Real-time updates
```

### Week 6: Polish & Launch
```
✅ Mobile responsiveness
✅ PWA setup
✅ Bug fixes
✅ Wife testing (2-3 real projects)
✅ Performance optimization
✅ Vercel deployment
```

---

## Future: Online Payments

Once MVP is validated:
```
Month 2+: Explore alternatives
├─ PayU (1.5% vs Razorpay 2%)
├─ Cashfree (1% vs Razorpay 2%)
├─ Instamojo (1.4%)
└─ Only add if designers request

Decision:
├─ If designers happy with manual: Keep as is
├─ If designers want online: Add cheaper alternative
└─ Keep manual as fallback option
```

---

**Ready to build Week 3? This is MUCH simpler than Razorpay! 🚀**
