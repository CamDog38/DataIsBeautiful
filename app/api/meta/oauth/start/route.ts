import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMetaApiVersion, getMetaAppId, signMetaState } from "@/lib/meta";

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

    if (!companyName || !companyName.trim()) {
      return NextResponse.json({ success: false, error: "companyName is required" }, { status: 400 });
    }

    const appUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const redirectUri = `${appUrl}/api/meta/oauth/callback`;

    const state = signMetaState({
      userId: user.id,
      companyName: companyName.trim(),
      createdAt: Date.now(),
    });

    const version = getMetaApiVersion();
    const authUrl = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
    authUrl.searchParams.set("client_id", getMetaAppId());
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    const scopes = process.env.META_OAUTH_SCOPES || "email,public_profile";
    authUrl.searchParams.set("scope", scopes);

    return NextResponse.redirect(authUrl.toString());
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to start Meta OAuth";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
