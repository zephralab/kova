'use client';

import { useState } from 'react';

interface RequestPaymentModalProps {
    milestoneId: string;
    milestoneName: string;
    amount: number;
    projectName: string;
    clientName: string;
    onSuccess?: () => void;
}

export default function RequestPaymentModal({
    milestoneId,
    milestoneName,
    amount,
    projectName,
    clientName,
    onSuccess
}: RequestPaymentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [invoiceText, setInvoiceText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateInvoice = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/milestones/${milestoneId}/generate-invoice`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ milestoneId })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate invoice');
            }

            const data = await response.json();
            setInvoiceText(data.invoiceText);
            // Don't call onSuccess here - invoice generation doesn't change data, so no refresh needed
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate invoice');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyInvoice = async () => {
        if (!invoiceText) return;
        
        try {
            await navigator.clipboard.writeText(invoiceText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors whitespace-nowrap"
            >
                Request Payment
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                {!invoiceText ? (
                    <>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Request Payment</h2>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                                You're about to request payment for:
                            </p>
                            <p className="font-semibold text-gray-900">{projectName}</p>
                            <p className="text-sm text-gray-600">{milestoneName}</p>
                            <p className="text-lg font-bold text-blue-600 mt-2">
                                ₹{amount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                From: {clientName}
                            </p>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            We'll generate a professional payment request that you can copy and send 
                            to your client via WhatsApp or email.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                                {error}
                                {error.includes('bank account details') && (
                                    <div className="mt-2">
                                        <a
                                            href="/settings/payment-methods"
                                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                                        >
                                            Go to Payment Settings →
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setError(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateInvoice}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isLoading ? 'Generating...' : 'Generate Invoice'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">✓ Invoice Ready</h2>
                        
                        <div className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-xs whitespace-pre-wrap break-words border border-gray-200 max-h-96 overflow-y-auto">
                            {invoiceText}
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>How to use:</strong> Copy the invoice above and paste it in 
                                WhatsApp or send via email to your client.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setInvoiceText(null);
                                    setError(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCopyInvoice}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                {copied ? '✓ Copied!' : 'Copy Invoice'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

