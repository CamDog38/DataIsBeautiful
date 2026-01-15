import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  extractPreferredPurchaseValue,
  extractPreferredResults,
  fetchCampaignInsightsDaily,
} from "@/lib/meta";

type MetaAdAccountRow = {
  id: string;
  ad_account_id: string;
  ad_account_name: string | null;
  is_active: boolean;
};

function asDateOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const adAccountIds: string[] | null = Array.isArray(body.adAccountIds)
    ? body.adAccountIds.filter((x: any) => typeof x === "string")
    : null;

  const startDate = asDateOnly(body.startDate);
  const endDate = asDateOnly(body.endDate);

  if (!companyName) {
    return NextResponse.json({ success: false, error: "companyName is required" }, { status: 400 });
  }

  if (!startDate || !endDate) {
    return NextResponse.json(
      { success: false, error: "startDate and endDate are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const connection = await (prisma as any)["meta_connections"].findUnique({
    where: {
      user_id_company_name: {
        user_id: user.id,
        company_name: companyName,
      },
    },
    include: { meta_ad_accounts: true },
  });

  if (!connection) {
    return NextResponse.json(
      { success: false, error: "No Meta connection found for this company" },
      { status: 404 }
    );
  }

  const accounts = (connection.meta_ad_accounts as MetaAdAccountRow[]).filter((a) => a.is_active);
  const selectedAccounts = adAccountIds
    ? accounts.filter((a: MetaAdAccountRow) => adAccountIds.includes(a.ad_account_id))
    : accounts;

  if (selectedAccounts.length === 0) {
    return NextResponse.json(
      { success: false, error: "No active ad accounts found for this connection" },
      { status: 400 }
    );
  }

  const syncRun = await (prisma as any)["meta_sync_runs"].create({
    data: {
      connection_id: connection.id,
      status: "running",
      requested_start_date: new Date(startDate),
      requested_end_date: new Date(endDate),
    },
  });

  let rowsUpserted = 0n;

  try {
    for (const acct of selectedAccounts) {
      const insights = await fetchCampaignInsightsDaily({
        accessToken: connection.access_token,
        adAccountId: acct.ad_account_id,
        since: startDate,
        until: endDate,
        includeBreakdowns: true,
      });

      for (const row of insights) {
        const date = row.date_start;
        const campaignId = row.campaign_id || "";
        if (!date || !campaignId) continue;

        const spend = Number(row.spend || 0);
        const impressions = BigInt(Number(row.impressions || 0));
        const clicks = BigInt(Number(row.clicks || 0));

        const results = BigInt(extractPreferredResults(row.actions));
        const purchaseValue = extractPreferredPurchaseValue(row.action_values);

        await (prisma as any)["meta_campaign_insights_daily"].upsert({
          where: {
            connection_id_meta_ad_account_id_date_campaign_id_publisher_platform_impression_device: {
              connection_id: connection.id,
              meta_ad_account_id: acct.id,
              date: new Date(date),
              campaign_id: campaignId,
              publisher_platform: row.publisher_platform || null,
              impression_device: row.impression_device || null,
            },
          },
          update: {
            campaign_name: row.campaign_name || null,
            spend: spend.toString(),
            impressions,
            clicks,
            results,
            purchase_value: purchaseValue.toString(),
            updated_at: new Date(),
          },
          create: {
            connection_id: connection.id,
            meta_ad_account_id: acct.id,
            date: new Date(date),
            campaign_id: campaignId,
            campaign_name: row.campaign_name || null,
            publisher_platform: row.publisher_platform || null,
            impression_device: row.impression_device || null,
            spend: spend.toString(),
            impressions,
            clicks,
            results,
            purchase_value: purchaseValue.toString(),
          },
        });

        rowsUpserted += 1n;
      }
    }

    await (prisma as any)["meta_sync_runs"].update({
      where: { id: syncRun.id },
      data: {
        status: "success",
        finished_at: new Date(),
        rows_upserted: rowsUpserted,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        connectionId: connection.id,
        companyName,
        startDate,
        endDate,
        adAccountsSynced: selectedAccounts.map((a) => ({
          id: a.id,
          ad_account_id: a.ad_account_id,
          ad_account_name: a.ad_account_name,
        })),
        rowsUpserted: rowsUpserted.toString(),
        syncRunId: syncRun.id,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Meta sync failed";

    await (prisma as any)["meta_sync_runs"].update({
      where: { id: syncRun.id },
      data: {
        status: "error",
        finished_at: new Date(),
        error_message: message,
        rows_upserted: rowsUpserted,
      },
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
