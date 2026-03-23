const jaFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (date: string | number | Date) => {
  return jaFormatter.format(new Date(date));
};

export const formatTime = (date: string | number | Date) => {
  return timeFormatter.format(new Date(date));
};
