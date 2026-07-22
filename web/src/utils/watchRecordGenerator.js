import { createWatchRecordFileDescriptor, createWatchRecordId } from "./jsonGeneration";
import { isSlug, slugify } from "./slugify";
export const WATCH_UNIT_OPTIONS = [
    { value: "season", label: "Temporada" },
    { value: "limited_season", label: "Temporada limitada" },
    { value: "episode", label: "Episodio" },
    { value: "arc", label: "Arco" },
    { value: "movie", label: "Filme" },
    { value: "special", label: "Especial" },
    { value: "full_work", label: "Obra completa" },
    { value: "unspecified", label: "Indefinido" }
];
export const WATCH_STATUS_OPTIONS = [
    { value: "planned", label: "Planejado" },
    { value: "watching", label: "Assistindo" },
    { value: "completed", label: "Concluido" },
    { value: "paused", label: "Pausado" },
    { value: "dropped", label: "Dropado" },
    { value: "rewatching", label: "Reassistindo" },
    { value: "abandoned", label: "Abandonado" }
];
const UNIT_VALUES = WATCH_UNIT_OPTIONS.map((option) => option.value);
const WATCH_STATUS_VALUES = WATCH_STATUS_OPTIONS.map((option) => option.value);
const MEDIA_ID_MODE_VALUES = ["existing", "manual"];
export function createInitialWatchRecordFormState() {
    return {
        mediaIdMode: "existing",
        selectedMediaId: "",
        manualMediaId: "",
        year: String(new Date().getFullYear()),
        unitType: "season",
        seasonNumber: "",
        episodeSeasonNumber: "",
        episodeNumber: "",
        arcName: "",
        watchStatus: "completed",
        startedAt: "",
        finishedAt: "",
        platform: "",
        rewatch: false,
        rating: "",
        favorite: false,
        notes: ""
    };
}
export function buildWatchRecordGeneratorOutput(form) {
    const errors = {};
    const mediaId = parseMediaId(form, errors);
    const year = parseRequiredYear(form.year, errors);
    const unit = parseUnit(form, errors);
    const watchStatus = parseWatchStatus(form.watchStatus, errors);
    const startedAt = parseOptionalDate(form.startedAt, "startedAt", errors);
    const finishedAt = parseOptionalDate(form.finishedAt, "finishedAt", errors);
    const rating = parseOptionalRating(form.rating, errors);
    if (startedAt && finishedAt && finishedAt < startedAt) {
        errors.finishedAt = "A data final nao pode ser anterior a data inicial.";
    }
    const fileInput = mediaId && year !== null && unit
        ? {
            mediaId,
            year,
            unit,
            rewatch: form.rewatch
        }
        : null;
    const id = fileInput ? createWatchRecordId(fileInput) : "";
    if (hasErrors(errors) || !fileInput || !watchStatus) {
        return {
            ok: false,
            file: null,
            id,
            value: null,
            errors
        };
    }
    const value = {
        id,
        media_id: mediaId,
        year,
        unit,
        watch_status: watchStatus,
        started_at: startedAt,
        finished_at: finishedAt,
        platform: optionalString(form.platform),
        rewatch: form.rewatch,
        rating,
        favorite: form.favorite,
        notes: optionalString(form.notes)
    };
    return {
        ok: true,
        file: createWatchRecordFileDescriptor(fileInput),
        id,
        value,
        errors
    };
}
function parseMediaId(form, errors) {
    const mode = parseMediaIdMode(form, errors);
    const fallbackField = hasOwn(form, "manualMediaId") ? "manualMediaId" : "mediaId";
    const field = mode === "existing" ? "selectedMediaId" : fallbackField;
    const rawInput = mode === "existing" ? form.selectedMediaId : form[fallbackField];
    const value = normalizeInput(rawInput);

    if (!value) {
        errors[field] =
            mode === "existing"
                ? "Selecione uma midia existente ou use o modo manual."
                : "Informe o media_id manual.";
        return null;
    }
    if (!isSlug(value)) {
        errors[field] = "Use um slug kebab-case, como spy-family.";
        return null;
    }
    return value;
}
function parseMediaIdMode(form, errors) {
    if (!hasOwn(form, "mediaIdMode")) {
        return "manual";
    }
    const input = form.mediaIdMode;

    if (!input) {
        return "existing";
    }
    if (!isKnownValue(input, MEDIA_ID_MODE_VALUES)) {
        errors.mediaIdMode = "Selecione uma origem valida para o media_id.";
        return "existing";
    }
    return input;
}
function parseRequiredYear(input, errors) {
    const value = normalizeInput(input);
    if (!value) {
        errors.year = "Informe o ano.";
        return null;
    }
    if (!/^[0-9]+$/.test(value)) {
        errors.year = "Use um ano numerico.";
        return null;
    }
    const year = Number(value);
    if (!Number.isInteger(year) || year < 1878 || year > 9999) {
        errors.year = "Use um ano entre 1878 e 9999.";
        return null;
    }
    return year;
}
function parseUnit(form, errors) {
    if (!isKnownValue(form.unitType, UNIT_VALUES)) {
        errors.unitType = "Selecione um tipo de unidade valido.";
        return null;
    }
    switch (form.unitType) {
        case "season": {
            const seasonNumber = parseRequiredPositiveInteger(form.seasonNumber, "seasonNumber", "Informe uma temporada maior que zero.", errors);
            return seasonNumber === null
                ? null
                : {
                    type: "season",
                    season_number: seasonNumber
                };
        }
        case "limited_season":
            return {
                type: "limited_season"
            };
        case "episode": {
            const episodeNumber = parseRequiredPositiveInteger(form.episodeNumber, "episodeNumber", "Informe um episodio maior que zero.", errors);
            const seasonNumber = parseOptionalPositiveInteger(form.episodeSeasonNumber, "episodeSeasonNumber", "Use uma temporada maior que zero.", errors);
            if (episodeNumber === null || errors.episodeSeasonNumber) {
                return null;
            }
            return seasonNumber === null
                ? {
                    type: "episode",
                    episode_number: episodeNumber
                }
                : {
                    type: "episode",
                    season_number: seasonNumber,
                    episode_number: episodeNumber
                };
        }
        case "arc": {
            const arcName = form.arcName.trim();
            if (!arcName) {
                errors.arcName = "Informe o nome do arco.";
                return null;
            }
            if (!slugify(arcName)) {
                errors.arcName = "Use um nome de arco com letras ou numeros.";
                return null;
            }
            return {
                type: "arc",
                arc_name: arcName
            };
        }
        case "movie":
            return {
                type: "movie"
            };
        case "special":
            return {
                type: "special"
            };
        case "full_work":
            return {
                type: "full_work"
            };
        case "unspecified":
            return {
                type: "unspecified"
            };
        default:
            return null;
    }
}
function parseWatchStatus(input, errors) {
    if (!isKnownValue(input, WATCH_STATUS_VALUES)) {
        errors.watchStatus = "Selecione um status valido.";
        return null;
    }
    return input;
}
function parseRequiredPositiveInteger(input, field, message, errors) {
    const value = normalizeInput(input);
    if (!value || !/^[0-9]+$/.test(value)) {
        errors[field] = message;
        return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        errors[field] = message;
        return null;
    }
    return parsed;
}
function parseOptionalPositiveInteger(input, field, message, errors) {
    const value = normalizeInput(input);
    if (!value) {
        return null;
    }
    if (!/^[0-9]+$/.test(value)) {
        errors[field] = message;
        return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        errors[field] = message;
        return null;
    }
    return parsed;
}
function parseOptionalDate(input, field, errors) {
    const value = normalizeInput(input);
    if (!value) {
        return null;
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
        errors[field] = "Use uma data no formato YYYY-MM-DD.";
        return null;
    }
    return value;
}
function parseOptionalRating(input, errors) {
    const value = normalizeInput(input);
    if (!value) {
        return null;
    }
    if (!/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
        errors.rating = "Use um numero maior ou igual a 0.";
        return null;
    }
    const rating = Number(value);
    if (!Number.isFinite(rating) || rating < 0) {
        errors.rating = "Use um numero maior ou igual a 0.";
        return null;
    }
    return rating;
}
function optionalString(input) {
    const value = normalizeInput(input);
    return value ? value : null;
}
function isKnownValue(value, values) {
    return values.includes(value);
}
function hasErrors(errors) {
    return Object.keys(errors).length > 0;
}
function normalizeInput(input) {
    return typeof input === "string" ? input.trim() : "";
}
function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
}
