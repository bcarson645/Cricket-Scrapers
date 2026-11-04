/** Cricket Australia / Play-Cricket on live.nvplay.com/play/ */

export const NVPLAY_AUS_LIVE_URL = "https://live.nvplay.com/play/";

export const NVPLAY_AUS_CUSTOMER_ID = "ee69e6e7-7dbd-43d8-9095-c36d22fd9b3a";

export const NVPLAY_WIDGET_AUTH_BASE = "https://w-auth.nvplay.com";

export type NvplayWidgetAuth = {
  customerId: string;
  apiBaseUrl: string;
  allowedWidgets: string[];
  useJson: boolean;
};
