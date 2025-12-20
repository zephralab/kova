import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';
import type { TemplateResponse } from '@/lib/types/api';
import type { MilestoneTemplate, MilestoneTemplateItem } from '@/lib/types/database';

/**
 * GET /api/templates - List all milestone templates
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Authenticate
        const { userId } = await getAuthenticatedUserWithFirm(supabase);

        // Fetch templates (default ones + user created ones)
        // Note: In real app we might filters by firm_id too
        const { data: templates, error: templateError } = await supabase
            .from('milestone_templates')
            .select('*')
            .or(`is_default.eq.true,created_by_user_id.eq.${userId}`);

        if (templateError) {
            console.error('Template fetch error:', templateError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        if (!templates || templates.length === 0) {
            return jsonResponse([]);
        }

        // Fetch template items for these templates
        const templateIds = templates.map((t) => t.id);
        const { data: items, error: itemsError } = await supabase
            .from('milestone_template_items')
            .select('*')
            .in('template_id', templateIds)
            .order('order_index', { ascending: true });

        if (itemsError) {
            console.error('Template items fetch error:', itemsError);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Group items by template
        const itemsByTemplate = (items || []).reduce((acc, item) => {
            if (!acc[item.template_id]) {
                acc[item.template_id] = [];
            }
            acc[item.template_id].push(item);
            return acc;
        }, {} as Record<string, MilestoneTemplateItem[]>);

        // Format response
        const response: TemplateResponse[] = templates.map((t: MilestoneTemplate) => ({
            id: t.id,
            name: t.name,
            description: t.description || '',
            isDefault: t.is_default,
            items: (itemsByTemplate[t.id] || []).map((i) => ({
                id: i.id,
                title: i.title,
                percentage: i.percentage,
                orderIndex: i.order_index,
            })),
        }));

        return jsonResponse(response);
    } catch (error) {
        console.error('Unexpected error in GET /api/templates:', error);
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}
