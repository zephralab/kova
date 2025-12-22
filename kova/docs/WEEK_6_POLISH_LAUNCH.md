# Week 6: Polish & Launch - AI Agent Instructions
**Status:** Week 1-5 ✅ | Week 6 (Polish & Launch) 🚀 Final Week

---

## Overview
Final week: Bug fixes, performance optimization, mobile responsiveness, PWA setup, wife testing, and production deployment.

### What We're Doing This Week:
1. **Mobile Responsiveness** - Test on iOS/Android browsers
2. **PWA Setup** - Install to home screen, offline support
3. **Bug Fixes** - Fix issues from wife's testing
4. **Performance** - Optimize load times
5. **Testing** - Wife uses with 2-3 real projects
6. **Documentation** - Setup guide, FAQ
7. **Deployment** - Deploy to Vercel (production)
8. **Monitoring** - Set up error tracking

---

## Task 1: Mobile Responsiveness Testing

### Testing Devices:

```
✅ iPhone (Safari)
├─ iPhone 14 (iOS 18)
├─ iPhone 13 (iOS 17)
└─ Test: Login, projects, milestones, payments, dashboard

✅ Android (Chrome)
├─ Samsung Galaxy S23 (Android 14)
├─ Pixel 7 (Android 14)
└─ Test: Same flow as iOS

✅ Tablet (iPad/Android Tab)
├─ iPad Pro 12.9" (iOS 18)
└─ Test: Responsive layout, forms

✅ Desktop (Chrome, Safari, Firefox)
├─ Windows/Mac/Linux
└─ Test: Full experience
```

### Responsive Checklist:

```
□ Navbar: Hamburger menu on mobile, full nav on desktop
□ Forms: Full width on mobile, max-width on desktop
□ Tables: Scroll horizontally on mobile (or collapse to cards)
□ Modals: Full screen on mobile, centered on desktop
□ Buttons: Touch-friendly (48px minimum height)
□ Text: Readable font size (16px minimum)
□ Images: Scale appropriately
□ Padding: Consistent spacing (mobile vs desktop)
□ Inputs: Easy to tap (no small tap targets)
□ Overflow: No horizontal scroll except intentional
```

### Common Issues to Fix:

```
❌ Text too small on mobile
→ Fix: Use Tailwind responsive classes (text-sm md:text-base)

❌ Modals don't fit on mobile
→ Fix: Add max-h-screen, overflow-y-auto

❌ Tables unreadable on mobile
→ Fix: Convert to card layout on small screens

❌ Forms overflow
→ Fix: Use grid-cols-1 md:grid-cols-2

❌ Buttons too close together
→ Fix: Use space-y-2 for vertical spacing on mobile
```

### Tailwind Mobile-First Pattern:

```typescript
// CORRECT: Mobile-first
<div className="px-4 md:px-8 lg:px-12">
  {/* Small by default, larger on bigger screens */}
</div>

// WRONG: Desktop-first
<div className="px-12 sm:px-8 xs:px-4">
  {/* Hard to maintain */}
</div>
```

---

## Task 2: PWA Setup (Progressive Web App)

### What is PWA?
```
Allows users to:
✅ Install app to home screen (like native app)
✅ Work offline (basic functionality)
✅ Get notifications (future)
✅ Better performance (service worker caching)
```

### Files to Create:

**1. manifest.json**
**Location:** `/public/manifest.json`

```json
{
  "name": "Kova - Payment Management for Designers",
  "short_name": "Kova",
  "description": "Milestone-based payment collection for interior designers",
  "start_url": "/projects",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "View Projects",
      "short_name": "Projects",
      "description": "View all your projects",
      "url": "/projects",
      "icons": [
        {
          "src": "/icon-192x192.png",
          "sizes": "192x192"
        }
      ]
    }
  ]
}
```

**2. Service Worker**
**Location:** `/public/sw.js` (or use Next.js service worker)

