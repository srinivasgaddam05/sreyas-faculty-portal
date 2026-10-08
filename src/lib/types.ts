export type DocumentStatus = "indexed" | "processing" | "queued" | "failed";

export interface FacultyProfile {
  uid: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  empId: string;
  avatar: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  storagePath: string;
  fileType: string;
  sizeBytes: number;
  pagesCount: number;
  chunksCount: number;
  status: DocumentStatus;
  processingProgress: number;
  currentStep: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number | string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  createdAt: string;
}

export interface SourceCitation {
  document: string;
  page: number | string;
  similarity: number; // 0 to 1
  snippet: string;
}

export interface WorkspaceSettings {
  grounding: boolean;
  strictAnswers: boolean;
  autoIndex: boolean;
  retrievalDepth: number; // 3, 5, or 8
  chunkSize: number; // 500, 750, or 1000
  updatedAt: string;
}

export interface DashboardMetrics {
  totalDocuments: number;
  fileTypeBreakdown: {
    pdf: number;
    xlsx: number;
    docx: number;
    txt: number;
  };
  totalChunks: number;
  avgQueryTimeMs: number;
  queriesServedThisMonth: number;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  timestamp: string;
}
