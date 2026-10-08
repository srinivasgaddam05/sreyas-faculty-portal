import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  DocumentRecord,
  DocumentChunk,
  WorkspaceSettings,
  DashboardMetrics,
  FacultyProfile,
} from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBmAEQBMfioV7UMvey5q3MmhqSKcquXZTw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sreyas-faculty-portal.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sreyas-faculty-portal",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sreyas-faculty-portal.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "325632007396",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:325632007396:web:9e373b32e89905674920f1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MV3QNQ80R7",
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/**
 * Upload file directly to Firebase Storage
 */
export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ storagePath: string; downloadUrl?: string }> {
  const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `sreyas-documents/${Date.now()}_${sanitizedName}`;
  try {
    const fileRef = storageRef(storage, path);
    const uint8Array = new Uint8Array(buffer);
    await uploadBytes(fileRef, uint8Array, { contentType });
    const downloadUrl = await getDownloadURL(fileRef).catch(() => undefined);
    return { storagePath: path, downloadUrl };
  } catch (error) {
    console.error("Firebase Storage upload error:", error);
    return { storagePath: path };
  }
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFromStorage(path: string): Promise<void> {
  if (!path) return;
  try {
    const fileRef = storageRef(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Firebase Storage delete error:", error);
  }
}

/**
 * Fetch all documents directly from Firestore
 */
export async function getAllDocuments(): Promise<DocumentRecord[]> {
  try {
    const col = collection(db, "documents");
    const snapshot = await getDocs(col);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as DocumentRecord);
    }
  } catch (err) {
    console.error("Firestore get documents error:", err);
  }
  return [];
}

/**
 * Save or update document metadata in Firestore
 */
export async function saveDocument(docRecord: DocumentRecord): Promise<void> {
  try {
    const docRef = doc(db, "documents", docRecord.id);
    await setDoc(docRef, docRecord, { merge: true });
  } catch (err) {
    console.error("Firestore save document error:", err);
    throw err;
  }
}

/**
 * Delete a document and all its chunks from Firestore & Storage
 */
export async function deleteDocument(id: string): Promise<void> {
  try {
    // 1. Fetch document to get storagePath
    const docSnap = await getDoc(doc(db, "documents", id));
    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentRecord;
      if (data.storagePath) {
        await deleteFromStorage(data.storagePath);
      }
    }

    // 2. Delete document record
    await deleteDoc(doc(db, "documents", id));

    // 3. Delete associated chunks from chunks collection
    const chunksCol = collection(db, "chunks");
    const chunksSnap = await getDocs(chunksCol);
    for (const chunkDoc of chunksSnap.docs) {
      const cData = chunkDoc.data() as DocumentChunk;
      if (cData.documentId === id) {
        await deleteDoc(chunkDoc.ref);
      }
    }
  } catch (err) {
    console.error("Firestore delete document error:", err);
    throw err;
  }
}

/**
 * Store chunks directly in Firestore
 */
export async function saveChunks(chunks: DocumentChunk[]): Promise<void> {
  try {
    for (const chunk of chunks) {
      await setDoc(doc(db, "chunks", chunk.id), chunk);
    }
  } catch (err) {
    console.error("Firestore save chunks error:", err);
    throw err;
  }
}

/**
 * Get all chunks directly from Firestore
 */
export async function getAllChunks(): Promise<DocumentChunk[]> {
  try {
    const col = collection(db, "chunks");
    const snapshot = await getDocs(col);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as DocumentChunk);
    }
  } catch (err) {
    console.error("Firestore get chunks error:", err);
  }
  return [];
}

/**
 * Get Workspace Settings from Firestore
 */
export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  const fallbackSettings: WorkspaceSettings = {
    grounding: true,
    strictAnswers: true,
    autoIndex: true,
    retrievalDepth: 3,
    chunkSize: 500,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docSnap = await getDoc(doc(db, "settings", "workspace"));
    if (docSnap.exists()) {
      return docSnap.data() as WorkspaceSettings;
    }
    // If doesn't exist, create it in Firestore
    await setDoc(doc(db, "settings", "workspace"), fallbackSettings);
    return fallbackSettings;
  } catch (err) {
    console.error("Firestore get settings error:", err);
    return fallbackSettings;
  }
}

/**
 * Update Workspace Settings in Firestore
 */
export async function updateWorkspaceSettings(
  settings: Partial<WorkspaceSettings>
): Promise<WorkspaceSettings> {
  const current = await getWorkspaceSettings();
  const updated: WorkspaceSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "settings", "workspace"), updated, { merge: true });
  } catch (err) {
    console.error("Firestore update settings error:", err);
  }

  return updated;
}

/**
 * Calculate Dashboard Metrics live from Firestore
 */
export async function getDashboardMetrics(
  avgQueryTime: number = 0,
  queriesCount: number = 0
): Promise<DashboardMetrics> {
  const docs = await getAllDocuments();
  const chunks = await getAllChunks();

  const fileTypeBreakdown = {
    pdf: 0,
    xlsx: 0,
    docx: 0,
    txt: 0,
  };

  for (const d of docs) {
    const type = d.fileType?.toLowerCase() as keyof typeof fileTypeBreakdown;
    if (fileTypeBreakdown[type] !== undefined) {
      fileTypeBreakdown[type]++;
    }
  }

  const totalChunksCount = chunks.length;

  return {
    totalDocuments: docs.length,
    fileTypeBreakdown,
    totalChunks: totalChunksCount,
    avgQueryTimeMs: avgQueryTime,
    queriesServedThisMonth: queriesCount,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch faculty users directly from Firestore
 */
export async function getUsersFromFirestore(): Promise<FacultyProfile[]> {
  try {
    const col = collection(db, "users");
    const snapshot = await getDocs(col);
    if (!snapshot.empty) {
      return snapshot.docs.map((docSnap) => docSnap.data() as FacultyProfile);
    }
  } catch (err) {
    console.error("Firestore fetch users error:", err);
  }
  return [];
}

/**
 * Save user profile in Firestore
 */
export async function saveUserToFirestore(user: FacultyProfile): Promise<void> {
  try {
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, user, { merge: true });
  } catch (err) {
    console.error("Firestore save user error:", err);
  }
}
