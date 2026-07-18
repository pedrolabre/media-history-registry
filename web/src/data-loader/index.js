const mediaModules = import.meta.glob("../../../data/media/**/*.json", {
    eager: true,
    import: "default"
});

const historyModules = import.meta.glob("../../../data/history/**/*.json", {
    eager: true,
    import: "default"
});

export const EMPTY_LIBRARY_FILTERS = {
    category: "",
    subcategory: "",
    genre: "",
    watchStatus: "",
    productionStatus: "",
    platform: "",
    year: ""
};

export const DEFAULT_LIBRARY_SORT = {
    field: "year",
    direction: "desc"
};

export const LIBRARY_SORT_FIELDS = [
    { value: "year", label: "Ano" },
    { value: "title", label: "Titulo" },
    { value: "watchStatus", label: "Status pessoal" }
];

export const LIBRARY_SORT_DIRECTIONS = [
    { value: "asc", label: "Crescente" },
    { value: "desc", label: "Decrescente" }
];

const LIBRARY_FILTER_KEYS = Object.keys(EMPTY_LIBRARY_FILTERS);
const WATCH_STATUS_SORT_ORDER = [
    "completed",
    "watching",
    "rewatching",
    "paused",
    "planned",
    "dropped",
    "abandoned",
    "unknown"
];

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
                originalTitle: normalizeOptionalText(entry.value.original_title),
                category: entry.value.category,
                subcategories: normalizeStringArray(entry.value.subcategories),
                genres: normalizeStringArray(entry.value.genres),
                format: entry.value.format,
                productionStatus: entry.value.status,
                firstReleaseYear: normalizeOptionalYear(entry.value.first_release_year),
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

export function createEmptyLibraryFilters() {
    return { ...EMPTY_LIBRARY_FILTERS };
}

export function getDefaultLibrarySortDirection(field) {
    if (field === "title" || field === "watchStatus") {
        return "asc";
    }

    return "desc";
}

export function hasActiveLibraryFilters(filters) {
    return LIBRARY_FILTER_KEYS.some((key) => normalizeFilterValue(filters?.[key]) !== "");
}

export function applyLibraryFiltersAndSorting(records, filters, sort = DEFAULT_LIBRARY_SORT) {
    const safeRecords = Array.isArray(records) ? records : [];
    const normalizedFilters = normalizeLibraryFilters(filters);
    const normalizedSort = normalizeLibrarySort(sort);
    const filteredRecords = safeRecords.filter((record) =>
        matchesLibraryFilters(record, normalizedFilters)
    );

    return {
        records: [...filteredRecords].sort((left, right) =>
            sortLibraryRecords(left, right, normalizedSort)
        ),
        filterOptions: buildLibraryFilterOptions(safeRecords),
        filters: normalizedFilters,
        sort: normalizedSort,
        totalCount: safeRecords.length,
        filteredCount: filteredRecords.length,
        hasActiveFilters: hasActiveLibraryFilters(normalizedFilters)
    };
}

export function buildLibraryFilterOptions(records) {
    const safeRecords = Array.isArray(records) ? records : [];

    return {
        categories: buildFilterOptions(safeRecords, (record) => record.category),
        subcategories: buildFilterOptions(safeRecords, (record) => record.subcategories),
        genres: buildFilterOptions(safeRecords, (record) => record.genres),
        watchStatuses: buildFilterOptions(safeRecords, (record) => record.watchStatus),
        productionStatuses: buildFilterOptions(safeRecords, (record) => record.productionStatus),
        platforms: buildFilterOptions(safeRecords, (record) => record.platform),
        years: buildFilterOptions(safeRecords, (record) => record.year, sortYearsDescending)
    };
}

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

function normalizeLibraryFilters(filters) {
    return LIBRARY_FILTER_KEYS.reduce((normalized, key) => {
        normalized[key] = normalizeFilterValue(filters?.[key]);
        return normalized;
    }, {});
}

function normalizeLibrarySort(sort) {
    const field = LIBRARY_SORT_FIELDS.some((option) => option.value === sort?.field)
        ? sort.field
        : DEFAULT_LIBRARY_SORT.field;
    const direction = sort?.direction === "asc" || sort?.direction === "desc" ? sort.direction : "";

    return {
        field,
        direction: direction || getDefaultLibrarySortDirection(field)
    };
}

function matchesLibraryFilters(record, filters) {
    return (
        matchesScalarFilter(record.category, filters.category) &&
        matchesArrayFilter(record.subcategories, filters.subcategory) &&
        matchesArrayFilter(record.genres, filters.genre) &&
        matchesScalarFilter(record.watchStatus, filters.watchStatus) &&
        matchesScalarFilter(record.productionStatus, filters.productionStatus) &&
        matchesScalarFilter(record.platform, filters.platform) &&
        matchesScalarFilter(record.year, filters.year)
    );
}

function matchesScalarFilter(value, filterValue) {
    return filterValue === "" || normalizeFilterValue(value) === filterValue;
}

function matchesArrayFilter(values, filterValue) {
    return (
        filterValue === "" ||
        (Array.isArray(values) && values.some((value) => normalizeFilterValue(value) === filterValue))
    );
}

function sortLibraryRecords(left, right, sort) {
    const directionMultiplier = sort.direction === "desc" ? -1 : 1;
    let result = 0;

    if (sort.field === "title") {
        result = String(left.title).localeCompare(String(right.title));
    } else if (sort.field === "watchStatus") {
        result = compareWatchStatus(left.watchStatus, right.watchStatus);
    } else {
        result = sortYearsAscending(left.year, right.year);
    }

    return result * directionMultiplier || sortNormalizedWatchRecords(left, right);
}

function compareWatchStatus(left, right) {
    return getWatchStatusRank(left) - getWatchStatusRank(right);
}

function getWatchStatusRank(value) {
    const index = WATCH_STATUS_SORT_ORDER.indexOf(normalizeMetricKey(value));
    return index >= 0 ? index : WATCH_STATUS_SORT_ORDER.length;
}

function buildFilterOptions(records, getValue, sorter = sortTextAscending) {
    const counts = new Map();

    for (const record of records) {
        const rawValue = getValue(record);
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];

        for (const value of values) {
            const optionValue = normalizeFilterValue(value);

            if (optionValue !== "") {
                counts.set(optionValue, (counts.get(optionValue) || 0) + 1);
            }
        }
    }

    return Array.from(counts, ([value, count]) => ({ value, count })).sort((left, right) =>
        sorter(left.value, right.value)
    );
}

function normalizeFilterValue(value) {
    return value === null || value === undefined ? "" : String(value).trim();
}

function buildCategoryGroups(mediaItems) {
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
        originalTitle: mediaItem.originalTitle,
        category: mediaItem.category,
        subcategories: mediaItem.subcategories,
        genres: mediaItem.genres,
        format: mediaItem.format,
        status: mediaItem.productionStatus,
        firstReleaseYear: mediaItem.firstReleaseYear,
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

function normalizeOptionalText(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalYear(value) {
    return Number.isInteger(value) ? value : null;
}

function normalizeStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim());
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

function sortYearsAscending(left, right) {
    return left - right;
}

function sortYearsDescending(left, right) {
    return right - left;
}
