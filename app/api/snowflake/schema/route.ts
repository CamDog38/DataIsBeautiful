import { NextRequest, NextResponse } from "next/server";
import { getSnowflakeClient } from "@/lib/snowflake";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schema = searchParams.get("schema");
    const tablesParam = searchParams.get("tables");

    if (!schema) {
      return NextResponse.json(
        { success: false, error: "schema query parameter is required" },
        { status: 400 }
      );
    }

    const tables = tablesParam
      ? tablesParam
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const client = getSnowflakeClient();

    console.log("[Snowflake schema] Request:", { schema, tables });

    const rows = await client.getTableSchemaAggregated(schema, tables);

    return NextResponse.json({
      success: true,
      schema,
      filterTables: tables || null,
      tables: rows,
    });
  } catch (error) {
    console.error("[Snowflake schema] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch schema" },
      { status: 500 }
    );
  }
}
