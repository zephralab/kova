import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get authenticated user and their firm ID
 * @throws Error if user is not authenticated or firm not found
 */
export async function getAuthenticatedUserWithFirm(
    supabase: SupabaseClient
): Promise<{ userId: string; firmId: string }> {
    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('UNAUTHORIZED');
    }

    // Get user's firm ID from users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('firm_id')
        .eq('id', user.id)
        .single();

    if (userError || !userData) {
        throw new Error('FORBIDDEN');
    }

    return {
        userId: user.id,
        firmId: userData.firm_id,
    };
}

/**
 * Validate that milestone percentages sum to 100%
 */
export function validateMilestonesPercentage(
    milestones: Array<{ percentage: number }>
): boolean {
    const sum = milestones.reduce((acc, m) => acc + m.percentage, 0);
    // Allow small floating point errors (within 0.01%)
    return Math.abs(sum - 100) < 0.01;
}

/**
 * Calculate milestone amounts from percentages and total amount
 */
export function calculateMilestoneAmounts(
    milestones: Array<{ percentage: number }>,
    totalAmount: number
): number[] {
    return milestones.map((m) => (m.percentage / 100) * totalAmount);
}
