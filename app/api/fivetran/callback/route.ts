import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/fivetran/callback
 * 
 * This is the redirect URI that Fivetran Connect Card redirects to
 * after the user completes OAuth authentication.
 * 
 * Since the Connect Card opens in a new tab, we show a success/error message
 * and prompt the user to close the tab. The original tab polls for status changes.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Fivetran may pass these parameters after auth
  const success = searchParams.get("success");
  const connectionId = searchParams.get("connection_id");
  const error = searchParams.get("error");

  console.log("[Fivetran][callback]", { url: request.url, success, connectionId, error });

  // Build an HTML page that shows status and auto-closes or prompts to close
  // Treat any callback without an explicit error as success so we always trigger initial sync
  const isSuccess = !error;
  const statusMessage = error 
    ? `Connection failed: ${error}`
    : isSuccess 
      ? "Successfully connected! You can close this tab."
      : "Connection complete. You can close this tab.";

  const messagePayload = {
    source: "fivetran-connect-card",
    type: "connection_complete",
    success: isSuccess,
    error: error || null,
    connectionId,
  };
  
  const statusColor = error ? "#ef4444" : "#22c55e";
  const statusIcon = error 
    ? `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fivetran Connection</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
          }
          .icon { margin-bottom: 1.5rem; }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: ${statusColor};
          }
          p {
            color: #94a3b8;
            margin-bottom: 1.5rem;
          }
          .close-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          .close-btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${statusIcon}</div>
          <h1>${error ? "Connection Failed" : "Connected!"}</h1>
          <p>${statusMessage}</p>
          <button class="close-btn" onclick="window.close()">Close This Tab</button>
          <p style="margin-top: 1rem; font-size: 0.875rem;">
            If the tab doesn't close, you can close it manually.
          </p>
        </div>
        <script>
          // Notify the opener (main app) that the connection flow is complete
          try {
            if (window.opener && typeof window.opener.postMessage === "function") {
              window.opener.postMessage(
                ${JSON.stringify(messagePayload)},
                "*"
              );
            }
          } catch (e) {
            console.error("Failed to postMessage to opener", e);
          }

          // Try to close automatically after a short delay
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
