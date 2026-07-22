export function uniqueSorted(values, sorter = sortTextAscending) {
    return Array.from(new Set(values)).sort(sorter);
}

export function sortTextAscending(left, right) {
    return String(left).localeCompare(String(right));
}

export function sortYearsAscending(left, right) {
    return left - right;
}

export function sortYearsDescending(left, right) {
    return right - left;
}

export function sortNormalizedMediaItems(left, right) {
    return (
        String(left.title).localeCompare(String(right.title)) ||
        String(left.id).localeCompare(String(right.id))
    );
}

export function sortNormalizedWatchRecords(left, right) {
    return (
        sortYearsDescending(left.year, right.year) ||
        String(left.title).localeCompare(String(right.title)) ||
        String(left.unitLabel).localeCompare(String(right.unitLabel)) ||
        String(left.id).localeCompare(String(right.id))
    );
}
