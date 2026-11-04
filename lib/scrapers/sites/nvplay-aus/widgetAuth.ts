import {
  NVPLAY_AUS_CUSTOMER_ID,
  NVPLAY_WIDGET_AUTH_BASE,
  type NvplayWidgetAuth,
} from "@/lib/scrapers/sites/nvplay-aus/config";

type AuthResponse = {
  CustomerId: string;
  ApiBaseUrl: string;
  AllowedWidgets: string[];
  UseJson: boolean;
};

export async function fetchNvplayAusWidgetAuth(): Promise<NvplayWidgetAuth> {
  const url = `${NVPLAY_WIDGET_AUTH_BASE}/api/widgetauthorisation/${NVPLAY_AUS_CUSTOMER_ID}`;
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
