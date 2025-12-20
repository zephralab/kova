import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';
import { customMilestoneSchema } from '@/lib/validations/projects';

interface Params {
    params: Promise<{
        projectId: string;
    }>;
}

/**
 * POST /api/projects/[projectId]/milestones - Create new milestone
 */
export async function POST(request: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const supabase = await createClient();
        const { userId, firmId } = await getAuthenticatedUserWithFirm(supabase);

        // Helper to check ownership
        const { data: project } = await supabase
            .from('projects')
            .select('total_amount')
            .eq('id', params.projectId)
            .eq('firm_id', firmId)
            .single();

        if (!project) return errorResponse('Project not found', 404);

        const body = await request.json();
        const validation = customMilestoneSchema.safeParse(body);

        if (!validation.success) {
            return errorResponse(ErrorMessages.VALIDATION_ERROR, 400);
        }

        const m = validation.data;

        const { data, error } = await supabase
            .from('milestones')
            .insert({
                project_id: params.projectId,
                title: m.title,
                description: m.description,
                percentage: m.percentage,
                amount: (m.percentage / 100) * project.total_amount,
                order_index: m.orderIndex,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Milestone create error:', error);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        return jsonResponse(data, 201);
    } catch (error) {
        console.error('Unexpected error:', error);
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}
