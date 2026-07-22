import { buildCategoryGroups, buildYearGroups } from "./grouping";
import { buildNormalizedMetrics } from "./metrics";
import { sortNormalizedMediaItems, sortNormalizedWatchRecords } from "./sorting";
import { deriveUnitLabel } from "./unitLabels";

export function buildNormalizedLibrary({ mediaItems, watchRecords }) {
    const mediaById = new Map();
    const normalizedMediaItems = mediaItems
        .map((entry) => {
            const mediaItem = {
                id: entry.value.id,
                title: entry.value.title,
                originalTitle: normalizeOptionalText(entry.value.original_title),
                category: entry.value.category,
                subcategories: normalizeStringArray(entry.value.subcategories),
                genres: normalizeStringArray(entry.value.genres),
                countries: normalizeStringArray(entry.value.countries),
                studios: normalizeStringArray(entry.value.studios),
                directors: normalizeStringArray(entry.value.directors),
                format: entry.value.format,
                productionStatus: entry.value.status,
                firstReleaseYear: normalizeOptionalYear(entry.value.first_release_year),
                externalIds: normalizeExternalIds(entry.value.external_ids),
                poster: normalizeOptionalText(entry.value.poster),
                notes: normalizeOptionalText(entry.value.notes),
                origin: entry.origin,
                value: entry.value,
                recordCount: 0,
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
            subcategories: mediaItem?.subcategories || [],
            genres: mediaItem?.genres || [],
            watchStatus: watchRecord.watch_status,
            productionStatus: mediaItem?.productionStatus || null,
            platform: normalizeOptionalText(watchRecord.platform),
            startedAt: normalizeOptionalText(watchRecord.started_at),
            finishedAt: normalizeOptionalText(watchRecord.finished_at),
            rewatch: watchRecord.rewatch === true,
            rating: normalizeOptionalNumber(watchRecord.rating),
            favorite: watchRecord.favorite === true,
            notes: normalizeOptionalText(watchRecord.notes),
            unit: watchRecord.unit,
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
        mediaItem.recordCount = mediaItem.watchRecords.length;
    }

    const linkedWatchRecords = normalizedWatchRecords.filter(
        (record) => record.relationshipStatus === "linked"
    );
    const orphanWatchRecords = normalizedWatchRecords.filter(
        (record) => record.relationshipStatus === "orphan"
    );
    const yearGroups = buildYearGroups(normalizedWatchRecords);
    const categoryGroups = buildCategoryGroups(normalizedMediaItems);

    return {
        mediaItems: normalizedMediaItems,
        watchRecords: normalizedWatchRecords,
        yearGroups,
        categoryGroups,
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

function summarizeMediaItem(mediaItem) {
    return {
        id: mediaItem.id,
        title: mediaItem.title,
        originalTitle: mediaItem.originalTitle,
        category: mediaItem.category,
        subcategories: mediaItem.subcategories,
        genres: mediaItem.genres,
        countries: mediaItem.countries,
        studios: mediaItem.studios,
        directors: mediaItem.directors,
        format: mediaItem.format,
        status: mediaItem.productionStatus,
        firstReleaseYear: mediaItem.firstReleaseYear,
        externalIds: mediaItem.externalIds,
        poster: mediaItem.poster,
        notes: mediaItem.notes,
        origin: mediaItem.origin
    };
}

function normalizeOptionalText(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalYear(value) {
    return Number.isInteger(value) ? value : null;
}

function normalizeOptionalNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim());
}

function normalizeExternalIds(value) {
    const externalIds = {
        imdb: null,
        tmdb: null,
        anilist: null,
        myanimelist: null
    };

    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return externalIds;
    }

    for (const key of Object.keys(externalIds)) {
        const rawValue = value[key];

        externalIds[key] =
            typeof rawValue === "string" && rawValue.trim()
                ? rawValue.trim()
                : typeof rawValue === "number" && Number.isFinite(rawValue)
                  ? rawValue
                  : null;
    }

    return externalIds;
}