```javascript
const CACHE_NAME = 'kova-v1'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache essential files
      return cache.addAll([
        '/',
        '/projects',
        '/offline' // Add fallback offline page
      ])
    })
  )
})

self.addEventListener('fetch', event => {
  // Network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone())
        })
        return response
      })
      .catch(() => {
        // Return cached version if offline
        return caches.match(event.request)
          .then(response => response || caches.match('/offline'))
      })
  )
})
```

**3. Update Layout**
**Location:** `/app/layout.tsx`

Add to `<head>`:
```typescript
<meta name="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2563eb" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Kova" />
<link rel="apple-touch-icon" href="/icon-192x192.png" />
```

And register service worker:
```typescript
'use client'
import { useEffect } from 'react'

export function PWAInitializer() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.log('SW registration failed:', err))
    }
  }, [])
  return null
}
```

---

## Task 3: Performance Optimization

### Image Optimization:

```typescript
// Use Next.js Image component
import Image from 'next/image'

// ❌ WRONG
<img src="/logo.png" alt="Logo" />

// ✅ RIGHT
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={60}
  priority
/>
```

### Code Splitting:

```typescript
// ✅ Lazy load heavy components
import dynamic from 'next/dynamic'

const ExpensiveComponent = dynamic(
  () => import('./ExpensiveComponent'),
  { loading: () => <div>Loading...</div> }
)
```

### Database Query Optimization:

```typescript
// ❌ N+1 query problem
const projects = await supabase.from('projects').select()
for (const p of projects) {
  const m = await supabase.from('milestones').select().eq('project_id', p.id)
}

// ✅ JOIN in single query
const projects = await supabase
  .from('projects')
  .select('*, milestones(*)')
```

### Caching:

```typescript
// Revalidate data periodically
export const revalidate = 3600 // Revalidate every hour

// Or use Next.js cache
import { cache } from 'react'

const getProject = cache(async (id) => {
  return await supabase
    .from('projects')
    .select()
    .eq('id', id)
    .single()
})
```

### Lighthouse Audit:

```bash
# Run Lighthouse in Chrome DevTools
1. Open DevTools (F12)
2. Click Lighthouse tab
3. Click "Analyze page load"
4. Check metrics:
   ├─ Performance (>90)
   ├─ Accessibility (>90)
   ├─ Best Practices (>90)
   └─ SEO (>90)
```

---

## Task 4: Bug Fix Tracker

Create a Google Sheet or Notion doc to track bugs:

```
Bug | Severity | Assignee | Status
────────────────────────────────────
Form validation not working on mobile | High | Agent | Fixed
Milestone status doesn't update | Critical | Agent | In Progress
Copy button doesn't work on Safari | Medium | Agent | Testing
Dashboard calculation off by ₹1 | Low | Agent | Backlog
```

### Common Bugs to Check:

```
□ Form submission: Does it work on all browsers?
□ Copy to clipboard: Works on desktop, mobile, Safari?
□ Real-time updates: Does page need refresh?
□ Navigation: Can you go back/forward without errors?
□ Calculations: Are numbers accurate?
□ RLS: Can user see other designer's projects?
□ Error messages: Clear and helpful?
□ Loading states: Do buttons show "loading"?
□ Modals: Can you close by clicking outside?
□ Responsive: No overflow on small screens?
```

---

## Task 5: Wife Real-World Testing

### What Wife Should Test:

**Project 1 (Existing):**
- Create new project with both templates
- Add milestones
- Request payment for first milestone
- Share link with imaginary client
- View on public link
- Add expenses (all categories)
- Check dashboard calculations

**Project 2 (New Project):**
- Use manual payment marking
- Mark 2-3 milestones as partially paid
- Verify status changes
- Check progress bars
- Verify balance calculations

**Project 3 (Edge Cases):**
- Create project with high amounts (₹10,00,000+)
- Test with many expenses
- Test regenerating share link
- Test disabling share link
- Check mobile view on her phone

### Feedback Process:

