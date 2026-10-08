import { NextResponse } from "next/server";
import { getAllDocuments, deleteDocument } from "@/lib/firebase";

export async function GET() {
  try {
    const docs = await getAllDocuments();
    return NextResponse.json({ documents: docs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    await deleteDocument(id);
    return NextResponse.json({ success: true, message: "Document deleted." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
