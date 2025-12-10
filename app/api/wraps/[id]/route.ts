import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET - Get a single wrap by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.wApp_Customers.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const wrap = await prisma.wApp_WrappedShares.findFirst({
      where: {
        id: params.id,
        customer_id: customer.id,
      },
    });

    if (!wrap) {
      return NextResponse.json({ error: "Wrap not found" }, { status: 404 });
    }

    return NextResponse.json({ wrap });
  } catch (error) {
    console.error("Error fetching wrap:", error);
    return NextResponse.json({ error: "Failed to fetch wrap" }, { status: 500 });
  }
}

// PATCH - Update a wrap
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.wApp_Customers.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Verify ownership
    const existingWrap = await prisma.wApp_WrappedShares.findFirst({
      where: {
        id: params.id,
        customer_id: customer.id,
      },
    });

    if (!existingWrap) {
      return NextResponse.json({ error: "Wrap not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, is_active, password, remove_password, form_data, slides_data } = body;

    const updateData: any = {
      updated_at: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (form_data !== undefined) updateData.form_data = form_data;
    if (slides_data !== undefined) updateData.slides_data = slides_data;

    if (remove_password) {
      updateData.password_hash = null;
      updateData.is_password_protected = false;
    } else if (password) {
      const bcrypt = await import("bcryptjs");
      updateData.password_hash = await bcrypt.hash(password, 10);
      updateData.is_password_protected = true;
    }

    const wrap = await prisma.wApp_WrappedShares.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ wrap });
  } catch (error) {
    console.error("Error updating wrap:", error);
    return NextResponse.json({ error: "Failed to update wrap" }, { status: 500 });
  }
}

// DELETE - Delete a wrap
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.wApp_Customers.findUnique({
      where: { supabase_user_id: user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Verify ownership
    const existingWrap = await prisma.wApp_WrappedShares.findFirst({
      where: {
        id: params.id,
        customer_id: customer.id,
      },
    });

    if (!existingWrap) {
      return NextResponse.json({ error: "Wrap not found" }, { status: 404 });
    }

    await prisma.wApp_WrappedShares.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wrap:", error);
    return NextResponse.json({ error: "Failed to delete wrap" }, { status: 500 });
  }
}
