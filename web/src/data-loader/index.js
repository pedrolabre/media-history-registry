const mediaModules = import.meta.glob("../../../data/media/**/*.json", {
    eager: true,
    import: "default"
});

const historyModules = import.meta.glob("../../../data/history/**/*.json", {
    eager: true,
    import: "default"
});

export const staticLibraryData = buildStaticLibraryData({
    mediaModules,
    historyModules
});

export function buildStaticLibraryData({ mediaModules, historyModules }) {
    const errors = [];
    const mediaItems = collectEntries({
        modules: mediaModules,
        parsePath: parseMediaPath,
        type: "media",
        errors
    });
    const watchRecords = collectEntries({
        modules: historyModules,
        parsePath: parseHistoryPath,
        type: "history",
        errors
    });
    const categories = uniqueSorted(mediaItems.map((entry) => entry.origin.category));
    const years = uniqueSorted(watchRecords.map((entry) => entry.origin.year), sortYearsDescending);
    const normalized = buildNormalizedLibrary({ mediaItems, watchRecords });

    return {
        ok: errors.length === 0,
        status: errors.length === 0 ? "ready" : "error",
        mediaItems,
        watchRecords,
        categories,
        years,
        counts: {
            mediaItems: mediaItems.length,
            watchRecords: watchRecords.length,
            categories: categories.length,
            years: years.length
        },
        errors,
        normalized
    };
}

export function buildNormalizedLibrary({ mediaItems, watchRecords }) {
    const mediaById = new Map();
    const normalizedMediaItems = mediaItems
        .map((entry) => {
            const mediaItem = {
                id: entry.value.id,
                title: entry.value.title,
                category: entry.value.category,
                productionStatus: entry.value.status,
                origin: entry.origin,
                value: entry.value,
                watchRecords: []
            };

            if (typeof mediaItem.id === "string" && !mediaById.has(mediaItem.id)) {
                mediaById.set(mediaItem.id, mediaItem);
            }

            return mediaItem;
        })
        .sort(sortNormalizedMediaItems);

    const normalizedWatchRecords = watchRecords.map((entry) => {
        const watchRecord = entry.value;
        const mediaItem = mediaById.get(watchRecord.media_id) || null;
        const normalizedRecord = {
            id: watchRecord.id,
            mediaId: watchRecord.media_id,
            title: mediaItem?.title || watchRecord.media_id,
            year: watchRecord.year,
            category: mediaItem?.category || null,
            watchStatus: watchRecord.watch_status,
            productionStatus: mediaItem?.productionStatus || null,
            unitLabel: deriveUnitLabel(watchRecord.unit),
            relationshipStatus: mediaItem ? "linked" : "orphan",
            media: mediaItem ? summarizeMediaItem(mediaItem) : null,
            origin: entry.origin,
            value: watchRecord
        };

        if (mediaItem) {
            mediaItem.watchRecords.push(normalizedRecord);
        }

        return normalizedRecord;
    });

    normalizedWatchRecords.sort(sortNormalizedWatchRecords);

    for (const mediaItem of normalizedMediaItems) {
        mediaItem.watchRecords.sort(sortNormalizedWatchRecords);
    }

    const linkedWatchRecords = normalizedWatchRecords.filter(
        (record) => record.relationshipStatus === "linked"
    );
    const orphanWatchRecords = normalizedWatchRecords.filter(
        (record) => record.relationshipStatus === "orphan"
    );

    return {
        mediaItems: normalizedMediaItems,
        watchRecords: normalizedWatchRecords,
        linkedWatchRecords,
        orphanWatchRecords,
        relationships: {
            mediaItems: normalizedMediaItems.length,
            watchRecords: normalizedWatchRecords.length,
            linkedWatchRecords: linkedWatchRecords.length,
            orphanWatchRecords: orphanWatchRecords.length
        },
        metrics: buildNormalizedMetrics({
            mediaItems: normalizedMediaItems,
            watchRecords: normalizedWatchRecords,
            linkedWatchRecords,
            orphanWatchRecords
        })
    };
}

