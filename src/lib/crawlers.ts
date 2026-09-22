import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

/**
 * User agents that get blocking metadata (`htmlLimitedBots`): Next's own list of crawlers that read `<head>`
 * without running JavaScript, plus the ones that matter in Vietnam and are not on it.
 *
 * Why not simply every user agent (`/.*\/`, which this app used to do): a "bot" request is rendered in full,
 * prefetches included, and the client router stores a prefetch as the route's shared shell. Product pages then
 * showed whichever product was prefetched last, whatever link was clicked. Only real crawlers may match here.
 *
 * - Zalo's link preview crawler runs no JavaScript, so without this a product shared on Zalo is a bare link.
 *   Zalo's in-app browser also says "Zalo", but always with "ZaloTheme"; it is a real browser and must not match.
 * - Cốc Cốc is the Vietnamese browser/search engine; Telegram and Viber build link previews the same way.
 */
const VIETNAM_CRAWLERS = /^(?!.*ZaloTheme).*\bZalo|coccocbot|TelegramBot|Viber/i;

export const HTML_LIMITED_BOTS = new RegExp(
  `${HTML_LIMITED_BOT_UA_RE.source}|${VIETNAM_CRAWLERS.source}`,
  "i",
);
