// Database entity types matching Supabase schema

export interface Firm {
    id: string;
    name: string;
    subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due';
    subscription_ends_at: string;
    plan_type: 'starter' | 'professional' | 'enterprise';
    max_users: number;
    max_projects: number | null;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    firm_id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    // Payment methods (Week 3)
    bank_account_holder_name: string | null;
    bank_name: string | null;
    account_number: string | null; // Encrypted at rest
    ifsc_code: string | null;
    account_type: 'savings' | 'current' | null;
    upi_id: string | null;
    payment_methods_updated_at: string | null;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    firm_id: string;
    created_by_user_id: string;
    assigned_to_user_id: string | null;
    client_name: string;
    client_contact: string | null;
    project_name: string;
    total_amount: number;
    status: 'active' | 'completed' | 'cancelled' | 'on_hold';
    share_uuid: string;
    share_enabled: boolean;
    started_at: string;
    expected_completion: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Milestone {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    amount: number;
    percentage: number | null;
    order_index: number;
    status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
    amount_paid: number;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface MilestonePayment {
    id: string;
    milestone_id: string;
    amount: number;
    payment_link_url: string | null;
    status: 'pending' | 'paid' | 'failed' | 'expired';
    created_by_user_id: string | null;
    reference: string | null; // Transaction ID, UTR, or confirmation number (Week 3)
    paid_at: string | null;
    expired_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Expense {
    id: string;
    project_id: string;
    description: string;
    amount: number;
    category: 'materials' | 'labor' | 'transport' | 'other';
    expense_date: string;
    vendor_name: string | null;
    added_by_user_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface MilestoneTemplate {
    id: string;
    firm_id: string | null; // null = system template
    name: string;
    description: string | null;
    is_default: boolean;
    created_by_user_id: string | null;
    created_at: string;
}

export interface MilestoneTemplateItem {
    id: string;
    template_id: string;
    title: string;
    description: string | null;
    percentage: number;
    order_index: number;
    created_at: string;
}

// View types
export interface ProjectSummary {
    id: string;
    firm_id: string;
    created_by_user_id: string;
    assigned_to_user_id: string | null;
    project_name: string;
    client_name: string;
    total_amount: number;
    status: 'active' | 'completed' | 'cancelled' | 'on_hold';
    share_uuid: string;
    amount_received: number;
    amount_pending: number;
    milestones_paid: number;
    milestones_pending: number;
    total_expenses: number;
    balance: number;
    created_at: string;
    updated_at: string;
}
