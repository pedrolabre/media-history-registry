import { createMediaItemFileDescriptor } from "./jsonGeneration";
import { slugify } from "./slugify";
export const MEDIA_CATEGORY_OPTIONS = [
    { value: "movie", label: "Filme" },
    { value: "series", label: "Serie" },
    { value: "anime", label: "Anime" },
    { value: "documentary", label: "Documentario" },
    { value: "docuseries", label: "Docuserie" },
    { value: "special", label: "Especial" },
    { value: "short", label: "Curta" },
    { value: "other", label: "Outro" }
];
export const MEDIA_FORMAT_OPTIONS = [
    { value: "series", label: "Serie" },
    { value: "movie", label: "Filme" },
    { value: "short", label: "Curta" },
    { value: "special", label: "Especial" }
];
export const MEDIA_STATUS_OPTIONS = [
    { value: "ongoing", label: "Em andamento" },
    { value: "ended", label: "Encerrada" },
    { value: "cancelled", label: "Cancelada" },
    { value: "hiatus", label: "Hiato" },
    { value: "unknown", label: "Desconhecido" }
];
const CATEGORY_VALUES = MEDIA_CATEGORY_OPTIONS.map((option) => option.value);
const FORMAT_VALUES = MEDIA_FORMAT_OPTIONS.map((option) => option.value);
const STATUS_VALUES = MEDIA_STATUS_OPTIONS.map((option) => option.value);
export const initialMediaItemFormState = {
    title: "",
    originalTitle: "",
    category: "",
    subcategories: "",
    format: "",
    status: "",
    genres: "",
    countries: "",
    studios: "",
    directors: "",
    firstReleaseYear: "",
    externalIds: {
        imdb: "",
        tmdb: "",
        anilist: "",
        myanimelist: ""
    },
    poster: "",
    notes: ""
};
export function buildMediaItemGeneratorOutput(form) {
    const errors = {};
    const title = form.title.trim();
    const id = deriveMediaItemId(form.title);
    if (!title) {
        errors.title = "Informe o titulo da obra.";
    }
    else if (!id) {
        errors.title = "O titulo precisa gerar um slug com letras ou numeros.";
    }
    if (!isKnownValue(form.category, CATEGORY_VALUES)) {
        errors.category = "Selecione uma categoria valida.";
    }
    if (!isKnownValue(form.format, FORMAT_VALUES)) {
        errors.format = "Selecione um formato valido.";
    }
    if (!isKnownValue(form.status, STATUS_VALUES)) {
        errors.status = "Selecione um status valido.";
    }
    const subcategories = parseSlugList(form.subcategories, "subcategories", errors);
    const genres = parseSlugList(form.genres, "genres", errors);
    const countries = parseCountryList(form.countries, errors);
    const studios = parseTextList(form.studios);
    const directors = parseTextList(form.directors);
    const firstReleaseYear = parseOptionalYear(form.firstReleaseYear, errors);
    const externalIds = parseExternalIds(form.externalIds, errors);
    const poster = optionalString(form.poster);
    if (hasErrors(errors)) {
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
        title,
        original_title: optionalString(form.originalTitle),
        category: form.category,
        subcategories,
        format: form.format,
        status: form.status,
        genres,
        countries,
        studios,
        directors,
        first_release_year: firstReleaseYear,
        external_ids: externalIds,
        poster,
        notes: optionalString(form.notes)
    };
    return {
        ok: true,
        file: createMediaItemFileDescriptor({
            category: form.category,
            id
        }),
        id,
        value,
        errors
    };
}
export function deriveMediaItemId(title) {
    return slugify(title.trim());
}
function parseSlugList(input, field, errors) {
    const items = splitCommaList(input);
    const values = [];
    for (const item of items) {
        const value = slugify(item);
        if (!value) {
            errors[field] = "Use itens com letras ou numeros separados por virgula.";
            continue;
        }
        values.push(value);
    }
    return unique(values);
}
function parseCountryList(input, errors) {
    const values = splitCommaList(input).map((item) => item.toUpperCase());
    const invalid = values.find((item) => !/^[A-Z]{2}$/.test(item));
    if (invalid) {
        errors.countries = "Use codigos de pais com duas letras, como JP ou US.";
    }
    return unique(values);
}
function parseTextList(input) {
    return unique(splitCommaList(input));
}
function parseOptionalYear(input, errors) {
    const value = input.trim();
    if (!value) {
        return null;
    }
    if (!/^[0-9]+$/.test(value)) {
        errors.firstReleaseYear = "Use um ano numerico.";
        return null;
    }
    const year = Number(value);
    if (!Number.isInteger(year) || year < 1878 || year > 9999) {
        errors.firstReleaseYear = "Use um ano entre 1878 e 9999.";
        return null;
    }
    return year;
}
function parseExternalIds(externalIds, errors) {
    return {
        imdb: parseOptionalImdbId(externalIds.imdb, errors),
        tmdb: parseOptionalPositiveInteger(externalIds.tmdb, "externalIds.tmdb", "TMDB precisa ser um inteiro positivo.", errors),
        anilist: parseOptionalPositiveInteger(externalIds.anilist, "externalIds.anilist", "AniList precisa ser um inteiro positivo.", errors),
        myanimelist: parseOptionalPositiveInteger(externalIds.myanimelist, "externalIds.myanimelist", "MyAnimeList precisa ser um inteiro positivo.", errors)
    };
}
function parseOptionalImdbId(input, errors) {
    const value = input.trim();
    if (!value) {
        return null;
    }
    if (!/^tt[0-9]{7,10}$/.test(value)) {
        errors["externalIds.imdb"] = "IMDB precisa seguir o formato tt1234567.";
        return null;
    }
    return value;
}
function parseOptionalPositiveInteger(input, field, message, errors) {
    const value = input.trim();
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
function optionalString(input) {
    const value = input.trim();
    return value ? value : null;
}
function splitCommaList(input) {
    return input
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
function unique(values) {
    return Array.from(new Set(values));
}
function isKnownValue(value, values) {
    return values.includes(value);
}
function hasErrors(errors) {
    return Object.keys(errors).length > 0;
}
