import { ParsedSection } from "./chunker";

/**
 * Extracts text and page/section metadata from supported institutional documents (PDF, DOCX, XLSX, TXT).
 */
export async function parseDocument(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<{ sections: ParsedSection[]; totalPages: number }> {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
    return parsePdf(buffer);
  }

  if (
    lowerName.endsWith(".docx") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(buffer);
  }

  if (
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return parseXlsx(buffer);
  }

  // Fallback to plain text
  return parsePlainText(buffer);
}

async function parsePdf(buffer: Buffer): Promise<{ sections: ParsedSection[]; totalPages: number }> {
  try {
    const pdf = require("pdf-parse-new");
    const data = await pdf(buffer);

    const rawPages = (data.text || "").split(/\n\s*\n/).filter((s: string) => s.trim().length > 0);
    return {
      sections: rawPages.length > 0
        ? rawPages.map((txt: string, idx: number) => ({
            text: txt.trim(),
            pageNumber: `Sec. ${idx + 1}`,
          }))
        : [{ text: data.text.trim(), pageNumber: "p. 1" }],
      totalPages: data.numpages || 1,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    const text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ");
    return {
      sections: [{ text: text.slice(0, 10000), pageNumber: "p. 1" }],
      totalPages: 1,
    };
  }
}

async function parseDocx(buffer: Buffer): Promise<{ sections: ParsedSection[]; totalPages: number }> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const fullText = result.value || "";

    const paragraphs = fullText.split("\n\n");
    const sections: ParsedSection[] = [];
    let currentBatch = "";
    let pageNum = 1;

    for (const para of paragraphs) {
      if ((currentBatch + "\n\n" + para).length > 1500) {
        if (currentBatch.trim()) {
          sections.push({ text: currentBatch.trim(), pageNumber: `Sec. ${pageNum++}` });
        }
        currentBatch = para;
      } else {
        currentBatch += (currentBatch ? "\n\n" : "") + para;
      }
    }

    if (currentBatch.trim()) {
      sections.push({ text: currentBatch.trim(), pageNumber: `Sec. ${pageNum}` });
    }

    return {
      sections: sections.length > 0 ? sections : [{ text: fullText.trim(), pageNumber: "Sec. 1" }],
      totalPages: Math.max(1, sections.length),
    };
  } catch (error) {
    console.error("DOCX parsing error:", error);
    return {
      sections: [{ text: buffer.toString("utf-8"), pageNumber: "Sec. 1" }],
      totalPages: 1,
    };
  }
}

async function parseXlsx(buffer: Buffer): Promise<{ sections: ParsedSection[]; totalPages: number }> {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sections: ParsedSection[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        sections.push({
          text: `[Sheet: ${sheetName}]\n${csv.trim()}`,
          pageNumber: `Sheet: ${sheetName}`,
        });
      }
    }

    return {
      sections: sections.length > 0 ? sections : [{ text: "Empty spreadsheet", pageNumber: "Sheet 1" }],
      totalPages: workbook.SheetNames.length || 1,
    };
  } catch (error) {
    console.error("XLSX parsing error:", error);
    return {
      sections: [{ text: "Could not parse spreadsheet", pageNumber: "Sheet 1" }],
      totalPages: 1,
    };
  }
}

async function parsePlainText(buffer: Buffer): Promise<{ sections: ParsedSection[]; totalPages: number }> {
  const text = buffer.toString("utf-8");
  return {
    sections: [{ text: text.trim(), pageNumber: "p. 1" }],
    totalPages: 1,
  };
}
