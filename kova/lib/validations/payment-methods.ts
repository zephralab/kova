import { z } from 'zod/v4';

// Payment methods validation schema
export const paymentMethodsSchema = z.object({
    bankAccountHolderName: z.string().min(1, 'Account holder name is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    accountNumber: z.string()
        .regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
    ifscCode: z.string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC code must be 11 alphanumeric characters (e.g., HDFC0001234)'),
    accountType: z.enum(['savings', 'current'], {
        errorMap: () => ({ message: 'Account type must be savings or current' })
    }),
    upiId: z.string()
        .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, 'UPI ID must be in format username@bankname')
        .optional()
        .or(z.literal(''))
});

// Mark payment as received schema
export const markPaymentSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be in YYYY-MM-DD format'),
    reference: z.union([z.string(), z.null()]).optional()
});

// Type inference
export type PaymentMethodsInput = z.infer<typeof paymentMethodsSchema>;
export type MarkPaymentInput = z.infer<typeof markPaymentSchema>;

