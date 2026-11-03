/** ECB Play-Cricket live scores — embedded NV Play widgets on live.nvplay.com/ecb/ */

export const NVPLAY_ECB_LIVE_URL = "https://live.nvplay.com/ecb/";

/** From `<nvplay customer-id="…">` on the ECB live scores page. */
export const NVPLAY_ECB_CUSTOMER_ID = "6cb09e4b-e702-4942-8760-659da2d1b3ff";

export const NVPLAY_WIDGET_AUTH_BASE = "https://w-auth.nvplay.com";

/** Populated after POST /api/widgetauthorisation/{customerId} (see widgetAuth.ts). */
export type NvplayWidgetAuth = {
  customerId: string;
  apiBaseUrl: string;
  allowedWidgets: string[];
  useJson: boolean;
};
