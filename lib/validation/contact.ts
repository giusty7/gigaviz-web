import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama terlalu panjang"),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(100, "Email terlalu panjang"),
  topic: z
    .string()
    .min(3, "Topik minimal 3 karakter")
    .max(100, "Topik terlalu panjang"),
  message: z
    .string()
    .min(10, "Pesan minimal 10 karakter")
    .max(2000, "Pesan terlalu panjang"),
  // Honeypot anti-spam (harus selalu kosong)
  website: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;