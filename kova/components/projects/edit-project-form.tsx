'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronRight, Save, Trash2, Clock, CheckCircle2, Edit2, X, Check } from 'lucide-react';
import type { MilestoneResponse } from '@/lib/types/api';
import EditDueDateModal from '@/components/payments/EditDueDateModal';

const editProjectSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    clientContact: z.string().optional(),
    projectName: z.string().min(1, 'Project name is required'),
    totalAmount: z.number().min(1, 'Total amount must be greater than 0'),
});

type FormData = z.infer<typeof editProjectSchema>;

// Editable Milestone Component
function EditableMilestone({ 
    milestone, 
    projectId, 
    onUpdate 
}: { 
    milestone: MilestoneResponse; 
    projectId: string; 
    onUpdate: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState(milestone.title);
    const [description, setDescription] = useState(milestone.description || '');
    const [error, setError] = useState<string | null>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid
                    </span>
                );
            case 'partially_paid':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Partially Paid
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                    </span>
                );
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/projects/${projectId}/milestones/${milestone.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update milestone');
            }

            setIsEditing(false);
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update milestone');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setTitle(milestone.title);
        setDescription(milestone.description || '');
        setError(null);
        setIsEditing(false);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Milestone Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Advance Payment"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Add a description..."
                                />
                            </div>
                            {error && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                    {error}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                                >
                                    <Check className="w-3 h-3" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                                >
                                    <X className="w-3 h-3" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-gray-400 font-medium text-sm">#{milestone.orderIndex}</span>
                                <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                                {getStatusBadge(milestone.status)}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                                    title="Edit milestone"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            {milestone.description && (
                                <p className="text-sm text-gray-600 ml-8">{milestone.description}</p>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {!isEditing && (
                <>
                    <div className="flex items-center gap-4 text-sm text-gray-600 ml-8 mb-2">
                        <span>Amount: ₹{milestone.amount.toLocaleString('en-IN')}</span>
                        <span>Percentage: {milestone.percentage}%</span>
                        {milestone.amountPaid > 0 && (
                            <span className="text-green-600">
                                Paid: ₹{milestone.amountPaid.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 ml-8">
                        {milestone.dueDate ? (
                            <span className="text-sm text-gray-600">
                                Due: {new Date(milestone.dueDate).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-400">No due date set</span>
                        )}
                        <EditDueDateModal
                            milestoneId={milestone.id}
                            projectId={projectId}
                            milestoneName={milestone.title}
                            currentDueDate={milestone.dueDate}
                            onSuccess={onUpdate}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

interface EditProjectFormProps {
    projectId: string;
}

export default function EditProjectForm({ projectId }: EditProjectFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(editProjectSchema),
    });

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}`);
                if (!res.ok) throw new Error('Failed to fetch project');
                const data = await res.json();

                setValue('clientName', data.clientName);
                setValue('clientContact', data.clientContact || '');
                setValue('projectName', data.projectName);
                setValue('totalAmount', data.totalAmount);
                setMilestones(data.milestones || []);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load project details');
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [projectId, setValue]);

    const handleRefreshMilestones = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (!res.ok) throw new Error('Failed to fetch project');
            const data = await res.json();
            setMilestones(data.milestones || []);
        } catch (err) {
            console.error('Failed to refresh milestones:', err);
        }
    };

    const onSubmit = async (data: FormData) => {
        setError(null);
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                throw new Error('Failed to update project');
            }

            router.push(`/projects/${projectId}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete project');

            router.push('/projects');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading project details...</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto p-6">

            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
                    <p className="text-gray-500 mt-1">Update project details.</p>
                </div>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2 p-2 rounded-md hover:bg-red-50"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Project Name</label>
                        <input
                            {...register('projectName')}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.projectName && <p className="text-sm text-red-500">{errors.projectName.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Client Name</label>
                            <input
                                {...register('clientName')}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {errors.clientName && <p className="text-sm text-red-500">{errors.clientName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Client Contact</label>
                            <input
                                {...register('clientContact')}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Total Budget</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">₹</span>
                            <input
                                type="number"
                                {...register('totalAmount', { valueAsNumber: true })}
                                className="w-full pl-8 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500">Note: Changing budget does not automatically update milestone amounts.</p>
                        {errors.totalAmount && <p className="text-sm text-red-500">{errors.totalAmount.message}</p>}
                    </div>
                </div>
            </div>

            {/* Milestones Section */}
            <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Payment Milestones</h2>
                        <p className="text-sm text-gray-500 mt-1">View and manage milestone details</p>
                    </div>
                </div>

                {milestones.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No milestones found
                    </div>
                ) : (
                    <div className="space-y-3">
                        {milestones.map((milestone) => {
                            const getStatusBadge = (status: string) => {
                                switch (status) {
                                    case 'paid':
                                        return (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Paid
                                            </span>
                                        );
                                    case 'partially_paid':
                                        return (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Partially Paid
                                            </span>
                                        );
                                    default:
                                        return (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                <Clock className="w-3.5 h-3.5" />
                                                Pending
                                            </span>
                                        );
                                }
                            };

                            return (
                                <EditableMilestone
                                    key={milestone.id}
                                    milestone={milestone}
                                    projectId={projectId}
                                    onUpdate={handleRefreshMilestones}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                    {!isSubmitting && <Save className="w-4 h-4" />}
                </button>
            </div>
        </form>
    );
}
