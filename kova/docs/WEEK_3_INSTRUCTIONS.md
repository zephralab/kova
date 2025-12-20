# Week 3: Razorpay Payment Integration - AI Agent Instructions
**Status:** Week 1 (Auth) ✅ | Week 2 (Projects & Milestones) ✅ | Week 3 (Payments) 🚀 Starting

---

## Overview
Integrate Razorpay Payment Links API to enable designers to collect payments from clients. This is the core monetization feature of Kova.

### What We're Building This Week:
1. **Razorpay Keys Management** - Store encrypted Razorpay API keys
2. **Payment Link Generation** - Create Razorpay Payment Link per milestone
3. **Webhook Handler** - Receive payment success notifications from Razorpay
4. **Partial Payment Tracking** - Track multiple payments per milestone
5. **Milestone Auto-Complete** - Mark milestone paid when total amount reached
6. **Request Payment UI** - Button to generate and copy payment link
7. **Payment History View** - Show all payments against a milestone

---

## Architecture Overview

### Payment Flow:
```
Designer clicks "Request Payment" on Milestone
    ↓
Kova creates Razorpay Payment Link (POST to Razorpay API)
    ↓
Razorpay returns shareable URL (e.g., razorpay.com/i/abc123xyz)
    ↓
Designer copies link, shares via WhatsApp
    ↓
Client clicks link, pays amount (UPI/Card/NetBanking)
    ↓
Razorpay processes payment, sends webhook to Kova
    ↓
Kova receives webhook, updates milestone_payments & milestones table
    ↓
Milestone status updates: Pending → Partially Paid → Paid (when total reached)
    ↓
Designer sees updated status on dashboard (real-time via page refresh or polling)
```

### Database Tables Used:
- `projects` - To verify ownership and get total_amount
- `milestones` - To track payment status and amount_paid
- `milestone_payments` - To track individual payments (NEW in Week 3)
- `users` - To get Razorpay API keys

---

## Prerequisites

### Razorpay Setup (Designer's Account):
- Designer must have Razorpay account with KYC completed
- Designer gets their own API keys (Key ID, Key Secret)
- Keys stored in `users.razorpay_key_id` and `users.razorpay_key_secret` (encrypted)

### Environment Variables:
```
# .env.local
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay_dashboard

# Note: Individual designer keys are stored in Supabase, not in env vars
# They're encrypted at rest using Supabase Vault or app-level encryption
```

### Dependencies:
```json
{
  "razorpay": "^2.9.2"
}
```

Install: `npm install razorpay`

---

## Task 1: Razorpay Keys Management Endpoint
**Location:** `/app/api/razorpay/keys/route.ts`

### GET /api/razorpay/keys (Get if keys are configured)
```typescript
Response:
{
  "isConfigured": boolean,
  "keyId": string (last 10 chars visible, rest masked)
}

Example:
{
  "isConfigured": true,
  "keyId": "****_abc123"
}
```

### POST /api/razorpay/keys (Store user's Razorpay keys)
```typescript
Request Body:
{
  "keyId": string (required),
  "keySecret": string (required)
}

Response:
{
  "success": boolean,
  "message": "Keys saved successfully"
}

Error Cases:
- 400: Missing keyId or keySecret
- 400: Invalid key format (should start with "rzp_")
- 401: User not authenticated
- 500: Database error
```

### Implementation:
- Get authenticated user from auth.uid()
- Encrypt keySecret before storing (use @supabase/crypto or app-level encryption)
- Store in `users` table: `razorpay_key_id` and `razorpay_key_secret`
- When returning keyId in GET, mask all but last 10 chars for security
- Add validation: keyId should start with "rzp_" or "rzp_live_"

