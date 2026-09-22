import { describe, expect, it } from "vitest";
import { HTML_LIMITED_BOTS } from "./crawlers";

const browsers = {
  chrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  zaloInAppAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 Zalo android/12100612 ZaloTheme/light ZaloLanguage/vi",
  zaloInAppIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/569 ZaloTheme/dark ZaloLanguage/vi",
  coccocBrowser:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/140.0.0 Chrome/140.0.0.0 Safari/537.36",
};

const crawlers = {
  zaloPreview: "Mozilla/5.0 (compatible; Zalo/1.0; +https://zalo.me)",
  facebook: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  coccocbot: "Mozilla/5.0 (compatible; coccocbot-web/1.0; +http://help.coccoc.com/searchengine)",
  telegram: "TelegramBot (like TwitterBot)",
  twitter: "Twitterbot/1.0",
};

describe("HTML_LIMITED_BOTS", () => {
  it("never matches a real browser — a match breaks client-side navigation between products", () => {
    for (const [name, ua] of Object.entries(browsers)) {
      expect(HTML_LIMITED_BOTS.test(ua), name).toBe(false);
    }
  });

  it("matches the link preview and search crawlers that read <head> without JavaScript", () => {
    for (const [name, ua] of Object.entries(crawlers)) {
      expect(HTML_LIMITED_BOTS.test(ua), name).toBe(true);
    }
  });
});
