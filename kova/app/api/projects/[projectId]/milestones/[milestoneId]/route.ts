import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';

interface Params {
    params: Promise<{
        projectId: string;
        milestoneId: string;
    }>;
}

/**
 * PUT /api/projects/[projectId]/milestones/[milestoneId] - Update milestone
 */
export async function PUT(request: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const supabase = await createClient();
        const { userId } = await getAuthenticatedUserWithFirm(supabase); // Ensure auth

        const body = await request.json();

        // Basic update - allows updating info and status
        // Recalculating amount if percentage changes would require project total fetch
        // For simplicity assuming body might contain 'amount' or 'percentage'

        const updates: any = {};
        if (body.title) updates.title = body.title;
        if (body.description) updates.description = body.description;
        if (body.status) updates.status = body.status;
        if (body.dueDate) updates.due_date = body.dueDate;

        // Note: Changing percentage/amount is tricky without validating totals again.
        // For Week 2 scope, we'll allow title/desc/date edits primarily.

        const { data, error } = await supabase
            .from('milestones')
            .update(updates)
            .eq('id', params.milestoneId)
            .eq('project_id', params.projectId)
            .select()
            .single();

        if (error) {
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        return jsonResponse(data);
    } catch (e) {
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

/**
 * DELETE /api/projects/[projectId]/milestones/[milestoneId]
 */
export async function DELETE(request: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const supabase = await createClient();
        await getAuthenticatedUserWithFirm(supabase);

        const { error } = await supabase
            .from('milestones')
            .delete()
            .eq('id', params.milestoneId)
            .eq('project_id', params.projectId);

        if (error) return errorResponse(ErrorMessages.DATABASE_ERROR, 500);

        return jsonResponse({ success: true });
    } catch (e) {
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}
