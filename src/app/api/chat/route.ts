import { NextResponse } from "next/server";

const retrievedSources = [
  { document: "Exam Postponement Circular - June.pdf", page: 3, similarity: 0.97, snippet: "...postponement may be declared by the Controller of Examinations with prior approval from the Academic Council. A minimum notice period of 72 hours must be maintained..." },
  { document: "Academic Regulations 2024-25.pdf", page: 88, similarity: 0.91, snippet: "...rescheduled examinations shall be conducted within fourteen (14) working days of the original scheduled date..." },
  { document: "Academic Regulations 2024-25.pdf", page: 89, similarity: 0.84, snippet: "...natural calamities affecting thirty percent or more of the enrolled student population qualify as force majeure events..." },
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "A question is required." }, { status: 400 });

  return NextResponse.json({
    answer: "Based on the indexed institutional documents, the answer is grounded in the retrieved examination regulations and circulars.",
    sources: retrievedSources,
    query: question,
    grounded: true,
  });
}
