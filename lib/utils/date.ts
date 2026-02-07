export const formatDateTime = (date: Date, locale: string = "en") => {
  const localeTag = locale === "ar" ? "ar-EG" : "en-GB";
  const formatted = new Intl.DateTimeFormat(localeTag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);

  return formatted.replace(", ", " • ");
};
