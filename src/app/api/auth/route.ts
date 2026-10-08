import { NextResponse } from "next/server";
import { getUsersFromFirestore, saveUserToFirestore } from "@/lib/firebase";

export async function GET() {
  const profiles = await getUsersFromFirestore();
  return NextResponse.json({
    profiles,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const allProfiles = await getUsersFromFirestore();
    const matched = allProfiles.find(
      (p) => p.email.toLowerCase() === (email || "").toLowerCase()
    );

    if (matched) {
      return NextResponse.json({
        success: true,
        user: matched,
      });
    }

    // Create a new faculty profile in Firestore if logging in with new faculty email
    const namePart = (email || "Faculty Member").split("@")[0].replace(/\./g, " ");
    const formattedName = namePart
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const customUser = {
      uid: `fac_${Date.now()}`,
      name: formattedName.startsWith("Dr") ? formattedName : `Prof. ${formattedName}`,
      email: email || "faculty@sreyas.ac.in",
      department: "Computer Science & Engineering",
      designation: "Assistant Professor",
      empId: `EMP-CSE-${Math.floor(100 + Math.random() * 900)}`,
      avatar: namePart.slice(0, 2).toUpperCase(),
    };

    await saveUserToFirestore(customUser);

    return NextResponse.json({
      success: true,
      user: customUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
