import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get("companyName");

    const connections = await (prisma as any)["meta_connections"].findMany({
      where: {
        user_id: user.id,
        ...(companyName ? { company_name: companyName } : {}),
      },
      include: {
        meta_ad_accounts: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: connections,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list Meta connections";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
