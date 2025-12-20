import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';

interface Params {
    params: Promise<{
        projectId: string;
    }>;
}

/**
 * PUT /api/projects/[projectId]/toggle-share - Enable/disable sharing
 */
export async function PUT(request: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const supabase = await createClient();
        const { userId, firmId } = await getAuthenticatedUserWithFirm(supabase);

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(params.projectId)) {
            return errorResponse('Invalid project ID', 400);
        }

        // Verify project exists and user has access
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, firm_id, created_by_user_id')
            .eq('id', params.projectId)
            .eq('firm_id', firmId)
            .single();

        if (projectError || !project) {
            return errorResponse('Project not found', 404);
        }

        // Check ownership
        if (project.created_by_user_id !== userId) {
            return errorResponse('Access denied', 403);
        }

        // Parse request body
        const body = await request.json();
        const { shareEnabled } = body;

        if (typeof shareEnabled !== 'boolean') {
            return errorResponse('shareEnabled must be a boolean', 400);
        }

        // Update share_enabled
        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({
                share_enabled: shareEnabled,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.projectId)
            .select('share_enabled')
            .single();

        if (updateError || !updatedProject) {
            console.error('Error toggling share:', updateError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        return jsonResponse({ shareEnabled: updatedProject.share_enabled });
    } catch (error) {
        console.error('Unexpected error in PUT /api/projects/[id]/toggle-share:', error);
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}
