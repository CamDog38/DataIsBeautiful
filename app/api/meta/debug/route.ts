import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMetaApiVersion, getMetaAppId, getMetaAppSecret } from "@/lib/meta";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

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

    const connection = await (prisma as any)["meta_connections"].findFirst({
      where: {
        user_id: user.id,
        ...(companyName ? { company_name: companyName } : {}),
      },
      orderBy: { updated_at: "desc" },
    });

    if (!connection) {
      return NextResponse.json({ success: false, error: "No Meta connection found" }, { status: 404 });
    }

    const version = getMetaApiVersion();
    const accessToken: string = connection.access_token;

    const appAccessToken = `${getMetaAppId()}|${getMetaAppSecret()}`;

    const debugTokenUrl = new URL(`https://graph.facebook.com/${version}/debug_token`);
    debugTokenUrl.searchParams.set("input_token", accessToken);
    debugTokenUrl.searchParams.set("access_token", appAccessToken);

    const permissionsUrl = new URL(`https://graph.facebook.com/${version}/me/permissions`);
    permissionsUrl.searchParams.set("access_token", accessToken);

    const adAccountsUrl = new URL(`https://graph.facebook.com/${version}/me/adaccounts`);
    adAccountsUrl.searchParams.set("access_token", accessToken);
    adAccountsUrl.searchParams.set("fields", "id,name,account_status,currency,timezone_name");
    adAccountsUrl.searchParams.set("limit", "25");

    const [debugTokenRes, permissionsRes, adAccountsRes] = await Promise.all([
      fetch(debugTokenUrl.toString(), { cache: "no-store" }),
      fetch(permissionsUrl.toString(), { cache: "no-store" }),
      fetch(adAccountsUrl.toString(), { cache: "no-store" }),
    ]);

    const [debugTokenJson, permissionsJson, adAccountsJson] = await Promise.all([
      safeJson(debugTokenRes),
      safeJson(permissionsRes),
      safeJson(adAccountsRes),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        connection: {
          id: connection.id,
          company_name: connection.company_name,
          scopes_saved: connection.scopes,
          token_expires_at: connection.token_expires_at,
          updated_at: connection.updated_at,
        },
        debug_token: {
          ok: debugTokenRes.ok,
          status: debugTokenRes.status,
          body: debugTokenJson,
        },
        me_permissions: {
          ok: permissionsRes.ok,
          status: permissionsRes.status,
          body: permissionsJson,
        },
        me_adaccounts: {
          ok: adAccountsRes.ok,
          status: adAccountsRes.status,
          body: adAccountsJson,
        },
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to debug Meta access";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
