import { NextResponse } from "next/server";
import { getWorkspaceSettings, updateWorkspaceSettings } from "@/lib/firebase";

export async function GET() {
  try {
    const settings = await getWorkspaceSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateWorkspaceSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
