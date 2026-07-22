import { useMemo, useState } from "react";
import {
    DEFAULT_LIBRARY_SORT,
    applyLibraryFiltersAndSorting,
    createEmptyLibraryFilters,
    getDefaultLibrarySortDirection
} from "../../data-loader";

export function useLibraryExplorer(records) {
    const [filters, setFilters] = useState(() => createEmptyLibraryFilters());
    const [sort, setSort] = useState(() => ({ ...DEFAULT_LIBRARY_SORT }));
    const result = useMemo(() => applyLibraryFiltersAndSorting(records, filters, sort), [records, filters, sort]);

    function updateFilter(key, value) {
        setFilters((currentFilters) => ({
            ...currentFilters,
            [key]: value
        }));
    }

    function updateSortField(field) {
        setSort({
            field,
            direction: getDefaultLibrarySortDirection(field)
        });
    }

    function updateSortDirection(direction) {
        setSort((currentSort) => ({
            ...currentSort,
            direction
        }));
    }

    function clearFilters() {
        setFilters(createEmptyLibraryFilters());
    }

    return {
        ...result,
        updateFilter,
        updateSortField,
        updateSortDirection,
        clearFilters
    };
}
