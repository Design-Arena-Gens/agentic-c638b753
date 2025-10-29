import { NextRequest, NextResponse } from "next/server";
import { getMirrorState } from "@/lib/state";
import { setMirroringEnabled } from "@/lib/mirrorService";
import { z } from "zod";

const BodySchema = z.object({
  enabled: z.boolean(),
});

export async function GET() {
  const state = getMirrorState();
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = BodySchema.parse(json);
    setMirroringEnabled(parsed.enabled);
    const state = getMirrorState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update mirror state",
      },
      { status: 400 },
    );
  }
}

