import { DocumentChunk, SourceCitation } from "./types";

/**
 * Calculates the cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Tokenizes text into lowercase normalized words.
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Computes lexical Jaccard/overlap similarity (0 to 1) for hybrid search fallback.
 */
export function lexicalSimilarity(query: string, chunkText: string): number {
  const queryTokens = tokenize(query);
  const chunkTokens = tokenize(chunkText);

  if (queryTokens.size === 0 || chunkTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) {
      intersection++;
    }
  }

  // Weight by query coverage
  const queryCoverage = intersection / queryTokens.size;
  return Math.min(1, queryCoverage * 1.1);
}

/**
 * Hybrid Ranker: combines dense vector embeddings with sparse lexical keyword matching.
 * This guarantees reliable search even if embeddings are missing or API is offline.
 */
export function rankChunks(
  queryEmbedding: number[],
  chunks: DocumentChunk[],
  topK: number = 3,
  queryText: string = ""
): SourceCitation[] {
  const scored = chunks.map((chunk) => {
    const vScore = cosineSimilarity(queryEmbedding, chunk.embedding);
    const lScore = queryText ? lexicalSimilarity(queryText, chunk.text) : 0;

    // If embedding exists and is non-zero, combine scores (70% vector + 30% lexical)
    // Otherwise rely on lexical keyword score
    let finalScore = 0;
    if (vScore > 0.01) {
      finalScore = vScore * 0.7 + lScore * 0.3;
    } else {
      finalScore = lScore > 0 ? 0.75 + lScore * 0.22 : 0;
    }

    return {
      document: chunk.documentName,
      page: chunk.pageNumber,
      similarity: Math.max(0, Math.min(1, finalScore)),
      snippet: chunk.text,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.similarity - a.similarity);

  // Return top matches with positive score
  const matches = scored.filter((item) => item.similarity > 0.1).slice(0, topK);

  // If no matches found above threshold, return top items if available
  if (matches.length === 0 && scored.length > 0) {
    return scored.slice(0, topK);
  }

  return matches;
}
