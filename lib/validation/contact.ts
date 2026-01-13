import { z } from "zod";

export const contactTopics = [
  "Partnership",
  "Product Inquiry",
  "Support",
  "Other",
] as const;

export const budgetRanges = [
  "Below Rp 5 million",
  "Rp 5-25 million",
  "Rp 25-100 million",
  "Above Rp 100 million",
  "Not decided yet",
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .email("Email format is invalid")
    .max(100, "Email is too long"),
  company: z.string().max(120, "Company name is too long").optional(),
  topic: z.enum(contactTopics, { message: "Please select a topic" }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long"),
  budgetRange: z
    .string()
    .optional()
    .refine((value) => !value || budgetRanges.includes(value as typeof budgetRanges[number]), {
      message: "Budget range is invalid",
    }),
  // Honeypot anti-spam (should stay empty)
  website: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
