export function formatOptionLabel(value) {
    return formatMetricLabel(value);
}

export function formatMetricLabel(value) {
    return String(value).replace(/[_-]/g, " ");
}

export function formatArrayLabel(values, emptyLabel, formatter = formatMetricLabel) {
    if (!Array.isArray(values) || values.length === 0) {
        return emptyLabel;
    }

    return values.map((value) => formatter(value)).join(", ");
}

export function formatBooleanLabel(value) {
    return value ? "sim" : "nao";
}

export function formatDateLabel(value) {
    return value || "nao informada";
}

export function formatNumberLabel(value, emptyLabel = "nao informado") {
    return typeof value === "number" && Number.isFinite(value) ? value : emptyLabel;
}

export function formatTextLabel(value, emptyLabel = "nao informado") {
    return typeof value === "string" && value.trim() ? value.trim() : emptyLabel;
}
