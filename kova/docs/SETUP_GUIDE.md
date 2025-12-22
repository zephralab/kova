# Kova Setup Guide

## For Designers

### 1. Sign Up
- Go to kova.app
- Sign up with email
- Verify email

### 2. Add Payment Details
- Go to Settings
- Add bank account details
- Save

### 3. Create Your First Project
- Click "New Project"
- Enter client name, amount
- Choose milestone template or custom
- Save

### 4. Request Payment
- Go to project
- Click "Request Payment"
- Copy invoice
- Send to client via WhatsApp

### 5. Record Payment
- When client pays, click "Mark as Paid"
- Enter amount and date
- Payment recorded!

### 6. Share with Client
- Click "Share with Client"
- Copy link
- Send to client
- Client can track progress anytime

---

## For Developers

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ENCRYPTION_KEY=...
ENCRYPTION_IV=...
NEXT_PUBLIC_APP_URL=https://kova.app
```

### Installation
```bash
npm install
npm run dev
```