### Encryption Strategy:
```typescript
// Use app-level encryption (simple approach for MVP)
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32-char hex string
const ENCRYPTION_IV = process.env.ENCRYPTION_IV   // 16-char hex string

function encryptSecret(secret: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ENCRYPTION_IV, 'hex')
  )
  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decryptSecret(encrypted: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ENCRYPTION_IV, 'hex')
  )
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

### Onboarding Settings Page:
- Add settings page at `/app/settings/page.tsx`
- Show form: "Connect Your Razorpay Account"
- Input: Razorpay Key ID, Key Secret
- Button: "Save Keys"
- Show: "Keys saved ✓" if already configured
- Validation: Keys must be valid format (start with rzp_)

---

## Task 2: Create Payment Link Endpoint
**Location:** `/app/api/payments/create-link/route.ts`

### POST /api/payments/create-link (Create Razorpay Payment Link)
```typescript
Request Body:
{
  "milestoneId": string (required),
  "amount": number (required, in rupees)
}

Response:
{
  "id": string (milestone_payments record id),
  "razorpayLinkId": string,
  "paymentLink": string (shareable URL),
  "amount": number,
  "status": "pending",
  "createdAt": timestamp
}

Example:
{
  "id": "abc123",
  "razorpayLinkId": "plink_abc123xyz",
  "paymentLink": "https://razorpay.com/i/abc123xyz",
  "amount": 160000,
  "status": "pending",
  "createdAt": "2025-12-11T10:30:00Z"
}

Error Cases:
- 400: Missing milestoneId or amount
- 400: amount <= 0
- 400: Razorpay keys not configured for user
- 401: User not authenticated
- 403: User doesn't own this project/milestone
- 500: Razorpay API error
```

### Implementation:
```typescript
// 1. Get milestone and verify ownership
const milestone = await supabase
  .from('milestones')
  .select('*, projects(user_id)')
  .eq('id', milestoneId)
  .single()

// Verify user owns this project
if (milestone.projects.user_id !== auth.uid()) {
  throw new Error('Unauthorized')
}

// 2. Get user's Razorpay keys (decrypt)
const user = await supabase
  .from('users')
  .select('razorpay_key_id, razorpay_key_secret')
  .eq('id', auth.uid())
  .single()

if (!user.razorpay_key_id) {
  throw new Error('Razorpay keys not configured')
}

const keySecret = decryptSecret(user.razorpay_key_secret)

// 3. Initialize Razorpay with user's keys
const Razorpay = require('razorpay')
const razorpay = new Razorpay({
  key_id: user.razorpay_key_id,
  key_secret: keySecret
})

// 4. Create Payment Link
const paymentLink = await razorpay.paymentLink.create({
  amount: amount * 100, // Razorpay expects paise (amount in paise)
  currency: 'INR',
  description: `Payment for ${milestone.title} - ${milestone.projects.project_name}`,
  customer: {
    name: 'Design Client', // Could be enhanced with actual client name
    // contact: clientPhone (add later)
    // email: clientEmail (add later)
  },
  notify: {
    sms: false,
    email: false
  },
  // Webhook: Razorpay will POST to our webhook endpoint
  callback_url: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/razorpay',
  callback_method: 'get'
})

// 5. Store payment record in milestone_payments table
const { data: paymentRecord } = await supabase
  .from('milestone_payments')
  .insert({
    milestone_id: milestoneId,
    amount: amount,
    payment_link_url: paymentLink.short_url,
    razorpay_link_id: paymentLink.id, // Store link ID for webhook reference
    status: 'pending',
    created_at: new Date()
  })
  .select()
  .single()

