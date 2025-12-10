import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get a public wrap by share code (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const wrap = await prisma.wApp_WrappedShares.findUnique({
      where: { share_code: params.code },
      select: {
        id: true,
        title: true,
        wrap_type: true,
        year: true,
        slides_data: true,
        is_active: true,
        is_revoked: true,
        is_password_protected: true,
        expires_at: true,
        starts_at: true,
      },
    });

    if (!wrap) {
      return NextResponse.json({ error: "Wrap not found" }, { status: 404 });
    }

    // Check if wrap is active
    if (!wrap.is_active || wrap.is_revoked) {
      return NextResponse.json({ error: "This wrap is no longer available" }, { status: 410 });
    }

    // Check expiry
    if (wrap.expires_at && new Date(wrap.expires_at) < new Date()) {
      return NextResponse.json({ error: "This wrap has expired" }, { status: 410 });
    }

    // Check start date
    if (wrap.starts_at && new Date(wrap.starts_at) > new Date()) {
      return NextResponse.json({ error: "This wrap is not yet available" }, { status: 403 });
    }

    // If password protected, don't return slides_data
    if (wrap.is_password_protected) {
      return NextResponse.json({
        wrap: {
          id: wrap.id,
          title: wrap.title,
          wrap_type: wrap.wrap_type,
          year: wrap.year,
          is_password_protected: true,
        },
        requiresPassword: true,
      });
    }

    // Increment view count
    await prisma.wApp_WrappedShares.update({
      where: { id: wrap.id },
      data: {
        view_count: { increment: 1 },
        last_viewed_at: new Date(),
      },
    });

    return NextResponse.json({
      wrap: {
        id: wrap.id,
        title: wrap.title,
        wrap_type: wrap.wrap_type,
        year: wrap.year,
        slides_data: wrap.slides_data,
      },
    });
  } catch (error) {
    console.error("Error fetching public wrap:", error);
    return NextResponse.json({ error: "Failed to fetch wrap" }, { status: 500 });
  }
}

// POST - Verify password for protected wrap
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const wrap = await prisma.wApp_WrappedShares.findUnique({
      where: { share_code: params.code },
    });

    if (!wrap) {
      return NextResponse.json({ error: "Wrap not found" }, { status: 404 });
    }

    if (!wrap.is_password_protected || !wrap.password_hash) {
      return NextResponse.json({ error: "This wrap is not password protected" }, { status: 400 });
    }

    // Verify password
    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, wrap.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Increment view count
    await prisma.wApp_WrappedShares.update({
      where: { id: wrap.id },
      data: {
        view_count: { increment: 1 },
        last_viewed_at: new Date(),
      },
    });

    return NextResponse.json({
      wrap: {
        id: wrap.id,
        title: wrap.title,
        wrap_type: wrap.wrap_type,
        year: wrap.year,
        slides_data: wrap.slides_data,
      },
    });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 });
  }
}
