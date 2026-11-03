import {
  NVPLAY_ECB_CUSTOMER_ID,
  NVPLAY_WIDGET_AUTH_BASE,
  type NvplayWidgetAuth,
} from "@/lib/scrapers/sites/nvplay-ecb/config";

type AuthResponse = {
  CustomerId: string;
  ApiBaseUrl: string;
  AllowedWidgets: string[];
  UseJson: boolean;
};

/** Same handshake the NV Play widget runs before calling w-api.* scorecard APIs. */
export async function fetchNvplayEcbWidgetAuth(): Promise<NvplayWidgetAuth> {
  const url = `${NVPLAY_WIDGET_AUTH_BASE}/api/widgetauthorisation/${NVPLAY_ECB_CUSTOMER_ID}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestedWidgets: '["match-list","scorecard"]',
      type: "json",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`NV Play widget auth failed (${res.status})`);
  }
  const data = (await res.json()) as AuthResponse;
  return {
    customerId: data.CustomerId,
    apiBaseUrl: data.ApiBaseUrl,
    allowedWidgets: data.AllowedWidgets ?? [],
    useJson: Boolean(data.UseJson),
  };
}
