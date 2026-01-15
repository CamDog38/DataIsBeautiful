import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForAccessToken,
  fetchMyAdAccounts,
  verifyMetaState,
  getMetaApiVersion,
} from "@/lib/meta";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const isSuccess = !error && !!code;

  const appUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = `${appUrl}/api/meta/oauth/callback`;

  let connectionId: string | null = null;
  let companyName: string | null = null;

  try {
    if (!isSuccess) {
      const errText = errorDescription || error || "OAuth cancelled";
      throw new Error(errText);
    }

    if (!state) {
      throw new Error("Missing state");
    }

    const payload = verifyMetaState(state);
    const userId = typeof payload.userId === "string" ? payload.userId : null;
    companyName = typeof payload.companyName === "string" ? payload.companyName : null;

    if (!userId || !companyName) {
      throw new Error("Invalid state payload");
    }

    const token = await exchangeCodeForAccessToken({ code: code as string, redirectUri });
    const tokenExpiresAt = typeof token.expires_in === "number" ? new Date(Date.now() + token.expires_in * 1000) : null;

    const grantedScopes = searchParams.get("granted_scopes") || searchParams.get("scope") || null;

    const connection = await (prisma as any)["meta_connections"].upsert({
      where: {
        user_id_company_name: {
          user_id: userId,
          company_name: companyName,
        },
      },
      update: {
        access_token: token.access_token,
        token_expires_at: tokenExpiresAt,
        scopes: grantedScopes,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        company_name: companyName,
        access_token: token.access_token,
        token_expires_at: tokenExpiresAt,
        scopes: grantedScopes,
      },
    });

    connectionId = connection.id;

    try {
      const accounts = await fetchMyAdAccounts({ accessToken: token.access_token });

      await Promise.all(
        accounts.map(async (a) => {
          const isActive = typeof a.account_status === "number" ? a.account_status === 1 : true;

          await (prisma as any)["meta_ad_accounts"].upsert({
            where: {
              connection_id_ad_account_id: {
                connection_id: connection.id,
                ad_account_id: a.id,
              },
            },
            update: {
              ad_account_name: a.name || null,
              currency: a.currency || null,
              timezone_name: a.timezone_name || null,
              is_active: isActive,
              updated_at: new Date(),
            },
            create: {
              connection_id: connection.id,
              ad_account_id: a.id,
              ad_account_name: a.name || null,
              currency: a.currency || null,
              timezone_name: a.timezone_name || null,
              is_active: isActive,
            },
          });
        })
      );
    } catch {
      // Token is stored; ad account fetch can be retried later when permissions/app config are ready.
    }

    const messagePayload = {
      source: "meta-oauth",
      type: "connection_complete",
      success: true,
      connectionId: connection.id,
      companyName,
      apiVersion: getMetaApiVersion(),
    };

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Meta Connected</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background: #0b1220; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; padding: 24px; }
      .card { width: 100%; max-width: 520px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; }
      h1 { font-size: 18px; margin-bottom: 8px; color: #fff; }
      p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
      .ok { margin-top: 16px; padding: 10px 12px; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.35); border-radius: 10px; color: #86efac; font-size: 13px; }
      .btn { margin-top: 16px; width: 100%; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: #fff; color: #0f172a; font-weight: 600; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Meta connected</h1>
      <p>You can close this tab and return to the app.</p>
      <div class="ok">Connection saved for <strong>${companyName}</strong>.</div>
      <button class="btn" onclick="window.close()">Close tab</button>
    </div>

    <script>
      try {
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(messagePayload)}, "*");
        }
      } catch (e) {}
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Meta OAuth failed";

    const messagePayload = {
      source: "meta-oauth",
      type: "connection_complete",
      success: false,
      error: msg,
      connectionId,
      companyName,
    };

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Meta Connection Failed</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background: #0b1220; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; padding: 24px; }
      .card { width: 100%; max-width: 520px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; }
      h1 { font-size: 18px; margin-bottom: 8px; color: #fff; }
      p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
      .err { margin-top: 16px; padding: 10px 12px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); border-radius: 10px; color: #fca5a5; font-size: 13px; white-space: pre-wrap; }
      .btn { margin-top: 16px; width: 100%; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: #fff; color: #0f172a; font-weight: 600; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Meta connection failed</h1>
      <p>Please close this tab and try again.</p>
      <div class="err">${msg}</div>
      <button class="btn" onclick="window.close()">Close tab</button>
    </div>

    <script>
      try {
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(messagePayload)}, "*");
        }
      } catch (e) {}
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }
}
