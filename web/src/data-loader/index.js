import {
    collectEntries,
    dataModules,
    parseHistoryPath,
    parseMediaPath
} from "./discovery";
import { buildNormalizedLibrary } from "./normalization";
import { sortYearsDescending, uniqueSorted } from "./sorting";

export {
    DEFAULT_LIBRARY_SORT,
    EMPTY_LIBRARY_FILTERS,
    LIBRARY_SORT_DIRECTIONS,
    LIBRARY_SORT_FIELDS,
    applyLibraryFiltersAndSorting,
    buildLibraryFilterOptions,
    createEmptyLibraryFilters,
    getDefaultLibrarySortDirection,
    hasActiveLibraryFilters
} from "./filters";
export { buildCategoryGroups, buildYearGroups, groupRecordsByMediaId } from "./grouping";
export { buildNormalizedLibrary } from "./normalization";
export { sortTimelineWatchRecords } from "./sorting";
export { deriveUnitLabel } from "./unitLabels";

export const staticLibraryData = buildStaticLibraryData({
    mediaModules: dataModules.mediaModules,
    historyModules: dataModules.historyModules
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
