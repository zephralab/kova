'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronRight, Save, Trash2 } from 'lucide-react';

const editProjectSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    clientContact: z.string().optional(),
    projectName: z.string().min(1, 'Project name is required'),
    totalAmount: z.number().min(1, 'Total amount must be greater than 0'),
});

type FormData = z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
    projectId: string;
}

export default function EditProjectForm({ projectId }: EditProjectFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load project details');
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [projectId, setValue]);

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