```
Daily (3 days):
├─ Wife tests feature
├─ Reports bugs/usability issues
├─ Agent fixes same day
└─ Wife confirms fix

Monday: Projects & basic flow
Tuesday: Payments & sharing
Wednesday: Dashboard & edge cases
```

### Success Criteria:

```
✓ Wife uses without getting stuck
✓ Wife says "This solves my problem"
✓ Wife would pay ₹999/month
✓ No critical bugs found
✓ Mobile works on her phone
✓ Share link works (sends to test client)
```

---

## Task 6: Documentation

### Create Setup Guide:
**Location:** `/docs/SETUP_GUIDE.md`

```markdown
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

## For Developers

[Add technical docs here]
```

### Create FAQ:
**Location:** `/docs/FAQ.md`

```markdown
# Frequently Asked Questions

## Q: Is there a free trial?
A: Yes! 7-day money-back guarantee on first month.

## Q: Can I use my own Razorpay account?
A: Currently, Kova uses manual payments. We're exploring online payment options.

## Q: Can clients log in?
A: No login needed. Share a link, client can view anytime.

## Q: What happens if I miss a payment deadline?
A: Kova shows the overdue amount. You manually mark when received.

## Q: Can I delete a project?
A: Yes, but it removes all associated data. Use archive instead.

## Q: How often is data updated?
A: Client links auto-refresh every 30 seconds.

## Q: Is my data secure?
A: Yes! Row-level security ensures only you see your projects.

## Q: What if I need help?
A: Email support@kova.app or check our docs.
```

---

## Task 7: Deployment to Vercel

### Pre-Deployment Checklist:

```
□ All environment variables set in Vercel
  ├─ NEXT_PUBLIC_SUPABASE_URL
  ├─ NEXT_PUBLIC_SUPABASE_ANON_KEY
  ├─ SUPABASE_SERVICE_ROLE_KEY
  ├─ ENCRYPTION_KEY
  ├─ ENCRYPTION_IV
  └─ NEXT_PUBLIC_APP_URL=https://kova.app

□ Database backed up (Supabase automatic daily)
□ All tests passing
□ No console errors or warnings
□ Mobile tested on real devices
□ Wife testing complete
□ All bugs fixed
□ Sitemap created
□ robots.txt configured
```

### Deploy:

```bash
# 1. Push to GitHub
git add .
git commit -m "Week 6: Final polish and launch"
git push origin main

# 2. Vercel auto-deploys on push to main
# Monitor: https://vercel.com/dashboard

# 3. Test production:
# - Go to https://kova.app
# - Test full flow
# - Check mobile
# - Check errors in Vercel logs
```

### Post-Deployment:

```bash
# 1. Enable custom domain
# In Vercel: Add domain kova.app

# 2. Test with custom domain
# - https://kova.app should work
# - All routes should work
# - Share links should work

# 3. Set up monitoring
# - Add Sentry for error tracking
# - Set up analytics (Vercel Analytics)
# - Monitor database usage (Supabase)
```

---

## Task 8: Error Tracking (Sentry)

### Setup Sentry:

```typescript
// 1. Install
npm install @sentry/nextjs

// 2. Create sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: true
})

// 3. Wrap errors
Sentry.captureException(error)

// 4. Set up alerts
// In Sentry dashboard: Alert when 5+ errors in 5 min
```

---

## Task 9: Analytics Setup

### Vercel Analytics:

```bash
# Already included in Vercel Pro
# Just enable in Vercel dashboard
# Metrics: Web Vitals, page performance
```

### Database Monitoring:

```
In Supabase Dashboard:
├─ Monitor: Query performance
├─ Monitor: Storage usage
├─ Monitor: API calls
└─ Alert: If usage spikes
```

---

## Deliverables Checklist

### Mobile & UX
- [ ] Mobile responsive testing (iOS + Android)
- [ ] All forms work on mobile
- [ ] No horizontal overflow
- [ ] Touch targets 48px minimum
- [ ] Text readable (16px minimum)

### PWA
- [ ] manifest.json created
- [ ] Service worker registered
- [ ] Can install to home screen
- [ ] Offline fallback page
- [ ] Icons set up

