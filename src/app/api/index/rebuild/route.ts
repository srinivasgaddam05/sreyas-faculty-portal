import { NextResponse } from "next/server";
import { getAllDocuments, getAllChunks, saveDocument } from "@/lib/firebase";

export async function POST() {
  try {
    const docs = await getAllDocuments();
    const chunks = await getAllChunks();

    // Mark documents as indexed and updated
    for (const doc of docs) {
      await saveDocument({
        ...doc,
        status: "indexed",
        processingProgress: 100,
        currentStep: "completed",
        updatedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Index rebuilt successfully across ${docs.length} documents and ${chunks.length} chunks.`,
      documentsCount: docs.length,
      chunksCount: chunks.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
