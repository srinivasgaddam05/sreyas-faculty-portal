# FacultyAI - SRYS Portal

A faculty-facing institutional knowledge assistant based on the supplied project abstract and portal wireframes. The first implementation includes the responsive dashboard, document source table, upload progress state, RAG chat surface, retrieved-source highlighting, and local API contracts.

## Run locally

Node.js 18.18+ is required.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## API contracts

- `POST /api/ingest`: multipart upload with a `file` field. Accepts PDF, DOCX, XLSX, and TXT up to 50 MB and returns ingestion metadata.
- `POST /api/chat`: JSON `{ "question": "..." }`. Returns a grounded answer and top-three source objects.

The current API responses are deterministic local fixtures so the product can be developed without credentials. The next backend slice can replace the route internals with PyPDF/unstructured extraction, Chroma or Qdrant persistence, and OpenAI embeddings/LLM calls behind environment variables.
