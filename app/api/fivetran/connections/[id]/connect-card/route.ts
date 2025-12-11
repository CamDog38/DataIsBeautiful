import { NextRequest, NextResponse } from "next/server";
import { getFivetranClient } from "@/lib/fivetran";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/fivetran/connections/[id]/connect-card
 * Generate a new Connect Card URL for an existing connection
 * Use this to re-authenticate or update credentials
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Get the app URL for redirect
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/fivetran/callback`;

    const client = getFivetranClient();
    const result = await client.getConnectCardUrl(id, redirectUri);

    return NextResponse.json({
      success: true,
      data: {
        connectionId: result.connectorId,
        connectCardUrl: result.connectCard.uri,
      },
    });
  } catch (error) {
    console.error("Error generating Connect Card URL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate Connect Card URL" },
      { status: 500 }
    );
  }
}
