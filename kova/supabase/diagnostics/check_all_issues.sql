-- ==============================================================================
-- SUPABASE DATABASE DIAGNOSTICS SCRIPT
-- Run this in Supabase SQL Editor to identify common issues
-- ==============================================================================

-- 1. CHECK FOR MISSING RLS POLICIES
-- ==============================================================================
SELECT
    schemaname,
    tablename,
    CASE
        WHEN rowsecurity THEN 'RLS Enabled ✓'
        ELSE 'RLS DISABLED ✗ (Issue!)'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN ('spatial_ref_sys') -- Exclude system tables
ORDER BY rls_status, tablename;

-- 2. CHECK FOR TABLES WITHOUT POLICIES
-- ==============================================================================
SELECT
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE
        WHEN COUNT(p.policyname) = 0 THEN 'NO POLICIES ✗ (Issue!)'
        ELSE 'Has Policies ✓'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('spatial_ref_sys')
GROUP BY t.tablename
ORDER BY policy_count, t.tablename;

-- 3. CHECK FOR MISSING INDEXES
-- ==============================================================================
SELECT
    schemaname,
    tablename,
    attname as column_name,
    'Consider adding index' as recommendation
FROM pg_stats
WHERE schemaname = 'public'
AND attname LIKE '%_id'
AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = pg_stats.schemaname
    AND tablename = pg_stats.tablename
    AND indexdef LIKE '%' || attname || '%'
)
ORDER BY tablename, attname;

-- 4. CHECK FOR MISSING FOREIGN KEY INDEXES
-- ==============================================================================
SELECT
    tc.table_name,
    kcu.column_name,
    'Missing index on FK' as issue
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = tc.table_name
    AND indexdef LIKE '%' || kcu.column_name || '%'
)
ORDER BY tc.table_name, kcu.column_name;

-- 5. CHECK FOR TABLES WITHOUT CREATED_AT/UPDATED_AT
-- ==============================================================================
SELECT
    t.table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = t.table_name
        AND column_name = 'created_at'
    ) THEN '✓' ELSE '✗ Missing created_at' END as has_created_at,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = t.table_name
        AND column_name = 'updated_at'
    ) THEN '✓' ELSE '✗ Missing updated_at' END as has_updated_at
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 6. CHECK FOR MISSING TRIGGERS
-- ==============================================================================
SELECT
    t.tablename,
    COUNT(tr.tgname) as trigger_count,
    CASE
        WHEN COUNT(tr.tgname) = 0 THEN 'No triggers (may need updated_at trigger)'
        ELSE 'Has triggers ✓'
    END as status
FROM pg_tables t
LEFT JOIN pg_trigger tr ON t.tablename = tr.tgrelid::regclass::text
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('spatial_ref_sys')
GROUP BY t.tablename
ORDER BY trigger_count, t.tablename;

-- 7. CHECK FOR SECURITY DEFINERS (Potential security issues)
-- ==============================================================================
SELECT
    routine_name as function_name,
    security_type,
    CASE
        WHEN security_type = 'DEFINER' THEN '⚠️  Security risk - review carefully'
        ELSE 'OK'
    END as warning
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY security_type DESC;

-- 8. CHECK FOR UNUSED INDEXES
-- ==============================================================================
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    CASE
        WHEN idx_scan = 0 THEN '⚠️  Never used - consider removing'
        WHEN idx_scan < 10 THEN '⚠️  Rarely used'
        ELSE 'OK'
    END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan, tablename;

-- 9. CHECK FOR NULLABLE COLUMNS THAT SHOULD BE NOT NULL
-- ==============================================================================
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    'Consider making NOT NULL' as recommendation
FROM information_schema.columns
WHERE table_schema = 'public'
AND is_nullable = 'YES'
AND column_name IN ('id', 'created_at', 'project_id', 'user_id', 'firm_id')
ORDER BY table_name, column_name;

-- 10. CHECK FOR STORAGE POLICIES
-- ==============================================================================
SELECT
    name as bucket_name,
    public as is_public,
    CASE
        WHEN public THEN '⚠️  Public bucket - ensure this is intentional'
        ELSE 'Private ✓'
    END as security_status
FROM storage.buckets
ORDER BY public DESC;

-- ==============================================================================
-- SUMMARY
-- ==============================================================================
SELECT
    'Run each section above to identify specific issues' as next_steps,
    'Common issues: Missing RLS, Missing indexes, Missing policies' as most_common;
