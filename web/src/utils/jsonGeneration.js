import { isSlug, slugify } from "./slugify";
export const JSON_MIME_TYPE = "application/json;charset=utf-8";
export function isJsonObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function formatJson(value) {
    if (!isJsonObject(value)) {
        throw new TypeError("JSON preview expects a plain object.");
    }
    return `${JSON.stringify(value, null, 2)}\n`;
}
export function buildJsonOutput(value, file) {
    try {
        const json = formatJson(value);
        const sizeInBytes = getUtf8SizeInBytes(json);
        return {
            ok: true,
            output: {
                ...file,
                json,
                mimeType: JSON_MIME_TYPE,
                sizeInBytes,
                sizeLabel: formatByteSize(sizeInBytes)
            }
        };
    }
    catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "JSON preview could not be generated."
        };
    }
}
export function createJsonFileName(stem) {
    assertSlug(stem, "File stem");
    return `${stem}.json`;
}
export function createMediaItemFileDescriptor(input) {
    assertSlug(input.category, "Media item category");
    assertSlug(input.id, "Media item id");
    return {
        fileName: createJsonFileName(input.id),
        repositoryPath: `data/media/${input.category}/${input.id}.json`
    };
}
export function createWatchRecordFileDescriptor(input) {
    const stem = createWatchRecordFileStem(input);
    return {
        fileName: createJsonFileName(stem),
        repositoryPath: `data/history/${formatYear(input.year)}/${stem}.json`
    };
}
export function createWatchRecordId(input) {
    return `${formatYear(input.year)}-${createWatchRecordFileStem(input)}`;
}
export function createWatchRecordFileStem(input) {
    assertSlug(input.mediaId, "Media id");
    let stem;
    switch (input.unit.type) {
        case "season":
            stem = `${input.mediaId}-s${formatOrdinal(input.unit.season_number)}`;
            break;
        case "episode":
            stem =
                typeof input.unit.season_number === "number"
                    ? `${input.mediaId}-s${formatOrdinal(input.unit.season_number)}e${formatOrdinal(input.unit.episode_number)}`
                    : `${input.mediaId}-e${formatOrdinal(input.unit.episode_number)}`;
            break;
        case "arc":
            stem = `${input.mediaId}-${slugify(input.unit.arc_name)}`;
            break;
        case "special":
            stem = `${input.mediaId}-sp`;
            break;
        case "limited_season":
        case "movie":
        case "full_work":
        case "unspecified":
            stem = input.mediaId;
            break;
        default:
            stem = assertNever(input.unit);
    }
    const finalStem = input.rewatch ? `${stem}-rewatch` : stem;
    assertSlug(finalStem, "Watch record stem");
    return finalStem;
}
export async function copyTextToClipboard(text) {
    if (!navigator.clipboard?.writeText) {
        return {
            ok: false,
            reason: "unavailable",
            message: "Clipboard indisponivel neste navegador."
        };
    }
    try {
        await navigator.clipboard.writeText(text);
        return { ok: true };
    }
    catch {
        return {
            ok: false,
            reason: "failed",
            message: "Nao foi possivel copiar agora."
        };
    }
}
export function downloadJsonFile(output) {
    const blob = new Blob([output.json], { type: output.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = output.fileName;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
function assertSlug(value, label) {
    if (!isSlug(value)) {
        throw new Error(`${label} must be a kebab-case slug.`);
    }
}
function formatOrdinal(value) {
    if (!Number.isInteger(value) || value < 1) {
        throw new Error("Unit numbers must be positive integers.");
    }
    return String(value).padStart(2, "0");
}
function formatYear(value) {
    if (!Number.isInteger(value) || value < 1878 || value > 9999) {
        throw new Error("Year must be an integer between 1878 and 9999.");
    }
    return String(value);
}
function getUtf8SizeInBytes(text) {
    return new TextEncoder().encode(text).length;
}
function formatByteSize(sizeInBytes) {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
    }
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
}
function assertNever(value) {
    throw new Error(`Unsupported watch unit: ${String(value)}`);
}
