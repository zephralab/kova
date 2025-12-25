import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';

interface Params {
    params: Promise<{
        milestoneId: string;
    }>;
}

/**
 * POST /api/milestones/[milestoneId]/generate-invoice - Generate payment request invoice
 */
export async function POST(request: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const supabase = await createClient();
        const { userId, firmId } = await getAuthenticatedUserWithFirm(supabase);

        // Get milestone with project
        const { data: milestone, error: milestoneError } = await supabase
            .from('milestones')
            .select(`
                id,
                title,
                amount,
                amount_paid,
                due_date,
                projects!inner(
                    id,
                    project_name,
                    client_name,
                    firm_id,
                    created_by_user_id
                )
            `)
            .eq('id', params.milestoneId)
            .single();

        if (milestoneError || !milestone) {
            console.error('Error fetching milestone:', milestoneError);
            return errorResponse('Milestone not found', 404);
        }

        // Verify ownership (project belongs to user's firm)
        const project = Array.isArray(milestone.projects) ? milestone.projects[0] : milestone.projects;
        if (project.firm_id !== firmId) {
            return errorResponse(ErrorMessages.FORBIDDEN, 403);
        }

        // Get designer (user who created the project) payment details
        const { data: designer, error: designerError } = await supabase
            .from('users')
            .select('id, full_name, bank_account_holder_name, bank_name, account_number, ifsc_code, account_type, upi_id')
            .eq('id', project.created_by_user_id)
            .single();

        if (designerError || !designer) {
            console.error('Error fetching designer:', designerError);
            return errorResponse('Designer not found', 404);
        }

        // Check if payment details are set
        if (!designer.bank_account_holder_name || !designer.bank_name || !designer.account_number || !designer.ifsc_code) {
            return errorResponse('Please set your bank account details in Settings', 400);
        }

        // Calculate remaining amount
        const amountPaid = milestone.amount_paid || 0;
        const amountRemaining = milestone.amount - amountPaid;
        
        // Format invoice text
        const amountFormatted = `₹${amountRemaining.toLocaleString('en-IN')}`;
        const dueDateFormatted = milestone.due_date
            ? new Date(milestone.due_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
            : 'Not specified';
        
        const accountNumberMasked = `****${designer.account_number.slice(-4)}`;
        const upiSection = designer.upi_id ? `\nOr via UPI: ${designer.upi_id}` : '';
        const generatedDate = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const reference = `MIL-${milestone.id.slice(0, 8).toUpperCase()}`;
        
        // Add payment status note if partially paid
        const paymentStatusNote = amountPaid > 0 
            ? `\n\nNote: ₹${amountPaid.toLocaleString('en-IN')} already received. Remaining: ${amountFormatted}`
            : '';

        const invoiceText = `PAYMENT REQUEST
═════════════════════════════════════════════

Project: ${project.project_name}
Milestone: ${milestone.title}
Amount Due: ${amountFormatted}${paymentStatusNote}

PROJECT DETAILS:
Client: ${project.client_name}
Designer: ${designer.full_name || 'Designer'}
Due Date: ${dueDateFormatted}

PAYMENT INSTRUCTIONS:
Please transfer ${amountFormatted} to the following bank account:

Account Holder: ${designer.bank_account_holder_name}
Bank: ${designer.bank_name}
Account Number: ${accountNumberMasked}
IFSC Code: ${designer.ifsc_code}
Account Type: ${designer.account_type === 'savings' ? 'Savings' : 'Current'}${upiSection}

Once you transfer, please confirm via WhatsApp/message.

Thank you for your business!

═════════════════════════════════════════════
Generated on: ${generatedDate}
Reference: ${reference}`;

        return jsonResponse({
            invoiceId: `INV-${Date.now()}`,
            projectName: project.project_name,
            milestoneName: milestone.title,
            amount: amountRemaining,
            amountPaid: amountPaid,
            totalAmount: milestone.amount,
            currency: 'INR',
            amountFormatted,
            dueDate: milestone.due_date,
            clientName: project.client_name,
            designerName: designer.full_name || 'Designer',
            bankDetails: {
                accountHolderName: designer.bank_account_holder_name,
                bankName: designer.bank_name,
                accountNumberMasked,
                ifscCode: designer.ifsc_code,
                accountType: designer.account_type,
                upiId: designer.upi_id
            },
            invoiceText,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return errorResponse(ErrorMessages.UNAUTHORIZED, 401);
        }
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

