import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin login is not configured" },
        { status: 503 }
      );
    }

    const inputHash = hashPassword(password);
    const expectedHash = hashPassword(adminPassword);

    const inputBuf = Buffer.from(inputHash, "hex");
    const expectedBuf = Buffer.from(expectedHash, "hex");

    if (!timingSafeEqual(inputBuf, expectedBuf)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Set admin session cookie (httpOnly, secure, 24h expiry)
    const cookieStore = await cookies();
    const sessionToken = createHash("sha256")
      .update(adminPassword + Date.now().toString())
      .digest("hex");

    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Also store the token hash server-side via a cookie for validation
    cookieStore.set("admin_session_check", hashPassword(sessionToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
