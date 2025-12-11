import { NextResponse } from "next/server";
import { getSnowflakeClient } from "@/lib/snowflake";

export async function GET() {
  try {
    const client = getSnowflakeClient();
    const result = await client.testConnection();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
