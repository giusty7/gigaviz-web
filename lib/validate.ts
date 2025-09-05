import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function sanitize(str: string) {
  return str.replace(
    /[<>&"']/g,
    (c) =>
      (
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&#39;",
        }) as Record<string, string>
      )[c],
  );
}
