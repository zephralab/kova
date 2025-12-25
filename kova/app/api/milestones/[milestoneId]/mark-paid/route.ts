import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';
import { markPaymentSchema } from '@/lib/validations/payment-methods';

interface Params {
    params: Promise<{
        milestoneId: string;
    }>;
}

/**
 * POST /api/milestones/[milestoneId]/mark-paid - Mark milestone payment as received
 */
export async function POST(request: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const supabase = await createClient();
        const { userId, firmId } = await getAuthenticatedUserWithFirm(supabase);

        const body = await request.json();
        const validation = markPaymentSchema.safeParse(body);

        if (!validation.success) {
            const errorDetails = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            console.error('Validation error:', errorDetails);
            return errorResponse(`Validation failed: ${errorDetails}`, 400);
        }

        const { amount, paymentDate, reference } = validation.data;
        
        // Normalize reference: convert empty string to null
        const normalizedReference = (reference === '' || reference === undefined) ? null : reference;

        // Get milestone with project to verify ownership
        const { data: milestone, error: milestoneError } = await supabase
            .from('milestones')
            .select(`
                id,
                amount,
                amount_paid,
                status,
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

        // Validate amount
        const newTotalPaid = (milestone.amount_paid || 0) + amount;
        if (newTotalPaid > milestone.amount) {
            return errorResponse('Payment amount exceeds milestone amount', 400);
        }

        // Validate payment date
        const paymentDateObj = new Date(paymentDate);
        if (isNaN(paymentDateObj.getTime())) {
            return errorResponse('Invalid payment date', 400);
        }

        // Create payment record
        const { data: paymentRecord, error: paymentError } = await supabase
            .from('milestone_payments')
            .insert({
                milestone_id: params.milestoneId,
                amount: amount,
                status: 'paid',
                paid_at: paymentDateObj.toISOString(),
                reference: normalizedReference,
                created_by_user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (paymentError) {
            console.error('Error creating payment record:', paymentError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Update milestone status
        let newStatus: 'pending' | 'partially_paid' | 'paid' = 'pending';
        if (newTotalPaid >= milestone.amount) {
            newStatus = 'paid';
        } else if (newTotalPaid > 0) {
            newStatus = 'partially_paid';
        }

        const { data: updatedMilestone, error: updateError } = await supabase
            .from('milestones')
            .update({
                amount_paid: newTotalPaid,
                status: newStatus,
                completed_at: newStatus === 'paid' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.milestoneId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating milestone:', updateError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        return jsonResponse({
            success: true,
            message: newStatus === 'paid' ? 'Milestone fully paid!' : 'Payment recorded',
            milestone: {
                id: updatedMilestone.id,
                title: updatedMilestone.title,
                amount: updatedMilestone.amount,
                amount_paid: updatedMilestone.amount_paid,
                status: updatedMilestone.status,
                completedAt: updatedMilestone.completed_at
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return errorResponse(ErrorMessages.UNAUTHORIZED, 401);
        }
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

