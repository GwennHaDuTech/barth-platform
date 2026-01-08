import { NextRequest, NextResponse } from "next/server";
import { trackVisit } from "@/app/actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, agencyId } = body;

    // Appel de ta Server Action mise à jour avec la transaction
    const result = await trackVisit(agentId, agencyId);

    if (result.success) {
      return NextResponse.json({ message: "Visit tracked" }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
