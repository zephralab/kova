import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicProjectView } from '@/components/PublicProjectView';
import type { Milestone } from '@/lib/types/database';

interface PageProps {
    params: Promise<{ uuid: string }>;
}

export default async function PublicProjectPage(props: PageProps) {
    const params = await props.params;
    const supabase = await createClient();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.uuid)) {
        notFound();
    }

    // Fetch project by share_uuid (no authentication required)
    const { data: project, error } = await supabase
        .from('projects')
        .select(`
            id,
            project_name,
            client_name,
            total_amount,
            share_enabled,
            share_uuid,
            created_at,
            milestones(*),
            expenses(*)
        `)
        .eq('share_uuid', params.uuid)
        .eq('share_enabled', true)
        .single();

    if (error || !project) {
        notFound();
    }

    // Sort milestones by order_index
    if (project.milestones) {
        project.milestones.sort((a: Milestone, b: Milestone) => a.order_index - b.order_index);
    }

    // Calculate financials
    const amountReceived = project.milestones?.reduce((sum: number, m: Milestone) => sum + (m.amount_paid || 0), 0) || 0;
    const totalExpenses = project.expenses?.reduce((sum: number, e: { amount: number }) => sum + (e.amount || 0), 0) || 0;
    const balance = amountReceived - totalExpenses;

    return (
        <PublicProjectView
            project={{
                id: project.id,
                project_name: project.project_name,
                client_name: project.client_name,
                total_amount: project.total_amount,
                share_uuid: project.share_uuid,
                created_at: project.created_at,
                milestones: project.milestones || [],
                expenses: project.expenses || []
            }}
            amountReceived={amountReceived}
            totalExpenses={totalExpenses}
            balance={balance}
        />
    );
}
