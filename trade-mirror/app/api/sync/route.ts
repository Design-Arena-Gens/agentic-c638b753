import { NextResponse } from "next/server";
import { runMirrorCycle } from "@/lib/mirrorService";

export async function POST() {
  const summary = await runMirrorCycle();
  return NextResponse.json(summary);
}