### Performance
- [ ] Lighthouse score >90 all metrics
- [ ] Page load <3 seconds
- [ ] Images optimized
- [ ] Code splitting configured
- [ ] Database queries optimized

### Bug Fixes
- [ ] Wife testing completed
- [ ] All critical bugs fixed
- [ ] All high-priority bugs fixed
- [ ] Known issues documented

### Documentation
- [ ] Setup guide written
- [ ] FAQ created
- [ ] Error messages clear
- [ ] Help text provided

### Deployment
- [ ] Environment variables set
- [ ] Database backed up
- [ ] Tests passing
- [ ] Deployed to Vercel
- [ ] Custom domain working
- [ ] Error tracking set up

### Testing
- [ ] Wife used with 3 real projects
- [ ] Wife says it solves her problem
- [ ] Mobile tested on real devices
- [ ] Share links tested
- [ ] All features working
- [ ] No console errors

---

## Success Criteria for Week 6

- ✅ Mobile responsive (tested on iOS + Android)
- ✅ Lighthouse score >90
- ✅ PWA installable to home screen
- ✅ Wife completes 3 real projects
- ✅ Wife says she'd pay ₹999/month
- ✅ Zero critical bugs
- ✅ All features working
- ✅ Live on kova.app domain
- ✅ Error tracking set up
- ✅ Ready for first users

---

## Post-Launch Tasks (Week 7+)

### Immediate (Day 1-3 after launch):
```
□ Monitor error logs daily
□ Quick bug fixes if needed
□ Wife provides final feedback
□ Prepare for first paid users
```

### Week 2 (Post-launch):
```
□ Invite wife's designer network to try
□ Gather feedback from early users
□ Plan first feature improvements
□ Monitor performance metrics
```

### Month 2:
```
□ Evaluate payment alternatives (PayU, Cashfree)
□ Plan V2 features based on feedback
□ Consider adding online payments
□ Plan team features if demand exists
```

---

## Launch Celebration 🎉

When all this is done:
1. ✅ You have a working SaaS for interior designers
2. ✅ Wife is your first customer
3. ✅ Problem is solved (milestone-based payments work)
4. ✅ Architecture scales (multi-tenant ready)
5. ✅ Ready for next 50 designers

**Estimated earnings (Year 1):**
```
Month 1-3: 5 users × ₹999 = ₹5K/month
Month 4-6: 15 users × ₹999 = ₹15K/month
Month 7-12: 30 users × ₹999 = ₹30K/month
Total Year 1: ~₹2,00,000+ revenue

Minus: ₹40-50K infrastructure costs
Net Year 1 Profit: ~₹1,50,000+

Not huge, but:
✓ Built in 6 weeks
✓ While working full-time
✓ With wife as validator
✓ Foundation for bigger products
```

---

## Estimated Timeline
- **Mobile testing & fixes:** 1.5 hours
- **PWA setup:** 1 hour
- **Performance optimization:** 1.5 hours
- **Bug fixes:** 2 hours
- **Documentation:** 1 hour
- **Deployment:** 0.5 hours
- **Wife testing & iteration:** 8 hours (over 3 days)
- **Monitoring setup:** 0.5 hours
- **Total: ~16 hours** (over full week, 2 hours/day + wife testing)

---

## What Happens After Week 6

### Month 2 (Validation Phase):
```
Week 1: Invite 5-10 designers
Week 2: Gather feedback
Week 3: Fix bugs/improve
Week 4: Decide on payment alternative
```

### Month 3-6 (Growth Phase):
```
Marketing: Blog, social media, designer communities
Target: 50 paying users
Revenue: ₹50,000/month
```

### Year 2+:
```
Options:
├─ Keep Kova focused, own market
├─ Expand to other project-based businesses
├─ Add team/multi-user features
└─ Build other products under Kova Labs
```

---

**You're 6 weeks away from launch. Then the real work begins. 🚀**

**Good luck. You've got this.**
