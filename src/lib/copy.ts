/**
 * Business claims repeated across the site, kept in one place so they always read the same. Both are the owner's
 * commitments (2026-10): change them here, not in the pages.
 */

/** The hotline answers around the clock, weekends and public holidays included. */
export const hotlineHours = {
  /** Next to the number, where space is tight. */
  short: "Hotline 24/7",
  /** On a phone's call button, under the number. */
  compact: "24/7, kể cả lễ và cuối tuần",
  full: "Hỗ trợ 24/7, kể cả cuối tuần và ngày lễ",
} as const;

/** Kim Long is the official distributor in Vietnam of the brands it shows. */
export const distributorClaim = {
  title: "Đại lý phân phối chính thức tại Việt Nam",
  description:
    "Kim Long là đại lý phân phối chính thức của các thương hiệu dưới đây — cam kết hàng chính hãng, đầy đủ chứng từ nguồn gốc.",
} as const;
