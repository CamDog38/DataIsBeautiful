import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashIp, isShareAccessible } from "@/lib/shareUtils";

/**
 * GET /api/shares/[code] - Get a share by code (for viewing)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    const share = await prisma.wApp_WrappedShares.findUnique({
      where: { share_code: code },
      include: {
        WApp_Customers: {
          select: {
            name: true,
            company_name: true,
            currency_code: true,
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: "Share not found" },
        { status: 404 }
      );
    }

    // Check accessibility
    const { accessible, reason } = isShareAccessible(share);
    if (!accessible) {
      return NextResponse.json(
        { error: reason, requiresPassword: false },
        { status: 403 }
      );
    }

    // Check password if protected
    if (share.is_password_protected && share.password_hash) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }
      if (!verifyPassword(password, share.password_hash)) {
        return NextResponse.json(
          { error: "Invalid password", requiresPassword: true },
          { status: 401 }
        );
      }
    }

    // Record view
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || null;
    const referrer = request.headers.get("referer") || null;

    await prisma.wApp_WrappedShareViews.create({
      data: {
        share_id: share.id,
        viewer_ip_hash: hashIp(ip),
        user_agent: userAgent,
        referrer: referrer,
      },
    });

    // Update view count
    await prisma.wApp_WrappedShares.update({
      where: { id: share.id },
      data: {
        view_count: { increment: 1 },
        last_viewed_at: new Date(),
      },
    });

    return NextResponse.json({
      title: share.title,
      wrapType: share.wrap_type,
      year: share.year,
      slidesData: share.slides_data,
      customer: share.WApp_Customers,
    });
  } catch (error) {
    console.error("Error fetching share:", error);
    return NextResponse.json(
      { error: "Failed to fetch share" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shares/[code] - Update a share (revoke, change password, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { action, password, expiresAt } = body;

    const share = await prisma.wApp_WrappedShares.findUnique({
      where: { share_code: code },
    });

    if (!share) {
      return NextResponse.json(
        { error: "Share not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    switch (action) {
      case "revoke":
        updateData.is_revoked = true;
        updateData.revoked_at = new Date();
        break;
      case "activate":
        updateData.is_active = true;
        updateData.is_revoked = false;
        updateData.revoked_at = null;
        break;
      case "deactivate":
        updateData.is_active = false;
        break;
      case "setPassword":
        if (password) {
          const { hashPassword } = await import("@/lib/shareUtils");
          updateData.password_hash = hashPassword(password);
          updateData.is_password_protected = true;
        }
        break;
      case "removePassword":
        updateData.password_hash = null;
        updateData.is_password_protected = false;
        break;
      case "setExpiry":
        updateData.expires_at = expiresAt ? new Date(expiresAt) : null;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    await prisma.wApp_WrappedShares.update({
      where: { share_code: code },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating share:", error);
    return NextResponse.json(
      { error: "Failed to update share" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shares/[code] - Delete a share
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    await prisma.wApp_WrappedShares.delete({
      where: { share_code: code },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting share:", error);
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 }
    );
  }
}
