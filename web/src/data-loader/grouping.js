import { normalizeMetricKey } from "./metrics";
import {
    sortNormalizedMediaItems,
    sortNormalizedWatchRecords,
    sortYearsAscending,
    sortYearsDescending
} from "./sorting";

export function groupRecordsByMediaId(records) {
    const groups = new Map();

    for (const record of Array.isArray(records) ? records : []) {
        if (!groups.has(record.mediaId)) {
            groups.set(record.mediaId, []);
        }

        groups.get(record.mediaId).push(record);
    }

    return groups;
}

export function buildCategoryGroups(mediaItems) {
    const groupsByCategory = new Map();

    for (const mediaItem of mediaItems) {
        const category = normalizeMetricKey(mediaItem.category);

        if (!groupsByCategory.has(category)) {
            groupsByCategory.set(category, {
                category,
                mediaItems: [],
                watchRecords: []
            });
        }

        const group = groupsByCategory.get(category);
        group.mediaItems.push(mediaItem);
        group.watchRecords.push(...mediaItem.watchRecords);
    }

    return Array.from(groupsByCategory.values())
        .map((group) => {
            const mediaItems = group.mediaItems.sort(sortNormalizedMediaItems);
            const watchRecords = group.watchRecords.sort(sortNormalizedWatchRecords);

            return {
                ...group,
                mediaItems,
                watchRecords,
                mediaItemCount: mediaItems.length,
                watchRecordCount: watchRecords.length,
                mediaItemsWithRecords: mediaItems.filter((mediaItem) => mediaItem.recordCount > 0).length,
                mediaItemsWithoutRecords: mediaItems.filter((mediaItem) => mediaItem.recordCount === 0).length
            };
        })
        .sort((left, right) => left.category.localeCompare(right.category));
}

export function buildYearGroups(watchRecords, options = {}) {
    const { preserveRecordOrder = false, yearDirection = "desc" } = options;
    const groupsByYear = new Map();

    for (const record of watchRecords) {
        const year = record.year;

        if (!groupsByYear.has(year)) {
            groupsByYear.set(year, {
                year,
                records: [],
                linkedWatchRecords: 0,
                orphanWatchRecords: 0
            });
        }

        const group = groupsByYear.get(year);
        group.records.push(record);

        if (record.relationshipStatus === "orphan") {
            group.orphanWatchRecords += 1;
        } else {
            group.linkedWatchRecords += 1;
        }
    }

    return Array.from(groupsByYear.values())
        .map((group) => ({
            ...group,
            count: group.records.length,
            records: preserveRecordOrder ? group.records : group.records.sort(sortNormalizedWatchRecords)
        }))
        .sort((left, right) =>
            yearDirection === "asc"
                ? sortYearsAscending(left.year, right.year)
                : sortYearsDescending(left.year, right.year)
        );
}
