import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// GET - List all wraps for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create customer record
    let customer = await prisma.wApp_Customers.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!customer) {
      // Create customer if doesn't exist
      customer = await prisma.wApp_Customers.create({
        data: {
          supabase_user_id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      });
    }

    // Get all wraps for this customer
    const wraps = await prisma.wApp_WrappedShares.findMany({
      where: { customer_id: customer.id },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        title: true,
        wrap_type: true,
        year: true,
        share_code: true,
        view_count: true,
        is_active: true,
        is_password_protected: true,
        created_at: true,
      },
    });

    return NextResponse.json({ wraps });
  } catch (error) {
    console.error("Error fetching wraps:", error);
    return NextResponse.json({ error: "Failed to fetch wraps" }, { status: 500 });
  }
}

// POST - Create a new wrap
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, wrap_type, year, form_data, slides_data, password } = body;

    // Get or create customer record
    let customer = await prisma.wApp_Customers.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!customer) {
      customer = await prisma.wApp_Customers.create({
        data: {
          supabase_user_id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      });
    }

    // Generate unique share code
    const share_code = nanoid(12);

    // Hash password if provided
    let password_hash = null;
    if (password) {
      const bcrypt = await import("bcryptjs");
      password_hash = await bcrypt.hash(password, 10);
    }

    // Create the wrap
    const wrap = await prisma.wApp_WrappedShares.create({
      data: {
        customer_id: customer.id,
        share_code,
        title: title || `${wrap_type} Wrapped ${year || new Date().getFullYear()}`,
        wrap_type: wrap_type || "ecommerce",
        year: year || new Date().getFullYear(),
        form_data: form_data || {},
        slides_data: slides_data || [],
        password_hash,
        is_password_protected: !!password,
        is_active: true,
      },
    });

    return NextResponse.json({
      wrap: {
        id: wrap.id,
        share_code: wrap.share_code,
        title: wrap.title,
      },
      shareUrl: `/wrap/${wrap.share_code}`,
    });
  } catch (error) {
    console.error("Error creating wrap:", error);
    return NextResponse.json({ error: "Failed to create wrap" }, { status: 500 });
  }
}
