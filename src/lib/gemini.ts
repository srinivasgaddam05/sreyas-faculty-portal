import { SourceCitation } from "./types";

const apiKey = process.env.GEMINI_API_KEY || "";

/**
 * Generates real vector embeddings using Google Gemini gemini-embedding-001.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || !text.trim()) return [];

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [{ text: text.slice(0, 2048) }],
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini embedContent error:", err);
      return [];
    }

    const data = await res.json();
    if (data.embedding?.values) {
      return data.embedding.values as number[];
    }
    return [];
  } catch (error) {
    console.error("Failed to generate embedding with Gemini:", error);
    return [];
  }
}

/**
 * Batch generates embeddings for multiple chunk texts.
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  // Small sequential batches to avoid API rate limits
  for (const t of texts) {
    const emb = await getEmbedding(t);
    results.push(emb);
  }
  return results;
}

/**
 * Calls gemini-3.8-flash to generate real, grounded institutional answers
 * based strictly on the retrieved source passages from uploaded documents.
 */
export async function generateGroundedAnswer(
  question: string,
  sources: SourceCitation[],
  options: { strict?: boolean; grounding?: boolean } = {}
): Promise<string> {
  const { strict = true, grounding = true } = options;

  if (sources.length === 0) {
    return "There are no relevant institutional documents in the knowledge base to answer this question. Please upload institutional documents (PDF, DOCX, XLSX, TXT) via the Document Upload section.";
  }

  const contextText = sources
    .map(
      (src, idx) =>
        `[Source ${idx + 1}] Document: "${src.document}", Page/Section: ${src.page} (Similarity: ${Math.round(
          src.similarity * 100
        )}%)\nContent: ${src.snippet}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are the SREYAS Faculty Knowledge Assistant, an official institutional assistant for SREYAS Institute of Engineering & Technology.

${
  grounding
    ? "IMPORTANT GROUNDING DIRECTIVE: You MUST base your answer strictly and exclusively on the provided institutional context passages below. Do not assume or extrapolate beyond the provided text."
    : "Use the provided institutional passages as primary source material."
}

${
  strict
    ? 'If the answer cannot be determined directly from the provided source passages, state clearly: "I cannot find this information in the currently indexed institutional documents. Please consult the academic administration."'
    : ""
}

When stating policies, regulations, or rules, cite the relevant document name and page number from the context.
Format your answer cleanly with structured paragraphs, numbered lists, or bullet points.

---
RETRIEVED INSTITUTIONAL CONTEXT:
${contextText}
---

FACULTY MEMBER'S QUESTION:
${question}

GROUNDED INSTITUTIONAL ANSWER:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini generateContent error:", err);
      return "An error occurred while contacting the AI model. Please verify your connection or try again.";
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText && candidateText.trim()) {
      return candidateText.trim();
    }

    return "No response could be generated for this question from the indexed context.";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Failed to generate answer from the knowledge base. Please try again.";
  }
}
