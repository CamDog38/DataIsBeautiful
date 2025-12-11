import { NextRequest, NextResponse } from "next/server";
import { getFivetranClient } from "@/lib/fivetran";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/fivetran/connections/[id]
 * Get a specific connection's details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const client = getFivetranClient();
    const connection = await client.getConnection(id);

    return NextResponse.json({
      success: true,
      data: connection,
    });
  } catch (error) {
    console.error("Error getting Fivetran connection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get connection" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fivetran/connections/[id]
 * Update a connection (pause/unpause)
 * 
 * Body: { action: "pause" | "unpause" | "sync" }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const client = getFivetranClient();

    switch (action) {
      case "pause":
        await client.pauseConnection(id);
        break;
      case "unpause":
        await client.unpauseConnection(id);
        break;
      case "sync":
        console.log(`[Fivetran][PATCH /connections/${id}] trigger sync`);
        await client.triggerSync(id);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Must be one of: pause, unpause, sync" },
          { status: 400 }
        );
    }

    // Get updated connection status
    const connection = await client.getConnection(id);

    return NextResponse.json({
      success: true,
      data: connection,
    });
  } catch (error) {
    console.error("Error updating Fivetran connection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update connection" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fivetran/connections/[id]
 * Delete a connection
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const client = getFivetranClient();
    await client.deleteConnection(id);

    // Remove mapping from our database (ignore if already gone)
    await prisma.fivetran_connections.deleteMany({
      where: { fivetran_connector_id: id },
    });

    return NextResponse.json({
      success: true,
      message: "Connection deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Fivetran connection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete connection" },
      { status: 500 }
    );
  }
}
