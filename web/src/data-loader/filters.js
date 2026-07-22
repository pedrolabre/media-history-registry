import { normalizeMetricKey } from "./metrics";
import {
    sortNormalizedWatchRecords,
    sortTextAscending,
    sortYearsAscending,
    sortYearsDescending
} from "./sorting";

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
