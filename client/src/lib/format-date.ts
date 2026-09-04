const printDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

export function formatPrintDate(iso: string): string {
  return printDateFormatter.format(new Date(iso));
}
