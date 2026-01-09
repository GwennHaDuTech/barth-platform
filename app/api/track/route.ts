import { NextRequest, NextResponse } from "next/server";
import { trackVisit } from "@/app/actions"; // L'import va maintenant fonctionner

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, agencyId } = body;

    if (!agentId && !agencyId) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await trackVisit({ agentId, agencyId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
