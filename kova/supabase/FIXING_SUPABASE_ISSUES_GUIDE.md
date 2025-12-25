# Supabase Issues - Hands-On Fixing Guide

This guide will help you systematically identify and fix all 51 Supabase issues.

## Step 1: Find the Issues List

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your **kova project**
3. Look for the issues in one of these places:
   - **Database** → **Linter** (most likely)
   - **Database** → **Advisors**
   - **Project Settings** → **Reports**
   - A notification banner at the top

4. **Take a screenshot** or **copy the list** of all 51 issues

## Step 2: Run Diagnostics

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open the file: `supabase/diagnostics/check_all_issues.sql`
4. Copy the ENTIRE content
5. Paste into Supabase SQL Editor
6. Click **"Run"** or press `Ctrl + Enter`

### What to Look For:

The diagnostics will show you:
- ✗ Tables without RLS enabled
- ✗ Tables without policies
- ✗ Missing indexes on foreign keys
- ✗ Missing created_at/updated_at columns
- ✗ Missing triggers
- ⚠️  Security risks
- ⚠️  Unused indexes
- ⚠️  Public storage buckets

**Copy the results** - these are YOUR specific issues!

## Step 3: Apply Fixes

Go to `supabase/fixes/fix_common_issues.sql`

### ⚠️  IMPORTANT: Apply Fixes Section by Section

**DO NOT run the entire file at once!** Run each section separately.

### Section 1: Enable RLS (Row Level Security)

```sql
-- Copy lines 8-16 from fix_common_issues.sql
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.firms ENABLE ROW LEVEL SECURITY;
-- ... etc
```

**Run this section first** in SQL Editor.

### Section 2: Create Missing Indexes

```sql
-- Copy lines 21-48 from fix_common_issues.sql
CREATE INDEX IF NOT EXISTS idx_users_firm_id ON public.users(firm_id);
-- ... etc
```

**Run this section** to improve query performance.

### Section 3: Create Updated_At Triggers

```sql
-- Copy lines 53-78 from fix_common_issues.sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- ... etc
```

**Run this section** to auto-update timestamps.

### Section 4: Add RLS Policies

This is the **longest section** (lines 83-450).

**Run each table's policies separately:**

1. **Users table** policies (lines 88-111)
2. **Firms table** policies (lines 116-144)
3. **Projects table** policies (lines 149-204)
4. **Milestones table** policies (lines 209-270)
5. **Milestone_Payments table** policies (lines 275-335)
6. **Expenses table** policies (lines 340-402)
7. **Payment_Methods table** policies (lines 407-454)

**After each table**, run the verification queries to check it worked.

## Step 4: Verify Fixes

At the bottom of `fix_common_issues.sql` are verification queries:

```sql
-- Check that all tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected result**: All tables should show `rowsecurity = true`

```sql
-- Check that all tables have policies
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected result**: Each table should have 3-5 policies

```sql
-- Check that all foreign keys have indexes
-- (run the third verification query)
```

**Expected result**: All foreign keys should have `has_index = true`

## Step 5: Check Remaining Issues

1. Go back to where you saw the "51 issues" originally
2. **Refresh the page**
3. The number should be significantly lower (ideally 0!)

## Step 6: Test Your Application

After fixing issues, test these flows:

1. **Sign up** → Create account
2. **Sign in** → Login
3. **Create project** → Should work
4. **Add milestone** → Should work
5. **Record payment** → Should work
6. **View shareable link** (incognito) → Should work

If anything breaks, check the browser console (F12) for errors.

## Common Issues & Solutions

### Issue: "RLS policies prevent access"

**Solution**: The policies might be too restrictive. Check:
- User is authenticated (`auth.uid()` returns a value)
- User has a `firm_id` set
- Policies match your data structure

### Issue: "Function does not exist"

**Solution**: Some functions might be missing. Check if you need:
- Custom functions for business logic
- Helper functions referenced in policies

### Issue: "Permission denied for schema public"

**Solution**: Check that:
- You're using the correct Supabase credentials
- Service role key vs anon key permissions
- Database user permissions

## Advanced: Custom Issues

If you have specific issues not covered by the automated scripts, you can:

1. **Share the specific error message** with me
2. **Check Supabase logs**: Dashboard → Logs → Database
3. **Review the policy**: Database → Policies → Click on the table

## Monitoring

After fixes, monitor:

1. **Performance**: Database → Performance
2. **Errors**: Logs → Database
3. **API Usage**: Project Settings → API

## Checklist

- [ ] Ran diagnostics script
- [ ] Identified specific issues
- [ ] Enabled RLS on all tables
- [ ] Created missing indexes
- [ ] Added updated_at triggers
- [ ] Created RLS policies for all tables
- [ ] Verified all fixes
- [ ] Tested application flows
- [ ] Confirmed issue count decreased

## Need Help?

If you encounter issues:

1. **Copy the error message**
2. **Note which section/query failed**
3. **Check Supabase logs**
4. Share with me and I'll help debug!

---

**Pro Tip**: Always run fixes on a **staging environment** first if you have real data!
