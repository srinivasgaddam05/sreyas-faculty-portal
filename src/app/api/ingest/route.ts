import { NextResponse } from "next/server";
import { parseDocument } from "@/lib/parser";
import { chunkSections } from "@/lib/chunker";
import { getBatchEmbeddings } from "@/lib/gemini";
import {
  uploadToStorage,
  saveDocument,
  saveChunks,
  getWorkspaceSettings,
} from "@/lib/firebase";
import { DocumentRecord, DocumentChunk } from "@/lib/types";

const supportedExtensions = [".pdf", ".docx", ".xlsx", ".txt"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a file using the file field." },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Files must be smaller than 50 MB." },
        { status: 413 }
      );
    }

    const lowerName = file.name.toLowerCase();
    const isValidExt = supportedExtensions.some((ext) => lowerName.endsWith(ext));
    if (!isValidExt) {
      return NextResponse.json(
        { error: "Supported formats are PDF, DOCX, XLSX, and TXT." },
        { status: 415 }
      );
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const extension = lowerName.split(".").pop() || "pdf";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to Firebase Storage
    const storageResult = await uploadToStorage(buffer, file.name, file.type);

    // 2. Parse text content
    const parsed = await parseDocument(buffer, file.name, file.type);

    // 3. Chunk text using active workspace settings
    const settings = await getWorkspaceSettings();
    const chunks = chunkSections(parsed.sections, settings.chunkSize || 500, 60);

    // 4. Generate vector embeddings with Gemini
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await getBatchEmbeddings(chunkTexts);

    // 5. Build Chunk records
    const documentChunks: DocumentChunk[] = chunks.map((c, idx) => ({
      id: `${docId}_c${idx}`,
      documentId: docId,
      documentName: file.name,
      pageNumber: c.pageNumber,
      chunkIndex: c.chunkIndex,
      text: c.text,
      embedding: embeddings[idx] || [],
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    }));

    // 6. Save document chunks
    await saveChunks(documentChunks);

    // 7. Save document record
    const docRecord: DocumentRecord = {
      id: docId,
      name: file.name,
      storagePath: storageResult.storagePath,
      fileType: extension,
      sizeBytes: file.size,
      pagesCount: parsed.totalPages || 1,
      chunksCount: documentChunks.length,
      status: "indexed",
      processingProgress: 100,
      currentStep: "indexed",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      updatedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };

    await saveDocument(docRecord);

    return NextResponse.json({
      success: true,
      document: docRecord,
      message: `${file.name} successfully indexed with ${documentChunks.length} chunks.`,
    });
  } catch (error: any) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process document." },
      { status: 500 }
    );
  }
}
