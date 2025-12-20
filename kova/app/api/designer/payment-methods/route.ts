import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import { jsonResponse, errorResponse, ErrorMessages } from '@/lib/api/response';
import { paymentMethodsSchema } from '@/lib/validations/payment-methods';

/**
 * GET /api/designer/payment-methods - Get designer's payment methods
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { userId } = await getAuthenticatedUserWithFirm(supabase);

        const { data: user, error } = await supabase
            .from('users')
            .select('bank_account_holder_name, bank_name, account_number, ifsc_code, account_type, upi_id, payment_methods_updated_at')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching payment methods:', error);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        if (!user) {
            return errorResponse(ErrorMessages.NOT_FOUND, 404);
        }

        // Mask account number (only show last 4 digits)
        const accountNumberMasked = user.account_number
            ? `****${user.account_number.slice(-4)}`
            : null;

        return jsonResponse({
            success: true,
            paymentMethods: {
                bankAccountHolderName: user.bank_account_holder_name,
                bankName: user.bank_name,
                accountNumberMasked,
                ifscCode: user.ifsc_code,
                accountType: user.account_type,
                upiId: user.upi_id,
                updatedAt: user.payment_methods_updated_at
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return errorResponse(ErrorMessages.UNAUTHORIZED, 401);
        }
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

/**
 * PUT /api/designer/payment-methods - Save designer's payment methods
 */
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { userId } = await getAuthenticatedUserWithFirm(supabase);

        const body = await request.json();
        const validation = paymentMethodsSchema.safeParse(body);

        if (!validation.success) {
            return errorResponse(ErrorMessages.VALIDATION_ERROR, 400);
        }

        const data = validation.data;

        // Update user with payment methods
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                bank_account_holder_name: data.bankAccountHolderName,
                bank_name: data.bankName,
                account_number: data.accountNumber, // In production, encrypt this
                ifsc_code: data.ifscCode.toUpperCase(), // Store uppercase
                account_type: data.accountType,
                upi_id: data.upiId || null,
                payment_methods_updated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('bank_account_holder_name, bank_name, account_number, ifsc_code, account_type, upi_id, payment_methods_updated_at')
            .single();

        if (error) {
            console.error('Error updating payment methods:', error);
            return errorResponse(ErrorMessages.DATABASE_ERROR, 500);
        }

        // Mask account number for response
        const accountNumberMasked = updatedUser.account_number
            ? `****${updatedUser.account_number.slice(-4)}`
            : null;

        return jsonResponse({
            success: true,
            message: 'Payment details saved',
            paymentMethods: {
                bankAccountHolderName: updatedUser.bank_account_holder_name,
                bankName: updatedUser.bank_name,
                accountNumberMasked,
                ifscCode: updatedUser.ifsc_code,
                accountType: updatedUser.account_type,
                upiId: updatedUser.upi_id,
                updatedAt: updatedUser.payment_methods_updated_at
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return errorResponse(ErrorMessages.UNAUTHORIZED, 401);
        }
        return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
    }
}

