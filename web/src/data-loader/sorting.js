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

export function sortTimelineWatchRecords(left, right) {
    return (
        sortYearsAscending(left.year, right.year) ||
        compareOptionalDate(left.startedAt, right.startedAt) ||
        compareOptionalDate(left.finishedAt, right.finishedAt) ||
        getUnitSortKey(left).localeCompare(getUnitSortKey(right)) ||
        getStableRecordKey(left).localeCompare(getStableRecordKey(right))
    );
}

function compareOptionalDate(left, right) {
    const leftDate = typeof left === "string" && left ? left : "9999-12-31";
    const rightDate = typeof right === "string" && right ? right : "9999-12-31";

    return leftDate.localeCompare(rightDate);
}

function getUnitSortKey(record) {
    const unit = record?.unit || record?.value?.unit || {};
    const type = typeof unit.type === "string" ? unit.type : "unspecified";
    const typeRank = {
        season: 10,
        limited_season: 20,
        episode: 30,
        arc: 40,
        movie: 50,
        special: 60,
        full_work: 70,
        unspecified: 80
    };

    return [
        String(typeRank[type] || 99).padStart(2, "0"),
        type,
        padSortNumber(unit.season_number),
        padSortNumber(unit.episode_number),
        typeof unit.arc_name === "string" ? unit.arc_name : "",
        record?.unitLabel || ""
    ].join("|");
}

function getStableRecordKey(record) {
    return String(record?.id || record?.origin?.path || "");
}

function padSortNumber(value) {
    return String(Number.isInteger(value) ? value : 0).padStart(6, "0");
}
