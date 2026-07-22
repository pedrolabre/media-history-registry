export function formatOptionLabel(value) {
    return formatMetricLabel(value);
}

export function formatMetricLabel(value) {
    return String(value).replace(/[_-]/g, " ");
}
