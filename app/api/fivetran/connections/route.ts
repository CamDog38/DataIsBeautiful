import { NextRequest, NextResponse } from "next/server";
import {
  getFivetranClient,
  generateSchemaName,
  FIVETRAN_SERVICES,
  type FivetranService,
} from "@/lib/fivetran";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/fivetran/connections
 * List all connections for the current user
 * Query params: userId (required), companyName (optional - filter by company)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const companyName = searchParams.get("companyName");

    console.log("[Fivetran][GET /connections]", { userId, companyName });

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Query from our database to get connections with company names
    const dbConnections = await prisma.fivetran_connections.findMany({
      where: {
        user_id: userId,
        ...(companyName ? { company_name: companyName } : {}),
      },
    });

    // Fetch live status from Fivetran for each connection
    const client = getFivetranClient();
    const connections = await Promise.all(
      dbConnections.map(async (dbConn) => {
        try {
          const fivetranConn = await client.getConnection(dbConn.fivetran_connector_id);
          return {
            id: dbConn.fivetran_connector_id,
            service: dbConn.service,
            schema: dbConn.schema_name,
            companyName: dbConn.company_name,
            status: fivetranConn.status,
          };
        } catch {
          // If Fivetran call fails, return what we have in DB
          return {
            id: dbConn.fivetran_connector_id,
            service: dbConn.service,
            schema: dbConn.schema_name,
            companyName: dbConn.company_name,
            status: {
              setupState: dbConn.setup_state || "unknown",
              syncState: dbConn.sync_state || "unknown",
              updateState: "unknown",
              isHistoricalSync: false,
            },
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    console.error("Error listing Fivetran connections:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list connections" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fivetran/connections
 * Create a new connection and get Connect Card URL
 * 
 * Body: { userId: string, service: "google_ads" | "facebook_ads" | "linkedin_ads", companyName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, service, companyName } = body;

    console.log("[Fivetran][POST /connections]", { userId, service, companyName });

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json(
        { error: "companyName is required" },
        { status: 400 }
      );
    }

    if (!service || !Object.values(FIVETRAN_SERVICES).includes(service)) {
      return NextResponse.json(
        { error: `Invalid service. Must be one of: ${Object.values(FIVETRAN_SERVICES).join(", ")}` },
        { status: 400 }
      );
    }

    const client = getFivetranClient();
    const schema = generateSchemaName(userId, service as FivetranService, companyName.trim());
    
    // Get the app URL for redirect
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/fivetran/callback`;

    const connection = await client.createConnection({
      service: service as FivetranService,
      schema,
      redirectUri,
    });

    // Persist connection mapping in our database
    await prisma.fivetran_connections.upsert({
      where: {
        fivetran_connector_id: connection.id,
      },
      update: {
        user_id: userId,
        company_name: companyName.trim(),
        service: connection.service,
        schema_name: connection.schema,
        setup_state: connection.status.setupState,
        sync_state: connection.status.syncState,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        company_name: companyName.trim(),
        fivetran_connector_id: connection.id,
        service: connection.service,
        schema_name: connection.schema,
        setup_state: connection.status.setupState,
        sync_state: connection.status.syncState,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        connectionId: connection.id,
        service: connection.service,
        schema: connection.schema,
        connectCardUrl: connection.connectCard?.uri,
        status: connection.status,
      },
    });
  } catch (error) {
    console.error("Error creating Fivetran connection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create connection" },
      { status: 500 }
    );
  }
}
