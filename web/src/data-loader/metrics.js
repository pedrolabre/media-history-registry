import { sortTextAscending, sortYearsDescending } from "./sorting";

export function buildNormalizedMetrics({ mediaItems, watchRecords, linkedWatchRecords, orphanWatchRecords }) {
    return {
        byYear: countBy(watchRecords, (record) => record.year, sortYearsDescending).map((item) => ({
            year: item.key,
            count: item.count
        })),
        byCategory: buildCategoryMetrics({ mediaItems, linkedWatchRecords, orphanWatchRecords }),
        byWatchStatus: countBy(watchRecords, (record) => record.watchStatus, sortTextAscending),
        byProductionStatus: countBy(
            mediaItems,
            (mediaItem) => mediaItem.productionStatus,
            sortTextAscending
        ),
        linkedWatchRecordsByProductionStatus: countBy(
            linkedWatchRecords,
            (record) => record.productionStatus,
            sortTextAscending
        )
    };
}

export function normalizeMetricKey(value) {
    return value === null || value === undefined || value === "" ? "unknown" : value;
}

function buildCategoryMetrics({ mediaItems, linkedWatchRecords, orphanWatchRecords }) {
    const categoryCounts = new Map();

    for (const mediaItem of mediaItems) {
        const count = ensureMetricCount(categoryCounts, mediaItem.category);
        count.mediaItems += 1;
    }

    for (const watchRecord of linkedWatchRecords) {
        const count = ensureMetricCount(categoryCounts, watchRecord.category);
        count.watchRecords += 1;
    }

    if (orphanWatchRecords.length > 0) {
        const count = ensureMetricCount(categoryCounts, "sem-midia");
        count.watchRecords += orphanWatchRecords.length;
    }

    return Array.from(categoryCounts.values()).sort((left, right) =>
        left.category.localeCompare(right.category)
    );
}

function ensureMetricCount(metricMap, key) {
    const metricKey = normalizeMetricKey(key);

    if (!metricMap.has(metricKey)) {
        metricMap.set(metricKey, {
            category: metricKey,
            mediaItems: 0,
            watchRecords: 0
        });
    }

    return metricMap.get(metricKey);
}

function countBy(values, getKey, sorter) {
    const counts = new Map();

    for (const value of values) {
        const key = normalizeMetricKey(getKey(value));
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts, ([key, count]) => ({ key, count })).sort((left, right) =>
        sorter(left.key, right.key)
    );
}