export function deriveUnitLabel(unit) {
    if (!unit || typeof unit.type !== "string") {
        return "UN";
    }

    switch (unit.type) {
        case "season":
            return `S${padUnitNumber(unit.season_number)}`;
        case "limited_season":
            return "LS";
        case "episode":
            return unit.season_number
                ? `S${padUnitNumber(unit.season_number)}E${padUnitNumber(unit.episode_number)}`
                : `E${padUnitNumber(unit.episode_number)}`;
        case "arc":
            return "ARC";
        case "movie":
            return "MOV";
        case "special":
            return "SP";
        case "full_work":
            return "FW";
        case "unspecified":
            return "UN";
        default:
            return "UN";
    }
}

function buildNormalizedMetrics({ mediaItems, watchRecords, linkedWatchRecords, orphanWatchRecords }) {
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

function summarizeMediaItem(mediaItem) {
    return {
        id: mediaItem.id,
        title: mediaItem.title,
        category: mediaItem.category,
        status: mediaItem.productionStatus,
        origin: mediaItem.origin
    };
}

function sortNormalizedMediaItems(left, right) {
    return (
        String(left.title).localeCompare(String(right.title)) ||
        String(left.id).localeCompare(String(right.id))
    );
}

function sortNormalizedWatchRecords(left, right) {
    return (
        sortYearsDescending(left.year, right.year) ||
        String(left.title).localeCompare(String(right.title)) ||
        String(left.unitLabel).localeCompare(String(right.unitLabel)) ||
        String(left.id).localeCompare(String(right.id))
    );
}

function normalizeMetricKey(value) {
    return value === null || value === undefined || value === "" ? "unknown" : value;
}

function padUnitNumber(value) {
    return String(Number.isInteger(value) ? value : 0).padStart(2, "0");
}

function collectEntries({ modules, parsePath, type, errors }) {
    return Object.entries(modules)
        .map(([modulePath, value]) => {
            const origin = parsePath(modulePath, errors);

            if (!origin) {
                return null;
            }

            return {
                type,
                origin,
                value
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.origin.path.localeCompare(right.origin.path));
}

function parseMediaPath(modulePath, errors) {
    const path = toRepositoryDataPath(modulePath);
    const match = /^data\/media\/([^/]+)\/([^/]+\.json)$/.exec(path);

    if (!match) {
        errors.push({
            path,
            message: "Media Item deve estar em data/media/{category}/{filename}.json."
        });
        return null;
    }

    const [, category, filename] = match;

    return {
        path,
        category,
        filename,
        fileId: removeJsonExtension(filename)
    };
}

function parseHistoryPath(modulePath, errors) {
    const path = toRepositoryDataPath(modulePath);
    const match = /^data\/history\/([^/]+)\/([^/]+\.json)$/.exec(path);

    if (!match) {
        errors.push({
            path,
            message: "Watch Record deve estar em data/history/{year}/{filename}.json."
        });
        return null;
    }

    const [, yearText, filename] = match;

    if (!/^[0-9]{4}$/.test(yearText)) {
        errors.push({
            path,
            message: "O ano do path de Watch Record deve ter quatro digitos."
        });
        return null;
    }

    return {
        path,
        year: Number(yearText),
        filename,
        fileId: removeJsonExtension(filename)
    };
}

function toRepositoryDataPath(modulePath) {
    const normalizedPath = modulePath.replace(/\\/g, "/");
    const dataPathStart = normalizedPath.indexOf("data/");

    return dataPathStart >= 0 ? normalizedPath.slice(dataPathStart) : normalizedPath;
}

function removeJsonExtension(filename) {
    return filename.replace(/\.json$/, "");
}

function uniqueSorted(values, sorter = sortTextAscending) {
    return Array.from(new Set(values)).sort(sorter);
}

function sortTextAscending(left, right) {
    return String(left).localeCompare(String(right));
}

function sortYearsDescending(left, right) {
    return right - left;
}
