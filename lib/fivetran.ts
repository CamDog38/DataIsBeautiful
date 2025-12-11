/**
 * Fivetran API Client
 * 
 * This client handles communication with the Fivetran REST API for:
 * - Creating connections (connectors) for Google Ads, Meta Ads, LinkedIn Ads
 * - Generating Connect Card URLs for user OAuth authentication
 * - Managing connection status and syncs
 * 
 * @see https://fivetran.com/docs/rest-api/powered-by-fivetran/detailed-guide
 */

const FIVETRAN_API_URL = "https://api.fivetran.com/v1";

// Supported ad platform services in Fivetran
export const FIVETRAN_SERVICES = {
  GOOGLE_ADS: "google_ads",
  META_ADS: "facebook_ads", // Fivetran uses "facebook_ads" for Meta
  LINKEDIN_ADS: "linkedin_ads",
} as const;

export type FivetranService = typeof FIVETRAN_SERVICES[keyof typeof FIVETRAN_SERVICES];

// Service display info for UI
export const SERVICE_INFO: Record<FivetranService, { name: string; icon: string; color: string }> = {
  [FIVETRAN_SERVICES.GOOGLE_ADS]: {
    name: "Google Ads",
    icon: "google",
    color: "#4285F4",
  },
  [FIVETRAN_SERVICES.META_ADS]: {
    name: "Meta Ads",
    icon: "meta",
    color: "#0081FB",
  },
  [FIVETRAN_SERVICES.LINKEDIN_ADS]: {
    name: "LinkedIn Ads",
    icon: "linkedin",
    color: "#0A66C2",
  },
};

interface FivetranConfig {
  apiKey: string;
  apiSecret: string;
  groupId: string;
}

interface CreateConnectionParams {
  service: FivetranService;
  schema: string; // Unique schema name for this connection (e.g., user_id_google_ads)
  redirectUri: string; // Where to redirect after Connect Card auth
}

interface ConnectionResponse {
  id: string;
  groupId: string;
  service: string;
  schema: string;
  status: {
    setupState: string;
    syncState: string;
    updateState: string;
    isHistoricalSync: boolean;
  };
  connectCard?: {
    token: string;
    uri: string;
  };
}

interface ConnectCardResponse {
  connectorId: string;
  connectCard: {
    token: string;
    uri: string;
  };
}

class FivetranClient {
  private apiKey: string;
  private apiSecret: string;
  private groupId: string;
  private authHeader: string;

