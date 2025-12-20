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
        // If user record is missing, try to create it using the RPC function
        try {
            // Extract name from metadata or email
            const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

            const { data: newData, error: createError } = await supabase.rpc(
                'create_firm_and_owner',
                {
                    auth_user_id: user.id,
                    user_email: user.email,
                    user_name: name,
                    firm_name: `${name}'s Firm`
                }
            );

            if (createError) {
                console.error('Failed to create user/firm via RPC:', createError);
                throw new Error(`FORBIDDEN: RPC failed - ${createError.message}`);
            }

            // RPC returns an array of rows (because it returns TABLE)
            // Even though it returns one row, Supabase RPC returns data as array or object depending on return type.
            // RETURNS TABLE(...) usually returns array of objects.
            const result = Array.isArray(newData) ? newData[0] : newData;

            if (!result || !result.firm_id) {
                console.error('RPC returned invalid data:', newData);
                throw new Error('FORBIDDEN: RPC returned invalid data');
            }

            return {
                userId: user.id,
                firmId: result.firm_id,
            };

        } catch (e) {
            console.error('Auto-provisioning failed:', e);

            // Last resort: Try to use the emergency override function
            // This fixes cases where the user exists but RLS hides them
            try {
                const { data: forcedData, error: forceError } = await supabase.rpc(
                    'force_get_firm_id',
                    { target_user_id: user.id }
                );

                if (!forceError && forcedData && forcedData.length > 0) {
                    return {
                        userId: user.id,
                        firmId: forcedData[0].firm_id
                    };
                }
            } catch (rpcError) {
                console.error('Force fetch failed:', rpcError);
            }

            const msg = e instanceof Error ? e.message : 'Unknown error';
            throw new Error(`FORBIDDEN: Auto-provisioning failed - ${msg}`);
        }
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
