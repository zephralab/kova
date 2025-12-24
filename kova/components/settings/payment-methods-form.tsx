'use client';

// Refreshing module factory to resolve Next.js HMR issues after layout restructure

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentMethods {
    bankAccountHolderName: string | null;
    bankName: string | null;
    accountNumberMasked: string | null;
    ifscCode: string | null;
    accountType: 'savings' | 'current' | null;
    upiId: string | null;
    updatedAt: string | null;
}

export default function PaymentMethodsForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [existingData, setExistingData] = useState<PaymentMethods | null>(null);

    // Form state
    const [bankAccountHolderName, setBankAccountHolderName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
    const [upiId, setUpiId] = useState('');

    // Validation state
    const [ifscError, setIfscError] = useState<string | null>(null);
    const [accountNumberError, setAccountNumberError] = useState<string | null>(null);
    const [upiError, setUpiError] = useState<string | null>(null);

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const loadPaymentMethods = async () => {
        try {
            const response = await fetch('/api/designer/payment-methods');
            if (!response.ok) {
                throw new Error('Failed to load payment methods');
            }
            const data = await response.json();
            setExistingData(data.paymentMethods);

            // Pre-fill form if data exists
            if (data.paymentMethods.bankAccountHolderName) {
                setBankAccountHolderName(data.paymentMethods.bankAccountHolderName);
                setBankName(data.paymentMethods.bankName || '');
                setIfscCode(data.paymentMethods.ifscCode || '');
                setAccountType(data.paymentMethods.accountType || 'savings');
                setUpiId(data.paymentMethods.upiId || '');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payment methods');
        } finally {
            setIsLoading(false);
        }
    };

    const validateIFSC = (code: string) => {
        if (!code) {
            setIfscError(null);
            return true;
        }
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(code.toUpperCase())) {
            setIfscError('IFSC code must be 11 alphanumeric characters (e.g., HDFC0001234)');
            return false;
        }
        setIfscError(null);
        return true;
    };

    const validateAccountNumber = (number: string) => {
        if (!number) {
            setAccountNumberError(null);
            return true;
        }
        const accountRegex = /^\d{9,18}$/;
        if (!accountRegex.test(number)) {
            setAccountNumberError('Account number must be 9-18 digits');
            return false;
        }
        setAccountNumberError(null);
        return true;
    };

    const validateUPI = (upi: string) => {
        if (!upi) {
            setUpiError(null);
            return true;
        }
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!upiRegex.test(upi)) {
            setUpiError('UPI ID must be in format username@bankname');
            return false;
        }
        setUpiError(null);
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validate all fields
        if (!bankAccountHolderName.trim()) {
            setError('Account holder name is required');
            return;
        }
        if (!bankName.trim()) {
            setError('Bank name is required');
            return;
        }
        if (!accountNumber.trim()) {
            setError('Account number is required');
            return;
        }
        if (!ifscCode.trim()) {
            setError('IFSC code is required');
            return;
        }

        if (!validateIFSC(ifscCode) || !validateAccountNumber(accountNumber)) {
            return;
        }

        if (upiId && !validateUPI(upiId)) {
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch('/api/designer/payment-methods', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bankAccountHolderName: bankAccountHolderName.trim(),
                    bankName: bankName.trim(),
                    accountNumber: accountNumber.trim(),
                    ifscCode: ifscCode.toUpperCase().trim(),
                    accountType,
                    upiId: upiId.trim() || undefined
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save payment methods');
            }

            const data = await response.json();
            setExistingData(data.paymentMethods);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save payment methods');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {existingData?.bankAccountHolderName ? (
                <div className="p-6 border-b bg-green-50">
                    <div className="flex items-center gap-2 text-green-800">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Payment details saved</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                        Your clients will use these details to pay you
                    </p>
                    {existingData.accountNumberMasked && (
                        <div className="mt-3 text-sm text-green-700">
                            <span className="font-medium">Account:</span> {existingData.accountNumberMasked} | {existingData.bankName}
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-6 border-b bg-yellow-50">
                    <p className="text-yellow-800 font-medium">You haven't added payment details yet</p>
                    <p className="text-sm text-yellow-700 mt-1">This is required to request payments from clients</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Bank Account Details Section */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Holder Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={bankAccountHolderName}
                                onChange={(e) => setBankAccountHolderName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => {
                                    setAccountNumber(e.target.value);
                                    validateAccountNumber(e.target.value);
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${accountNumberError ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="9-18 digits"
                                required
                            />
                            {accountNumberError && (
                                <p className="mt-1 text-sm text-red-600">{accountNumberError}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                IFSC Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={ifscCode}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    setIfscCode(value);
                                    validateIFSC(value);
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${ifscError ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="HDFC0001234"
                                maxLength={11}
                                required
                            />
                            {ifscError && (
                                <p className="mt-1 text-sm text-red-600">{ifscError}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value as 'savings' | 'current')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="savings">Savings</option>
                                <option value="current">Current</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* UPI Section */}
                <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">UPI (Optional)</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            UPI ID
                        </label>
                        <input
                            type="text"
                            value={upiId}
                            onChange={(e) => {
                                setUpiId(e.target.value);
                                validateUPI(e.target.value);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${upiError ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="designer@okhdfcbank"
                        />
                        {upiError && (
                            <p className="mt-1 text-sm text-red-600">{upiError}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Optional: Add your UPI ID for easier payments</p>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                        ✓ Payment details saved successfully
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isSaving ? 'Saving...' : 'Save Payment Details'}
                    </button>
                </div>
            </form>
        </div>
    );
}


