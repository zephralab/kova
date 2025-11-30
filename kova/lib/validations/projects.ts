import { z } from 'zod/v4';

// Custom milestone input schema
export const customMilestoneSchema = z.object({
    title: z.string().min(1, 'Milestone title is required'),
    description: z.string().optional(),
    percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
    orderIndex: z.number().int().min(1, 'Order index must be at least 1'),
});

// Create project request schema
export const createProjectSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    clientContact: z.string().optional(),
    projectName: z.string().min(1, 'Project name is required'),
    totalAmount: z.number().positive('Total amount must be greater than 0'),
    templateId: z.string().uuid().optional(),
    milestones: z.array(customMilestoneSchema).optional(),
}).refine(
    (data) => {
        // Either templateId or milestones must be provided, but not both
        const hasTemplate = !!data.templateId;
        const hasMilestones = !!data.milestones && data.milestones.length > 0;
        return hasTemplate !== hasMilestones; // XOR: exactly one must be true
    },
    {
        message: 'Either templateId or milestones must be provided, but not both',
    }
);

// Type inference
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CustomMilestoneInput = z.infer<typeof customMilestoneSchema>;
