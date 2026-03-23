const longDateFormatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

const toDate = (value: string | Date): Date => {
    return value instanceof Date ? value : new Date(value);
};

export const formatLongDateJa = (value: string | Date): string => {
    return longDateFormatter.format(toDate(value));
};

export const formatTimeJa = (value: string | Date): string => {
    return timeFormatter.format(toDate(value));
};

export const toIsoDateTime = (value: string | Date): string => {
    return toDate(value).toISOString();
};

export const formatRelativeFromNowJa = (value: string | Date): string => {
    const now = Date.now();
    const timestamp = toDate(value).getTime();
    const diffInSeconds = (timestamp - now) / 1000;
    const absSeconds = Math.abs(diffInSeconds);

    const suffix = diffInSeconds < 0 ? "前" : "後";

    if (absSeconds < 45) {
        return `数秒${suffix}`;
    }
    if (absSeconds < 90) {
        return `1分${suffix}`;
    }

    const minutes = Math.round(absSeconds / 60);
    if (absSeconds < 45 * 60) {
        return `${minutes}分${suffix}`;
    }
    if (absSeconds < 90 * 60) {
        return `1時間${suffix}`;
    }

    const hours = Math.round(absSeconds / 3600);
    if (absSeconds < 22 * 3600) {
        return `${hours}時間${suffix}`;
    }
    if (absSeconds < 36 * 3600) {
        return `1日${suffix}`;
    }

    const days = Math.round(absSeconds / 86400);
    if (absSeconds < 25 * 86400) {
        return `${days}日${suffix}`;
    }
    if (absSeconds < 45 * 86400) {
        return `1ヶ月${suffix}`;
    }

    const months = Math.round(days / 30);
    if (absSeconds < 345 * 86400) {
        return `${months}ヶ月${suffix}`;
    }
    if (absSeconds < 545 * 86400) {
        return `1年${suffix}`;
    }

    const years = Math.round(days / 365);
    return `${years}年${suffix}`;
};
