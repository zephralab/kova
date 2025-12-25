'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, GripVertical, AlertCircle, Check, ChevronRight } from 'lucide-react';
import type { TemplateResponse } from '@/lib/types/api';

// Schema matching the API validation
const customMilestoneSchema = z.object({
    title: z.string().min(1, 'Milestone title is required'),
    description: z.string().optional(),
    percentage: z.number().min(0).max(100), // .positive() removed to allow 0 during typing, handled by sum check
    orderIndex: z.number(),
});

const createProjectSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    clientContact: z.string().optional(),
    projectName: z.string().min(1, 'Project name is required'),
    totalAmount: z.number().min(1, 'Total amount must be greater than 0'),
    templateId: z.string().optional(),
    milestones: z.array(customMilestoneSchema).optional(),
    milestoneMode: z.enum(['template', 'custom']).default('template'),
    // We add a refine at the component level or just manual check before submit for the XOR logic
});

type FormData = z.infer<typeof createProjectSchema>;

export default function CreateProjectForm() {
    const router = useRouter();
    const [templates, setTemplates] = useState<TemplateResponse[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            milestoneMode: 'template',
            totalAmount: 0,
            milestones: [
                { title: 'Milestone 1', percentage: 50, orderIndex: 1 },
                { title: 'Milestone 2', percentage: 50, orderIndex: 2 },
            ],
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'milestones',
    });

    // Watch values for real-time validation and UI updates
    const milestoneMode = watch('milestoneMode');
    const selectedTemplateId = watch('templateId');
    const milestones = watch('milestones');
    const totalAmount = watch('totalAmount');

    // Fetch templates on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoadingTemplates(true);
            try {
                const res = await fetch('/api/templates');
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data);
                    // Select first default template if available
                    const defaultTemplate = data.find((t: TemplateResponse) => t.isDefault) || data[0];
                    if (defaultTemplate) {
                        setValue('templateId', defaultTemplate.id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch templates', err);
            } finally {
                setIsLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, [setValue]);

    // Calculate totals
    const totalPercentage = (milestones || []).reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
    const isValidTotal = Math.abs(totalPercentage - 100) < 0.1;

    const onSubmit = async (data: FormData) => {
        setError(null);
        setIsSubmitting(true);

        try {
            // Prepare payload
            const payload: any = {
                clientName: data.clientName,
                clientContact: data.clientContact,
                projectName: data.projectName,
                totalAmount: Number(data.totalAmount),
            };

            if (data.milestoneMode === 'template') {
                if (!data.templateId) {
                    throw new Error('Please select a template');
                }
                payload.templateId = data.templateId;
            } else {
                if (!isValidTotal) {
                    throw new Error(`Milestone percentages must sum to 100% (Current: ${totalPercentage}%)`);
                }
                // Ensure order index is correct
                payload.milestones = data.milestones?.map((m, idx) => ({
                    ...m,
                    orderIndex: idx + 1,
                    percentage: Number(m.percentage)
                }));
            }

            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create project');
            }

            const project = await res.json();
            router.push(`/projects/${project.id}`);
            router.refresh();

        } catch (err: any) {
            setError(err.message);
            window.scrollTo(0, 0);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto p-6">

            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
                    <p className="text-gray-500 mt-1">Setup project details and payment milestones.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Client Info */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">1. Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Client Name *</label>
                        <input
                            {...register('clientName')}
                            placeholder="e.g. Acme Corp"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.clientName && <p className="text-sm text-red-500">{errors.clientName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contact Details (Optional)</label>
                        <input
                            {...register('clientContact')}
                            placeholder="Email or Phone"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </section>

            {/* Project Details */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">2. Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Project Name *</label>
                        <input
                            {...register('projectName')}
                            placeholder="e.g. Office Renovation"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.projectName && <p className="text-sm text-red-500">{errors.projectName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Total Budget *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">₹</span>
                            <input
                                type="number"
                                {...register('totalAmount', { valueAsNumber: true })}
                                placeholder="0.00"
                                className="w-full pl-8 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        {errors.totalAmount && <p className="text-sm text-red-500">{errors.totalAmount.message}</p>}
                    </div>
                </div>
            </section>

            {/* Milestones */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">3. Payment Milestones</h3>
                    <div className="text-sm text-gray-500">
                        {milestoneMode === 'custom' && (
                            <span className={isValidTotal ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                Total: {totalPercentage}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-4 p-1 bg-gray-100 rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setValue('milestoneMode', 'template')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${milestoneMode === 'template' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Use Template
                    </button>
                    <button
                        type="button"
                        onClick={() => setValue('milestoneMode', 'custom')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${milestoneMode === 'custom' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Custom Milestones
                    </button>
                </div>

                {/* Template Content */}
                {milestoneMode === 'template' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Template</label>
                            <select
                                {...register('templateId')}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                disabled={isLoadingTemplates}
                            >
                                {isLoadingTemplates ? (
                                    <option>Loading templates...</option>
                                ) : (
                                    templates.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {selectedTemplate && (
                                <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
                            )}
                        </div>

                        {selectedTemplate && (
                            <div className="border rounded-md overflow-hidden bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-1 text-center">Step</div>
                                    <div className="col-span-7">Milestone</div>
                                    <div className="col-span-2 text-right">Percentage</div>
                                    <div className="col-span-2 text-right">Amount</div>
                                </div>
                                <div className="divide-y">
                                    {selectedTemplate.items.map((item, idx) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-4 p-3 text-sm items-center">
                                            <div className="col-span-1 text-center text-gray-500">{idx + 1}</div>
                                            <div className="col-span-7 font-medium">{item.title}</div>
                                            <div className="col-span-2 text-right text-gray-600">{item.percentage}%</div>
                                            <div className="col-span-2 text-right font-medium">
                                                ₹{((totalAmount || 0) * (item.percentage / 100)).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Custom Content */}
                {milestoneMode === 'custom' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Validation Warning */}
                        {!isValidTotal && (
                            <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Milestones must sum to exactly 100%. Remaining: {100 - totalPercentage}%
                            </div>
                        )}

                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start p-3 border rounded-md bg-white shadow-sm group">
                                    <div className="mt-2 text-gray-400 cursor-move">
                                        <GripVertical className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500">Title</label>
                                            <input
                                                {...register(`milestones.${index}.title` as const)}
                                                placeholder="Milestone Title"
                                                className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                                            />
                                            {errors.milestones?.[index]?.title && (
                                                <p className="text-xs text-red-500">{errors.milestones[index]?.title?.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500">Description (Optional)</label>
                                            <input
                                                {...register(`milestones.${index}.description` as const)}
                                                placeholder="Deliverables..."
                                                className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-24 space-y-1">
                                        <label className="text-xs text-gray-500">% Share</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register(`milestones.${index}.percentage` as const, { valueAsNumber: true })}
                                                className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500 text-right pr-6"
                                            />
                                            <span className="absolute right-2 top-2 text-gray-400 text-sm">%</span>
                                        </div>
                                    </div>

                                    <div className="w-28 space-y-1 pt-6 text-right">
                                        <div className="text-sm font-medium text-gray-700">
                                            ₹{((totalAmount || 0) * ((watch(`milestones.${index}.percentage`) || 0) / 100)).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => append({ title: 'New Milestone', percentage: 0, orderIndex: fields.length + 1 })}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm px-2 py-1"
                        >
                            <Plus className="w-4 h-4" />
                            Add Milestone
                        </button>
                    </div>
                )}
            </section>

            {/* Actions */}
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
                    disabled={isSubmitting || (milestoneMode === 'custom' && !isValidTotal)}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating Project...' : 'Create Project'}
                    {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
        </form>
    );
}
