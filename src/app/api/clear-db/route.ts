import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

export async function GET() {
  try {
    let app;
    if (!getApps().length) {
      const adminConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      app = initializeApp({ credential: cert(adminConfig) });
    } else {
      app = getApps()[0];
    }
    const db = getFirestore(app);

    const chunks = await db.collection("chunks").get();
    const batch = db.batch();
    chunks.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ success: true, count: chunks.size });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
