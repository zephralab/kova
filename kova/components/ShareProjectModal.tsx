'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/toast';

interface ShareProjectModalProps {
    projectId: string;
    currentShareUuid: string | null;
    shareEnabled: boolean;
}

export function ShareProjectModal({
    projectId,
    currentShareUuid,
    shareEnabled: initialShareEnabled
}: ShareProjectModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uuid, setUuid] = useState(currentShareUuid);
    const [enabled, setEnabled] = useState(initialShareEnabled);

    const shareUrl = uuid
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/project/${uuid}`
        : '';

    const handleCopyLink = () => {
        if (!shareUrl) {
            toast.error('No share link available. Please enable sharing first.');
            return;
        }
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
    };

    const handleRegenerateLink = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/regenerate-share`, {
                method: 'POST'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to regenerate link');
            }

            const data = await response.json();
            setUuid(data.newUuid);
            toast.success('New share link generated! Old link is now invalid.');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to regenerate link';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSharing = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/toggle-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shareEnabled: !enabled })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update sharing');
            }

            setEnabled(!enabled);
            toast.success(!enabled ? 'Sharing enabled' : 'Sharing disabled');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update sharing';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share with Client
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Share Project</h2>

                <p className="text-sm text-gray-600 mb-4">
                    Share this link with your client to track project progress and payments
                </p>

                {enabled && uuid ? (
                    <>
                        <div className="bg-blue-50 p-4 rounded mb-4">
                            <p className="text-xs text-gray-600 mb-2">Share Link:</p>
                            <p className="font-mono text-sm break-all text-blue-600 mb-3">
                                {shareUrl}
                            </p>
                            <button
                                onClick={handleCopyLink}
                                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                            >
                                Copy Link
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 mb-4">
                            Client can view this link anytime without logging in. They&apos;ll see:
                            <br />
                            ✓ Milestone payment status
                            <br />
                            ✓ Expense category totals
                            <br />
                            ✓ Project budget and balance
                        </p>
                    </>
                ) : (
                    <div className="bg-gray-50 p-4 rounded mb-4">
                        <p className="text-sm text-gray-600">
                            Sharing is currently disabled. Enable it to generate a share link.
                        </p>
                    </div>
                )}

                <div className="space-y-2 mb-6">
                    <button
                        onClick={handleRegenerateLink}
                        disabled={!enabled || !uuid || isLoading}
                        className="w-full px-3 py-2 border rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Regenerate Link
                    </button>
                    <button
                        onClick={handleToggleSharing}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {enabled ? 'Disable Sharing' : 'Enable Sharing'}
                    </button>
                </div>

                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
