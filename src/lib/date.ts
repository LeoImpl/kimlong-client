const DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** "27 tháng 9, 2026", in Vietnam's time zone whatever the server's. */
export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}
