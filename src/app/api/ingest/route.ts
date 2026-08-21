import { NextResponse } from "next/server";

const supportedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Upload a file using the file field." }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Files must be smaller than 50 MB." }, { status: 413 });
  if (file.type && !supportedTypes.includes(file.type)) return NextResponse.json({ error: "Supported formats are PDF, DOCX, XLSX, and TXT." }, { status: 415 });

  const bytes = await file.arrayBuffer();
  const estimatedChunks = Math.max(1, Math.ceil(bytes.byteLength / 500));
  return NextResponse.json({ filename: file.name, status: "queued", progress: 0, step: "document received", estimatedChunks, overlap: 50, message: "Document accepted for chunking and embedding." });
}
