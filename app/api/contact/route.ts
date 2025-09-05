import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  website: z.string().optional().or(z.literal('')), // honeypot
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = contactSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 });
    }

    const { name, email, message, website } = parsed.data;

    // Honeypot: kalau terisi, diam-diam drop tapi tetap 200 supaya tidak memberi sinyal ke bot
    if (website) {
      return NextResponse.json({ ok: true, sent: false });
    }

    const { sent } = await sendContactEmail({ name, email, message });
    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

// (opsional) simple ping
export async function GET() {
  return NextResponse.json({ ok: true });
}