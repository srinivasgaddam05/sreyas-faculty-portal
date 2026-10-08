export interface ParsedSection {
  text: string;
  pageNumber: number | string;
}

export interface ChunkOutput {
  pageNumber: number | string;
  chunkIndex: number;
  text: string;
}

/**
 * Splits extracted text sections into overlapping semantic chunks
 * respecting the configured chunkSize and overlap.
 */
export function chunkSections(
  sections: ParsedSection[],
  chunkSize: number = 500,
  overlap: number = 60
): ChunkOutput[] {
  const chunks: ChunkOutput[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const text = section.text.trim();
    if (!text) continue;

    if (text.length <= chunkSize) {
      chunks.push({
        pageNumber: section.pageNumber,
        chunkIndex: chunkIndex++,
        text,
      });
      continue;
    }

    let start = 0;
    while (start < text.length) {
      let end = start + chunkSize;

      if (end < text.length) {
        // Try to break at paragraph or sentence boundary
        const boundary = text.lastIndexOf("\n\n", end);
        const sentenceEnd = text.lastIndexOf(". ", end);
        const newline = text.lastIndexOf("\n", end);
        const space = text.lastIndexOf(" ", end);

        if (boundary > start + chunkSize * 0.6) {
          end = boundary + 2;
        } else if (sentenceEnd > start + chunkSize * 0.6) {
          end = sentenceEnd + 2;
        } else if (newline > start + chunkSize * 0.6) {
          end = newline + 1;
        } else if (space > start + chunkSize * 0.6) {
          end = space + 1;
        }
      } else {
        end = text.length;
      }

      const chunkText = text.slice(start, end).trim();
      if (chunkText.length > 20) {
        chunks.push({
          pageNumber: section.pageNumber,
          chunkIndex: chunkIndex++,
          text: chunkText,
        });
      }

      if (end >= text.length) break;
      start = Math.max(start + 1, end - overlap);
    }
  }

  return chunks;
}
