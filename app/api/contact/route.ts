import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = contactSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid data" },
        { status: 400 }
      );
    }

    const { name, email, message, website } = result.data;
    if (website) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    console.log({ name, email, message });
    // TODO: send email to process.env.CONTACT_TARGET_EMAIL using data

    return NextResponse.json({ ok: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error },
      { status: 500 }
    );
  }
}

