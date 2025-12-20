// API request and response types

import type { Milestone } from './database';

// POST /api/projects request body
export interface CreateProjectRequest {
    clientName: string;
    clientContact?: string;
    projectName: string;
    totalAmount: number;
    templateId?: string;
    milestones?: CustomMilestoneInput[];
}

// Custom milestone input for project creation
export interface CustomMilestoneInput {
    title: string;
    description?: string;
    percentage: number;
    orderIndex: number;
}

// POST /api/projects response
export interface ProjectResponse {
    id: string;
    projectName: string;
    clientName: string;
    clientContact: string | null;
    totalAmount: number;
    milestones: MilestoneResponse[];
    shareUuid: string;
    createdAt: string;
}

// Milestone in project response
export interface MilestoneResponse {
    id: string;
    title: string;
    description: string | null;
    amount: number;
    percentage: number | null;
    orderIndex: number;
    status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
    amountPaid: number;
    dueDate: string | null;
}

// GET /api/projects response (array of project summaries)
export interface ProjectListItem {
    id: string;
    projectName: string;
    clientName: string;
    totalAmount: number;
    amountReceived: number;
    amountSpent: number;
    balance: number;
    milestonePaid: number;
    milestonePending: number;
    shareUuid: string;
    createdAt: string;
}

// Error response
export interface ApiErrorResponse {
    error: string;
    details?: string;
}

// Template list response
export interface TemplateResponse {
    id: string;
    name: string;
    description: string;
    isDefault: boolean;
    items: {
        id: string;
        title: string;
        percentage: number;
        orderIndex: number;
    }[];
}

// POST /api/projects/[projectId]/expenses request body
export interface CreateExpenseRequest {
    description: string;
    amount: number;
    category: 'materials' | 'labor' | 'transport' | 'other';
    expenseDate: string; // YYYY-MM-DD
    vendorName?: string | null;
}

// Expense response
export interface ExpenseResponse {
    id: string;
    description: string;
    amount: number;
    category: 'materials' | 'labor' | 'transport' | 'other';
    expenseDate: string;
    vendorName: string | null;
    createdAt: string;
}
