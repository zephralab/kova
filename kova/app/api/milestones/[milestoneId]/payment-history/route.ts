import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';

interface Params {
    params: Promise<{
        milestoneId: string;
    }>;
}

/**
 * GET /api/milestones/[milestoneId]/payment-history - Get payment history for a milestone
 */
export async function GET(request: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const supabase = await createClient();
        const { firmId } = await getAuthenticatedUserWithFirm(supabase);

        // Verify milestone ownership
        const { data: milestone, error: milestoneError } = await supabase
            .from('milestones')
            .select(`
                id,
                project_id,
                projects!inner(
                    id,
                    firm_id
                )
            `)
            .eq('id', params.milestoneId)
            .single();

        if (milestoneError || !milestone) {
            return errorResponse('Milestone not found', 404);
        }

        // Verify ownership
        const project = Array.isArray(milestone.projects) ? milestone.projects[0] : milestone.projects;
        if (project.firm_id !== firmId) {
            return errorResponse(ErrorMessages.FORBIDDEN, 403);
        }

        // Get payment history
        const { data: payments, error: paymentsError } = await supabase
            .from('milestone_payments')
            .select('*')
            .eq('milestone_id', params.milestoneId)
            .eq('status', 'paid')
            .order('paid_at', { ascending: false });

        if (paymentsError) {
            console.error('Error fetching payment history:', paymentsError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        return jsonResponse({
            success: true,
            payments: payments || [],
            totalPaid: (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return errorResponse(ErrorMessages.UNAUTHORIZED, 401);
        }
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