// 6. Return response
return {
  id: paymentRecord.id,
  razorpayLinkId: paymentLink.id,
  paymentLink: paymentLink.short_url,
  amount: amount,
  status: 'pending',
  createdAt: paymentRecord.created_at
}
```

### Key Points:
- Amount must be in **rupees**, NOT paise (convert to paise for Razorpay API)
- Use individual designer's Razorpay keys (not app-wide keys)
- Store `razorpay_link_id` to reference when webhook comes
- Short URL is the shareable link (copy-to-clipboard friendly)
- Every call creates NEW payment link (allows partial payments)

---

## Task 3: Webhook Handler
**Location:** `/app/api/webhooks/razorpay/route.ts`

### POST /api/webhooks/razorpay (Receive payment success from Razorpay)

**Webhook Signature Verification:**
```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return hash === signature
}
```

**Webhook Implementation:**
```typescript
export async function POST(request: Request) {
  // 1. Verify webhook signature for security
  const body = await request.text()
  const signature = request.headers.get('X-Razorpay-Signature')
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  
  if (!verifyWebhookSignature(body, signature, webhookSecret)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(body)
  
  // 2. Check event type (we only care about payment.captured)
  if (payload.event !== 'payment_link.paid') {
    return new Response('Event ignored', { status: 200 })
  }

  const data = payload.payload.payment_link.entity
  
  // 3. Find payment in our database by razorpay_link_id
  const { data: paymentRecord, error } = await supabase
    .from('milestone_payments')
    .select('*')
    .eq('razorpay_link_id', data.id)
    .single()

  if (error || !paymentRecord) {
    // Payment link ID not found in our DB - possible fraud or error
    console.error('Payment link not found:', data.id)
    return new Response('Payment link not found', { status: 404 })
  }

  // 4. Get milestone details
  const { data: milestone } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', paymentRecord.milestone_id)
    .single()

  // 5. Update milestone_payments record as paid
  await supabase
    .from('milestone_payments')
    .update({
      status: 'paid',
      razorpay_payment_id: data.reference_id, // From webhook
      paid_at: new Date(),
      updated_at: new Date()
    })
    .eq('id', paymentRecord.id)

  // 6. Calculate new total amount_paid for milestone
  const { data: allPayments } = await supabase
    .from('milestone_payments')
    .select('amount')
    .eq('milestone_id', paymentRecord.milestone_id)
    .eq('status', 'paid')

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)

  // 7. Update milestone status
  if (totalPaid >= milestone.amount) {
    // Fully paid
    await supabase
      .from('milestones')
      .update({
        status: 'paid',
        amount_paid: milestone.amount,
        completed_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', paymentRecord.milestone_id)
  } else {
    // Partially paid
    await supabase
      .from('milestones')
      .update({
        status: 'partially_paid',
        amount_paid: totalPaid,
        updated_at: new Date()
      })
      .eq('id', paymentRecord.milestone_id)
  }

  // 8. Return success to Razorpay
  return new Response(JSON.stringify({ status: 'received' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### Key Points:
- **Signature verification is CRITICAL** for security (prevents fake webhooks)
- Only process `payment_link.paid` events
- If webhook received twice, idempotency is built in (just overwrites with same data)
- Store `razorpay_payment_id` from webhook for reconciliation
- Auto-update milestone from `partially_paid` → `paid` when total reached
- Return 200 OK even if payment already recorded (idempotent)

### Testing Webhook Locally:
- Use Razorpay dashboard to send test webhooks
- Or use curl: `curl -X POST http://localhost:3000/api/webhooks/razorpay -H "Content-Type: application/json" -H "X-Razorpay-Signature: test" -d '{"event":"payment_link.paid",...}'`

---

## Task 4: Payment Status Update Logic
**Location:** `/lib/payments/milestone-status.ts`

### Helper Functions for Milestone Status:

```typescript
// Get current payment status for a milestone
export async function getMilestonePaymentStatus(milestoneId: string) {
  const supabase = await createClient()
  
  const { data: milestone } = await supabase
    .from('milestones')
    .select('amount, amount_paid, status')
    .eq('id', milestoneId)
    .single()

  const { data: payments } = await supabase
    .from('milestone_payments')
    .select('amount, status, paid_at')
    .eq('milestone_id', milestoneId)
    .eq('status', 'paid')

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = milestone.amount - totalPaid
  const percentagePaid = Math.round((totalPaid / milestone.amount) * 100)

  return {
    totalExpected: milestone.amount,
    totalPaid: totalPaid,
    remaining: remaining,
    percentagePaid: percentagePaid,
    status: milestone.status,
    paymentHistory: payments,
    isFullyPaid: remaining <= 0
  }
}

// Check if milestone can accept more payments
export function canRequestMorePayment(milestone: any): boolean {
  return milestone.status !== 'paid'
}

// Format amount for display
export function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

// Get remaining amount needed for milestone
export function getRemainingAmount(milestone: any): number {
  return Math.max(0, milestone.amount - milestone.amount_paid)
}
```

---

## Task 5: Request Payment Button & Modal
**Location:** `/app/components/RequestPaymentModal.tsx`

### Component Behavior:

```
RequestPaymentModal Component:
├─ Triggered by: "Request Payment" button on milestone
├─ Props:
│  ├─ milestoneId: string
│  ├─ milestoneTitle: string
│  ├─ milestoneAmount: number
│  ├─ alreadyPaid: number
│  └─ onSuccess: callback function
│
├─ State:
│  ├─ isLoading: boolean
│  ├─ error: string | null
│  ├─ paymentLink: string | null
│  └─ step: 'confirm' | 'linking' | 'success'
│
├─ UI Flow:
│  1. Show confirmation: "Request ₹X payment for [Milestone]?"
│  2. Show input: "Amount to request" (default = remaining amount)
│  3. Button: "Generate Payment Link"
│  4. Loading state while calling API
│  5. Success: Show payment link URL with copy button
│  6. Button: "Copy to Clipboard"
│  7. Info: "Share this link via WhatsApp to client"
│  8. Button: "Done"
│
└─ Copy to Clipboard:
   └─ Use navigator.clipboard.writeText()
   └─ Show toast: "Link copied to clipboard! ✓"
```

### Implementation:

```typescript
'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/toast'

export function RequestPaymentModal({
  milestoneId,
  milestoneTitle,
  milestoneAmount,
  alreadyPaid,
  onSuccess
}: RequestPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState(milestoneAmount - alreadyPaid)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const remaining = milestoneAmount - alreadyPaid

  const handleGenerateLink = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          amount
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate payment link')
      }

      const data = await response.json()
      setPaymentLink(data.paymentLink)
      onSuccess?.() // Refresh milestone data
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink)
    toast.success('Payment link copied to clipboard! ✓')
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md">
        {!paymentLink ? (
          <>
            <h2 className="text-xl font-bold mb-4">Request Payment</h2>
            <p className="text-gray-600 mb-4">
              {milestoneTitle} - {milestoneAmount} (₹{alreadyPaid} already paid)
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Amount to Request:
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                max={remaining}
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Remaining: ₹{remaining}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
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
                onClick={handleGenerateLink}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">✓ Payment Link Ready</h2>
            <div className="bg-blue-50 p-4 rounded mb-4 break-all">
              <p className="text-xs text-gray-600 mb-2">Share this link:</p>
              <p className="text-sm font-mono">{paymentLink}</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Copy the link above and send it to your client via WhatsApp or email. They can pay using UPI, cards, or net banking.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Copy Link
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

## Task 6: Payment History View
**Location:** `/app/components/PaymentHistory.tsx`

### Component:

```
PaymentHistory Component:
├─ Props:
│  └─ milestoneId: string
│
├─ Fetches:
│  └─ All milestone_payments WHERE milestone_id = milestoneId
│
└─ Display:
   └─ Table/List:
      ├─ Date Paid
      ├─ Amount (₹X)
      ├─ Status (✓ Paid / ⏳ Pending)
      ├─ Payment Method (Razorpay, if stored)
      └─ Receipt/ID (Razorpay reference)
   
   └─ Summary:
      ├─ Total Expected: ₹X
      ├─ Total Received: ₹Y (bold, green)
      ├─ Remaining: ₹(X-Y)
      └─ Progress Bar (Y/X)
```

### Implementation:

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
        .order('created_at', { ascending: false })

      setPayments(data || [])
      setLoading(false)
    }

    fetchPayments()
  }, [milestoneId])

  if (loading) return <div>Loading...</div>
  if (!payments.length) return <div>No payments yet</div>

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-bold mb-4">Payment History</h3>
      
      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Total Received:</span>
          <span className="font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Payments List */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Date</th>
            <th className="text-right py-2">Amount</th>
            <th className="text-center py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id} className="border-b hover:bg-gray-50">
              <td className="py-3">
                {payment.paid_at 
                  ? new Date(payment.paid_at).toLocaleDateString('en-IN')
                  : '-'
                }
              </td>
              <td className="text-right">
                ₹{payment.amount.toLocaleString('en-IN')}
              </td>
              <td className="text-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  payment.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payment.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Task 7: Update Milestone Detail Page
**Location:** `/app/projects/[projectId]/page.tsx` (modify existing)

### Add to Milestone Display:

```
For each milestone, add:

├─ Payment Status Badge:
│  ├─ If Paid: ✓ Paid (green)
│  ├─ If Partially Paid: ⚠ Partially Paid ₹X / ₹Y (yellow)
│  └─ If Pending: ⏳ Pending (gray)
│
├─ Payment Progress:
│  ├─ Visual progress bar
│  ├─ Text: "₹X of ₹Y paid (Z%)"
│  └─ Remaining: "₹A remaining"
│
├─ Action Button (conditional):
│  ├─ If Pending/Partially Paid: RequestPaymentModal button
│  ├─ If Fully Paid: Badge "✓ Fully Paid" (no button)
│  └─ Show: Can generate multiple links until fully paid
│
└─ Payment History:
   └─ List of all payments for this milestone
      (trigger on click of "View Payments" link)
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
      <span>₹{milestone.amount_paid.toLocaleString()} / ₹{milestone.amount.toLocaleString()}</span>
      <span>{Math.round((milestone.amount_paid / milestone.amount) * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded h-2">
      <div
        className="bg-blue-600 h-2 rounded"
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

  {/* Actions */}
  <div className="flex gap-2">
    {milestone.status !== 'paid' && (
      <RequestPaymentModal
        milestoneId={milestone.id}
        milestoneTitle={milestone.title}
        milestoneAmount={milestone.amount}
        alreadyPaid={milestone.amount_paid}
        onSuccess={() => refetchProject()} // Refresh page data
      />
    )}
    {milestone.status !== 'pending' && (
      <button
        onClick={() => setExpandedPayments(milestone.id)}
        className="px-3 py-2 text-sm border rounded hover:bg-gray-100"
      >
        View Payments
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

## Task 8: Environment Variables Setup
**File:** `.env.local`

```env
# Razorpay Webhook Secret (from Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Encryption keys (generate random 32-char hex for KEY, 16-char hex for IV)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
ENCRYPTION_IV=0123456789abcdef

# App URL (for webhook callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: https://kova.app
```

### Generate Secure Keys:
```bash
# Generate ENCRYPTION_KEY (32 chars hex)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate ENCRYPTION_IV (16 chars hex)
node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
```

---

## Testing Checklist

### Unit Tests:
- [ ] Webhook signature verification works
- [ ] Payment link creation with Razorpay API
- [ ] Amount conversion (rupees to paise)
- [ ] Milestone status updates (pending → partially_paid → paid)
- [ ] Encryption/decryption of API keys

### Integration Tests:
- [ ] User can add Razorpay keys
- [ ] User can generate payment link
- [ ] Payment link is accessible and shareable
- [ ] Webhook handler correctly processes payment
- [ ] Milestone updates after successful payment
- [ ] Partial payments tracked correctly
- [ ] RLS prevents unauthorized access

### Manual Testing (Sandbox Mode):
1. **Setup:**
   - Use Razorpay sandbox credentials
   - Set `RAZORPAY_WEBHOOK_SECRET` from dashboard

2. **Test Flow:**
   - Sign up as designer
   - Go to Settings, add Razorpay keys
   - Create project with milestone (₹100,000)
   - Click "Request Payment"
   - Generate link for ₹50,000
   - Copy link to clipboard
   - Open link in new tab (should show Razorpay payment form)
   - Use test payment (UPI: 9999999999, any card: 4111111111111111)
   - Payment should succeed
   - Check webhook received (in Razorpay dashboard logs)
   - Refresh project page - milestone should show "Partially Paid ₹50,000/₹100,000"
   - Generate another link for remaining ₹50,000
   - Pay remaining amount
   - Milestone should now show "✓ Paid"

3. **Edge Cases:**
   - Test invalid Razorpay keys
   - Test with keys not configured
   - Test multiple payment links at once
   - Test webhook replay (same payment twice)
   - Test amount validation (≤ 0, exceeds milestone)

---

## Deliverables Checklist

### Backend APIs
- [ ] POST /api/razorpay/keys (store encrypted keys)
- [ ] GET /api/razorpay/keys (get key status)
- [ ] POST /api/payments/create-link (generate payment link)
- [ ] POST /api/webhooks/razorpay (handle payment success)

### Frontend Components
- [ ] RequestPaymentModal (generate link, show, copy)
- [ ] PaymentHistory (show all payments for milestone)
- [ ] Update ProjectDetail page (add payment UI)

### Helper Functions
- [ ] getMilestonePaymentStatus()
- [ ] verifyWebhookSignature()
- [ ] Encryption/decryption functions

### Pages
- [ ] /app/settings/page.tsx (Razorpay key setup)

### Environment Variables
- [ ] .env.local with all secrets

---

## Dependencies
```json
{
  "razorpay": "^2.9.2"
}
```

Install: `npm install razorpay`

---

## Database Validation (Pre-requisite)
- ✅ `milestone_payments` table exists
- ✅ RLS policies allow user to see own payments
- ✅ Indexes on milestone_id, status for performance

Verify with:
```sql
SELECT * FROM milestone_payments LIMIT 1;
SELECT * FROM milestones LIMIT 1;
```

---

## Security Considerations

### API Keys:
- ✅ Encrypt at rest in database
- ✅ Never log or return in API responses (except masked)
- ✅ Each designer uses their own keys (not shared)

### Webhooks:
- ✅ Verify HMAC signature before processing
- ✅ Idempotent (safe to replay)
- ✅ Never trust webhook data - verify with Razorpay API if needed

### Data Validation:
- ✅ Check user ownership before allowing payment links
- ✅ Validate amounts (> 0, not exceeding milestone)
- ✅ Validate key format before saving

### Rate Limiting:
- Recommendation: Add rate limiting to /api/payments/create-link
- Prevent abuse: Max 10 payment links per milestone per hour
- (Can add in Week 5 or 6 if needed)

---

## Troubleshooting

### Webhook Not Received:
1. Check RAZORPAY_WEBHOOK_SECRET is correct
2. Verify callback_url in payment link matches webhook endpoint
3. Check Razorpay dashboard for webhook logs
4. Ensure app is publicly accessible (localhost won't work)

### Payment Link Not Working:
1. Verify Razorpay keys are correct
2. Check amount is > 0 and in correct currency
3. Ensure sandbox mode if testing (set in Razorpay account)

### Signature Verification Failed:
1. Verify webhook secret matches exactly
2. Ensure you're using the raw request body (not parsed JSON)
3. Check HMAC algorithm is sha256

---

## Estimated Timeline
- **API Routes:** 3 hours
- **Components:** 2 hours
- **Testing (Sandbox):** 2 hours
- **Debugging/Polish:** 1.5 hours
- **Total: ~8.5 hours** (1 day of focused development)

---

## Success Criteria for Week 3
- ✅ Designer can add Razorpay keys
- ✅ Designer can generate payment link for any milestone
- ✅ Payment link is shareable and works
- ✅ Client can pay via UPI/Card/NetBanking
- ✅ Webhook received and processed correctly
- ✅ Milestone status updates: pending → partially_paid → paid
- ✅ Multiple payments per milestone tracked
- ✅ Only authenticated user can see their payments (RLS)
- ✅ No critical bugs with real Razorpay sandbox payments

---

## Next: Week 4 Instructions
Once Week 3 is complete, you'll move to Expenses & Dashboard:
- Add expense form
- Category enforcement (Materials, Labor, Transport, Other)
- Expense list view
- Dashboard summary with expense totals by category
- Balance calculation (received - spent)

---

**Ready to integrate Razorpay? Copy this entire document to your AI agent and start building! 🚀**
