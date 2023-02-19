// Create a new Intl.RelativeTimeFormat object using the default locale
const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});
const formatterWithYear = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * Format a date as a relative time.
 * E.g.: "Just now", "2m ago", "3h ago", "Jan 14", "Jun 3 2022"
 * @param date The date to format
 * @param now Defaults to `new Date()`. Set this to a fixed date for testing.
 */
export const formatRelativeTime = (date: Date, now = new Date()): string => {
  const timeDiff = now.getTime() - date.getTime();

  const minutes = timeDiff / (1000 * 60);

  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${Math.floor(minutes)}m ago`;
  }
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  if (now.getFullYear() === date.getFullYear()) {
    // Like "Jan 14"
    return formatter.format(date);
  }
  // Like "Jun 3 2022"
  // And remove the comma after the month
  return formatterWithYear.format(date).replace(",", "");
};
