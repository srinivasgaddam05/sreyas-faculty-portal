import { NextResponse } from "next/server";
import { getEmbedding, generateGroundedAnswer } from "@/lib/gemini";
import { rankChunks } from "@/lib/vector";
import { getAllChunks, getWorkspaceSettings } from "@/lib/firebase";
import {
  getCachedResponse,
  setCachedResponse,
  recordQueryMetrics,
} from "@/lib/redis";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "A question is required." }, { status: 400 });
    }

    // 1. Check Upstash Redis Cache
    const cached = await getCachedResponse<any>(question);
    if (cached) {
      const latency = Date.now() - startTime;
      await recordQueryMetrics(latency);
      return NextResponse.json({
        ...cached,
        cached: true,
        latencyMs: latency,
      });
    }

    // 2. Fetch active workspace settings
    const settings = await getWorkspaceSettings();

    // 3. Generate query embedding with Gemini
    const queryEmbedding = await getEmbedding(question);

    // 4. Fetch all stored chunks
    const allChunks = await getAllChunks();

    // 5. Match and rank relevant chunks based on vector cosine similarity
    const topSources = rankChunks(
      queryEmbedding,
      allChunks,
      settings.retrievalDepth || 3,
      question
    );

    // 6. Generate grounded response using Gemini AI
    const groundedResult = await generateGroundedAnswer(question, topSources, {
      strict: settings.strictAnswers,
      grounding: settings.grounding,
    });

    const latencyMs = Date.now() - startTime;
    await recordQueryMetrics(latencyMs);

    const result = {
      answer: groundedResult.answer,
      sources: topSources,
      query: question,
      grounded: settings.grounding,
      latencyMs,
      tokensCount: groundedResult.candidatesTokenCount || Math.max(1, Math.round(groundedResult.answer.split(/\s+/).length * 1.3)),
      promptTokens: groundedResult.promptTokenCount || Math.max(1, Math.round(question.split(/\s+/).length * 1.3)),
      totalTokens: groundedResult.totalTokenCount,
    };

    // Cache successful answer in Upstash Redis
    await setCachedResponse(question, result, 3600);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate answer." },
      { status: 500 }
    );
  }
}
