import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';

interface Params {
    params: Promise<{
        projectId: string;
    }>;
}

const VALID_CATEGORIES = ['materials', 'labor', 'transport', 'other'] as const;
type ExpenseCategory = typeof VALID_CATEGORIES[number];

/**
 * POST /api/projects/[projectId]/expenses - Create expense
 */
export async function POST(request: NextRequest, props: Params) {
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

        // Check ownership (user must own the project)
        if (project.created_by_user_id !== userId) {
            return errorResponse('Access denied', 403);
        }

        // Parse and validate request body
        const body = await request.json();
        const { description, amount, category, expenseDate, vendorName } = body;

        // Validation
        if (!description || typeof description !== 'string' || !description.trim()) {
            return errorResponse('Description is required', 400);
        }

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return errorResponse('Amount must be greater than 0', 400);
        }

        if (!category || !VALID_CATEGORIES.includes(category as ExpenseCategory)) {
            return errorResponse('Invalid category. Must be one of: materials, labor, transport, other', 400);
        }

        if (!expenseDate || typeof expenseDate !== 'string') {
            return errorResponse('Expense date is required', 400);
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expenseDate)) {
            return errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
        }

        // Insert expense
        const { data, error } = await supabase
            .from('expenses')
            .insert({
                project_id: params.projectId,
                description: description.trim(),
                amount,
                category: category as ExpenseCategory,
                expense_date: expenseDate,
                vendor_name: vendorName || null,
                added_by_user_id: userId,
            })
            .select()
            .single();

        if (error) {
            console.error('Expense create error:', error);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Format response
        const response = {
            id: data.id,
            description: data.description,
            amount: data.amount,
            category: data.category,
            expenseDate: data.expense_date,
            vendorName: data.vendor_name,
            createdAt: data.created_at,
        };

        return jsonResponse(response, 201);
    } catch (error) {
        console.error('Unexpected error in POST /api/projects/[id]/expenses:', error);
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

/**
 * GET /api/projects/[projectId]/expenses - Get all expenses
 */
export async function GET(request: NextRequest, props: Params) {
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

        // Get query params
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const sortBy = searchParams.get('sortBy') || 'date';
        const order = searchParams.get('order') || 'desc';

        // Build query
        let query = supabase
            .from('expenses')
            .select('*')
            .eq('project_id', params.projectId);

        // Filter by category if provided
        if (category && VALID_CATEGORIES.includes(category as ExpenseCategory)) {
            query = query.eq('category', category);
        }

        // Sort
        const ascending = order === 'asc';
        if (sortBy === 'date') {
            query = query.order('expense_date', { ascending });
        } else if (sortBy === 'amount') {
            query = query.order('amount', { ascending });
        } else {
            query = query.order('created_at', { ascending });
        }

        const { data, error } = await query;

        if (error) {
            console.error('Expense query error:', error);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Format response
        const response = (data || []).map(exp => ({
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            category: exp.category,
            expenseDate: exp.expense_date,
            vendorName: exp.vendor_name,
            createdAt: exp.created_at,
        }));

        return jsonResponse(response);
    } catch (error) {
        console.error('Unexpected error in GET /api/projects/[id]/expenses:', error);
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}
