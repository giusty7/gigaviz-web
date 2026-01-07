import { z } from "zod";

export const contactTopics = [
  "Partnership",
  "Product Inquiry",
  "Support",
  "Other",
] as const;

export const budgetRanges = [
  "Di bawah Rp 5 juta",
  "Rp 5-25 juta",
  "Rp 25-100 juta",
  "Di atas Rp 100 juta",
  "Belum ditentukan",
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama terlalu panjang"),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(100, "Email terlalu panjang"),
  company: z.string().max(120, "Nama perusahaan terlalu panjang").optional(),
  topic: z.enum(contactTopics, { message: "Pilih topik terlebih dahulu" }),
  message: z
    .string()
    .min(10, "Pesan minimal 10 karakter")
    .max(2000, "Pesan terlalu panjang"),
  budgetRange: z
    .string()
    .optional()
    .refine((value) => !value || budgetRanges.includes(value as typeof budgetRanges[number]), {
      message: "Range budget tidak valid",
    }),
  // Honeypot anti-spam (harus selalu kosong)
  website: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
