import crypto from "crypto";

const DEFAULT_META_API_VERSION = "v20.0";

export function getMetaApiVersion() {
  return process.env.META_API_VERSION || DEFAULT_META_API_VERSION;
}

export function getMetaAppId() {
  const v = process.env.META_APP_ID;
  if (!v) throw new Error("META_APP_ID is not set");
  return v;
}

export function getMetaAppSecret() {
  const v = process.env.META_APP_SECRET;
  if (!v) throw new Error("META_APP_SECRET is not set");
  return v;
}

export function getMetaOauthStateSecret() {
  const v = process.env.META_OAUTH_STATE_SECRET;
  if (!v) throw new Error("META_OAUTH_STATE_SECRET is not set");
  return v;
}

export function signMetaState(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json, "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getMetaOauthStateSecret())
    .update(data)
    .digest("base64url");

  return `${data}.${sig}`;
}

export function verifyMetaState(state: string): Record<string, unknown> {
  const [data, sig] = state.split(".");
  if (!data || !sig) throw new Error("Invalid state");

  const expected = crypto
    .createHmac("sha256", getMetaOauthStateSecret())
    .update(data)
    .digest("base64url");

  if (sig !== expected) throw new Error("Invalid state signature");

  const json = Buffer.from(data, "base64url").toString("utf8");
  return JSON.parse(json) as Record<string, unknown>;
}

async function metaFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error?.message || `Meta API error: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return json as T;
}

export async function exchangeCodeForAccessToken(params: {
  code: string;
  redirectUri: string;
}): Promise<{ access_token: string; token_type?: string; expires_in?: number }> {
  const version = getMetaApiVersion();
  const appId = getMetaAppId();
  const appSecret = getMetaAppSecret();

  const url = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("code", params.code);

  return metaFetch(url.toString());
}

export type MetaAdAccount = {
  id: string;
  name?: string;
  currency?: string;
  timezone_name?: string;
  account_status?: number;
};

export async function fetchMyAdAccounts(params: {
  accessToken: string;
}): Promise<MetaAdAccount[]> {
  const version = getMetaApiVersion();
  const url = new URL(`https://graph.facebook.com/${version}/me/adaccounts`);
  url.searchParams.set("access_token", params.accessToken);
  url.searchParams.set(
    "fields",
    "id,name,currency,timezone_name,account_status"
  );
  url.searchParams.set("limit", "200");

  const out: MetaAdAccount[] = [];
  let next: string | null = url.toString();

  while (next) {
    const page: { data?: MetaAdAccount[]; paging?: { next?: string } } = await metaFetch(next);
    out.push(...(page.data || []));
    next = page.paging?.next || null;
  }

  return out;
}

export type MetaInsightRow = {
  date_start: string;
  date_stop?: string;
  campaign_id?: string;
  campaign_name?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  publisher_platform?: string;
  impression_device?: string;
};

export async function fetchCampaignInsightsDaily(params: {
  accessToken: string;
  adAccountId: string; // "act_..."
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
  includeBreakdowns?: boolean;
}): Promise<MetaInsightRow[]> {
  const version = getMetaApiVersion();
  const url = new URL(`https://graph.facebook.com/${version}/${params.adAccountId}/insights`);

  url.searchParams.set("access_token", params.accessToken);
  url.searchParams.set("level", "campaign");
  url.searchParams.set("time_increment", "1");

  url.searchParams.set("time_range[since]", params.since);
  url.searchParams.set("time_range[until]", params.until);

  url.searchParams.set(
    "fields",
    [
      "date_start",
      "campaign_id",
      "campaign_name",
      "spend",
      "impressions",
      "clicks",
      "actions",
      "action_values",
      ...(params.includeBreakdowns ? ["publisher_platform", "impression_device"] : []),
    ].join(",")
  );

  if (params.includeBreakdowns) {
    url.searchParams.set("breakdowns", "publisher_platform,impression_device");
  }

  url.searchParams.set("limit", "500");

  const out: MetaInsightRow[] = [];
  let next: string | null = url.toString();

  while (next) {
    const page: { data?: MetaInsightRow[]; paging?: { next?: string } } = await metaFetch(next);
    out.push(...(page.data || []));
    next = page.paging?.next || null;
  }

  return out;
}

export function extractPreferredResults(actions?: { action_type: string; value: string }[]) {
  const list = actions || [];

  const preferredTypes = [
    "purchase",
    "omni_purchase",
    "offsite_conversion.purchase",
    "offsite_conversion.fb_pixel_purchase",
    "lead",
    "omni_lead",
  ];

  for (const t of preferredTypes) {
    const hit = list.find((a) => a.action_type === t);
    if (hit) return Number(hit.value || 0);
  }

  return list.reduce((sum, a) => sum + Number(a.value || 0), 0);
}

export function extractPreferredPurchaseValue(actionValues?: { action_type: string; value: string }[]) {
  const list = actionValues || [];

  const preferredValueTypes = [
    "purchase",
    "omni_purchase",
    "offsite_conversion.purchase",
    "offsite_conversion.fb_pixel_purchase",
  ];

  for (const t of preferredValueTypes) {
    const hit = list.find((a) => a.action_type === t);
    if (hit) return Number(hit.value || 0);
  }

  return 0;
}