  constructor(config: FivetranConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.groupId = config.groupId;
    // Fivetran uses Basic Auth with base64 encoded "apiKey:apiSecret"
    this.authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64")}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${FIVETRAN_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": this.authHeader,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Fivetran API error: ${response.status} ${response.statusText}`
      );
    }

    return data;
  }

  /**
   * Create a new connection (connector) with Connect Card config
   * This creates the connection and returns a Connect Card URL for user auth
   */
  async createConnection(params: CreateConnectionParams): Promise<ConnectionResponse> {
    const { service, schema, redirectUri } = params;

    const payload = {
      service,
      group_id: this.groupId,
      config: {
        schema,
      },
      // Don't run setup tests until user authenticates via Connect Card
      run_setup_tests: false,
      paused: false,
      connect_card_config: {
        redirect_uri: redirectUri,
      },
    };

    const response = await this.request<{ code: string; data: any }>("/connections", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return this.mapConnectionResponse(response.data);
  }

  /**
   * Get Connect Card URL for an existing connection
   * Use this to re-authenticate or update credentials
   */
  async getConnectCardUrl(
    connectionId: string,
    redirectUri: string
  ): Promise<ConnectCardResponse> {
    const payload = {
      connect_card_config: {
        redirect_uri: redirectUri,
      },
    };

    const response = await this.request<{ code: string; data: any }>(
      `/connections/${connectionId}/connect-card`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    return {
      connectorId: response.data.connector_id,
      connectCard: {
        token: response.data.connect_card.token,
        uri: response.data.connect_card.uri,
      },
    };
  }

  /**
   * Get connection details by ID
   */
  async getConnection(connectionId: string): Promise<ConnectionResponse> {
    const response = await this.request<{ code: string; data: any }>(
      `/connections/${connectionId}`
    );

    return this.mapConnectionResponse(response.data);
  }

  /**
   * List all connections in the group
   */
  async listConnections(): Promise<ConnectionResponse[]> {
    const response = await this.request<{ code: string; data: { items: any[] } }>(
      `/groups/${this.groupId}/connections`
    );

    return response.data.items.map(this.mapConnectionResponse);
  }

  /**
   * List connections for a specific user (by schema prefix)
   */
  async listUserConnections(userSchemaPrefix: string): Promise<ConnectionResponse[]> {
    const allConnections = await this.listConnections();
    return allConnections.filter((conn) => conn.schema.startsWith(userSchemaPrefix));
  }

  /**
   * Trigger a manual sync for a connection
   */
  async triggerSync(connectionId: string): Promise<void> {
    await this.request(`/connections/${connectionId}/force`, {
      method: "POST",
    });
  }

  /**
   * Unpause a connection (start syncing)
   */
  async unpauseConnection(connectionId: string): Promise<void> {
    await this.request(`/connections/${connectionId}`, {
      method: "PATCH",
      body: JSON.stringify({ paused: false }),
    });
  }

  /**
   * Pause a connection (stop syncing)
   */
  async pauseConnection(connectionId: string): Promise<void> {
    await this.request(`/connections/${connectionId}`, {
      method: "PATCH",
      body: JSON.stringify({ paused: true }),
    });
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      await this.request(`/connections/${connectionId}`, {
        method: "DELETE",
      });
    } catch (error) {
      // If the connector is already deleted or cannot be found in Fivetran,
      // we treat this as a successful delete from the app's perspective.
      if (
        error instanceof Error &&
        error.message.includes("Cannot find entity 'Connector'")
      ) {
        console.warn(
          `Fivetran connector ${connectionId} not found when deleting; treating as already deleted.`
        );
        return;
      }

      // Re-throw all other errors so they can be surfaced to the caller
      throw error;
    }
  }

  /**
   * Get available connector types metadata
   */
  async getConnectorMetadata(): Promise<any[]> {
    const response = await this.request<{ code: string; data: { items: any[] } }>(
      "/metadata/connectors"
    );
    return response.data.items;
  }

  private mapConnectionResponse(data: any): ConnectionResponse {
    return {
      id: data.id,
      groupId: data.group_id,
      service: data.service,
      schema: data.schema,
      status: {
        setupState: data.status?.setup_state || "unknown",
        syncState: data.status?.sync_state || "unknown",
        updateState: data.status?.update_state || "unknown",
        isHistoricalSync: data.status?.is_historical_sync || false,
      },
      connectCard: data.connect_card
        ? {
            token: data.connect_card.token,
            uri: data.connect_card.uri,
          }
        : undefined,
    };
  }
}

// Singleton instance
let fivetranClient: FivetranClient | null = null;

/**
 * Get the Fivetran client instance
 * Throws if environment variables are not configured
 */
export function getFivetranClient(): FivetranClient {
  if (fivetranClient) {
    return fivetranClient;
  }

  const apiKey = process.env.FIVETRAN_API_KEY;
  const apiSecret = process.env.FIVETRAN_API_SECRET;
  const groupId = process.env.FIVETRAN_GROUP_ID;

  if (!apiKey || !apiSecret || !groupId) {
    throw new Error(
      "Fivetran configuration missing. Please set FIVETRAN_API_KEY, FIVETRAN_API_SECRET, and FIVETRAN_GROUP_ID environment variables."
    );
  }

  fivetranClient = new FivetranClient({
    apiKey,
    apiSecret,
    groupId,
  });

  return fivetranClient;
}

/**
 * Generate a unique schema name for a user's connection
 * Format: user_{last4UserId}_{sanitizedCompanyName}_{service}
 * 
 * @param userId - The full user ID (we use last 4 characters)
 * @param companyName - The company/client name for this wrap
 * @param service - The Fivetran service type (google_ads, facebook_ads, etc.)
 */
export function generateSchemaName(
  userId: string,
  service: FivetranService,
  companyName?: string
): string {
  // Fivetran schemas must be lowercase, alphanumeric with underscores
  // Use last 4 characters of userId for brevity
  const last4 = userId.slice(-4).toLowerCase().replace(/[^a-z0-9]/g, "");
  
  if (companyName) {
    // Sanitize company name: lowercase, replace spaces/special chars with underscores
    const sanitizedCompany = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_") // collapse multiple underscores
      .replace(/^_|_$/g, ""); // trim leading/trailing underscores
    
    return `user_${last4}_${sanitizedCompany}_${service}`;
  }
  
  // Fallback for legacy connections without company name
  const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return `user_${sanitizedUserId}_${service}`;
}

export { FivetranClient };
export type { ConnectionResponse, ConnectCardResponse, CreateConnectionParams };
