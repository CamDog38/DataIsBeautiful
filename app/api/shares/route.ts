import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShareCode, hashPassword } from "@/lib/shareUtils";

/**
 * POST /api/shares - Create a new shareable Wrapped link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      companyName,
      wrapType,
      year,
      title,
      formData,
      slidesData,
      password,
      expiresAt,
    } = body;

    if (!email || !wrapType || !slidesData) {
      return NextResponse.json(
        { error: "Missing required fields: email, wrapType, slidesData" },
        { status: 400 }
      );
    }

    // Find or create customer
    let customer = await prisma.wApp_Customers.findUnique({
      where: { email },
    });

    if (!customer) {
      customer = await prisma.wApp_Customers.create({
        data: {
          email,
          name: name || null,
          company_name: companyName || null,
        },
      });
    }

    // Generate unique share code
    let shareCode = generateShareCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.wApp_WrappedShares.findUnique({
        where: { share_code: shareCode },
      });
      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    // Create the share
    const share = await prisma.wApp_WrappedShares.create({
      data: {
        customer_id: customer.id,
        share_code: shareCode,
        title: title || `${companyName || name || "Your"}'s ${wrapType} Wrapped`,
        wrap_type: wrapType,
        year: year ? parseInt(year, 10) : new Date().getFullYear(),
        form_data: formData || null,
        slides_data: slidesData,
        password_hash: password ? hashPassword(password) : null,
        is_password_protected: !!password,
        expires_at: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      shareCode: share.share_code,
      shareUrl: `/wrap/${share.share_code}`,
      id: share.id,
    });
  } catch (error) {
    console.error("Error creating share:", error);
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shares?email=... - List shares for a customer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const customer = await prisma.wApp_Customers.findUnique({
      where: { email },
      include: {
        WApp_WrappedShares: {
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            share_code: true,
            title: true,
            wrap_type: true,
            year: true,
            is_password_protected: true,
            expires_at: true,
            is_active: true,
            is_revoked: true,
            view_count: true,
            last_viewed_at: true,
            created_at: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ shares: [] });
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        company_name: customer.company_name,
      },
      shares: customer.WApp_WrappedShares,
    });
  } catch (error) {
    console.error("Error fetching shares:", error);
    return NextResponse.json(
      { error: "Failed to fetch shares" },
      { status: 500 }
    );
  }
}
