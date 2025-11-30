import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomMilestoneInput } from '@/lib/types/api';
import type { Milestone, MilestoneTemplateItem } from '@/lib/types/database';
import { validateMilestonesPercentage } from './helpers';

/**
 * Create milestones from a template
 */
export async function createMilestonesFromTemplate(
    supabase: SupabaseClient,
    templateId: string,
    projectId: string,
    totalAmount: number
): Promise<Milestone[]> {
    // Fetch template items
    const { data: templateItems, error: fetchError } = await supabase
        .from('milestone_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index', { ascending: true });

    if (fetchError) {
        throw new Error('DATABASE_ERROR');
    }

    if (!templateItems || templateItems.length === 0) {
        throw new Error('NOT_FOUND');
    }

    // Create milestones from template items
    const milestonesToCreate = templateItems.map((item: MilestoneTemplateItem) => ({
        project_id: projectId,
        title: item.title,
        description: item.description,
        percentage: item.percentage,
        amount: (item.percentage / 100) * totalAmount,
        order_index: item.order_index,
        status: 'pending' as const,
        amount_paid: 0,
    }));

    const { data: createdMilestones, error: createError } = await supabase
        .from('milestones')
        .insert(milestonesToCreate)
        .select();

    if (createError || !createdMilestones) {
        throw new Error('DATABASE_ERROR');
    }

    return createdMilestones as Milestone[];
}

/**
 * Create custom milestones from user input
 */
export async function createCustomMilestones(
    supabase: SupabaseClient,
    milestones: CustomMilestoneInput[],
    projectId: string,
    totalAmount: number
): Promise<Milestone[]> {
    // Validate percentages sum to 100%
    if (!validateMilestonesPercentage(milestones)) {
        throw new Error('VALIDATION_ERROR');
    }

    // Create milestones
    const milestonesToCreate = milestones.map((milestone) => ({
        project_id: projectId,
        title: milestone.title,
        description: milestone.description || null,
        percentage: milestone.percentage,
        amount: (milestone.percentage / 100) * totalAmount,
        order_index: milestone.orderIndex,
        status: 'pending' as const,
        amount_paid: 0,
    }));

    const { data: createdMilestones, error: createError } = await supabase
        .from('milestones')
        .insert(milestonesToCreate)
        .select();

    if (createError || !createdMilestones) {
        throw new Error('DATABASE_ERROR');
    }

    return createdMilestones as Milestone[];
}
