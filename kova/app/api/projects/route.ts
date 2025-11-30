import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProjectSchema } from '@/lib/validations/projects';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import {
    createMilestonesFromTemplate,
    createCustomMilestones,
} from '@/lib/api/projects-helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';
import type {
    CreateProjectRequest,
    ProjectResponse,
    ProjectListItem,
    MilestoneResponse,
} from '@/lib/types/api';
import type { Milestone, ProjectSummary } from '@/lib/types/database';

/**
 * POST /api/projects - Create a new project
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Authenticate and get user's firm
        let userId: string;
        let firmId: string;
        try {
            const auth = await getAuthenticatedUserWithFirm(supabase);
            userId = auth.userId;
            firmId = auth.firmId;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'UNAUTHORIZED';
            if (message === 'UNAUTHORIZED') {
                return errorResponse(ErrorMessages.UNAUTHORIZED, 401);
            }
            return errorResponse(ErrorMessages.FORBIDDEN, 403);
        }

        // Parse and validate request body
        const body: CreateProjectRequest = await request.json();
        const validation = createProjectSchema.safeParse(body);

        if (!validation.success) {
            return errorResponse(
                ErrorMessages.VALIDATION_ERROR,
                400,
                validation.error.issues.map((e) => e.message).join(', ')
            );
        }

        const { clientName, clientContact, projectName, totalAmount, templateId, milestones } =
            validation.data;

        // Create project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                firm_id: firmId,
                created_by_user_id: userId,
                client_name: clientName,
                client_contact: clientContact || null,
                project_name: projectName,
                total_amount: totalAmount,
                status: 'active',
                share_enabled: true,
            })
            .select()
            .single();

        if (projectError || !project) {
            console.error('Project creation error:', projectError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Create milestones
        let createdMilestones: Milestone[];
        try {
            if (templateId) {
                createdMilestones = await createMilestonesFromTemplate(
                    supabase,
                    templateId,
                    project.id,
                    totalAmount
                );
            } else if (milestones) {
                createdMilestones = await createCustomMilestones(
                    supabase,
                    milestones,
                    project.id,
                    totalAmount
                );
            } else {
                return errorResponse('Either templateId or milestones must be provided', 400);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'DATABASE_ERROR';
            if (message === 'NOT_FOUND') {
                return errorResponse('Template not found', 404);
            }
            if (message === 'VALIDATION_ERROR') {
                return errorResponse('Milestone percentages must sum to 100%', 400);
            }
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Format response
        const response: ProjectResponse = {
            id: project.id,
            projectName: project.project_name,
            clientName: project.client_name,
            clientContact: project.client_contact,
            totalAmount: project.total_amount,
            shareUuid: project.share_uuid,
            createdAt: project.created_at,
            milestones: createdMilestones.map((m): MilestoneResponse => ({
                id: m.id,
                title: m.title,
                description: m.description,
                amount: m.amount,
                percentage: m.percentage,
                orderIndex: m.order_index,
                status: m.status,
                amountPaid: m.amount_paid,
                dueDate: m.due_date,
            })),
        };

        return jsonResponse(response, 201);
    } catch (error) {
        console.error('Unexpected error in POST /api/projects:', error);
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

/**
 * GET /api/projects - List all projects for the authenticated user's firm
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Authenticate and get user's firm
        let firmId: string;
        try {
            const auth = await getAuthenticatedUserWithFirm(supabase);
            firmId = auth.firmId;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'UNAUTHORIZED';
            if (message === 'UNAUTHORIZED') {
                return errorResponse(ErrorMessages.UNAUTHORIZED, 401);
            }
            return errorResponse(ErrorMessages.FORBIDDEN, 403);
        }

        // Query project_summary view
        const { data: projects, error: queryError } = await supabase
            .from('project_summary')
            .select('*')
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false });

        if (queryError) {
            console.error('Project query error:', queryError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Format response
        const response: ProjectListItem[] = (projects || []).map((p: ProjectSummary) => ({
            id: p.id,
            projectName: p.project_name,
            clientName: p.client_name,
            totalAmount: p.total_amount,
            amountReceived: p.amount_received,
            amountSpent: p.total_expenses,
            balance: p.balance,
            milestonePaid: p.milestones_paid,
            milestonePending: p.milestones_pending,
            shareUuid: p.share_uuid,
            createdAt: p.created_at,
        }));

        return jsonResponse(response);
    } catch (error) {
        console.error('Unexpected error in GET /api/projects:', error);
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}
