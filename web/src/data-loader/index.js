const mediaModules = import.meta.glob("../../../data/media/**/*.json", {
    eager: true,
    import: "default"
});

const historyModules = import.meta.glob("../../../data/history/**/*.json", {
    eager: true,
    import: "default"
});

export const staticLibraryData = buildStaticLibraryData({
    mediaModules,
    historyModules
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
        errors
    };
}

function collectEntries({ modules, parsePath, type, errors }) {
    return Object.entries(modules)
        .map(([modulePath, value]) => {
            const origin = parsePath(modulePath, errors);

            if (!origin) {
                return null;
            }

            return {
                type,
                origin,
                value
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.origin.path.localeCompare(right.origin.path));
}

function parseMediaPath(modulePath, errors) {
    const path = toRepositoryDataPath(modulePath);
    const match = /^data\/media\/([^/]+)\/([^/]+\.json)$/.exec(path);

    if (!match) {
        errors.push({
            path,
            message: "Media Item deve estar em data/media/{category}/{filename}.json."
        });
        return null;
    }

    const [, category, filename] = match;

    return {
        path,
        category,
        filename,
        fileId: removeJsonExtension(filename)
    };
}

function parseHistoryPath(modulePath, errors) {
    const path = toRepositoryDataPath(modulePath);
    const match = /^data\/history\/([^/]+)\/([^/]+\.json)$/.exec(path);

    if (!match) {
        errors.push({
            path,
            message: "Watch Record deve estar em data/history/{year}/{filename}.json."
        });
        return null;
    }

    const [, yearText, filename] = match;

    if (!/^[0-9]{4}$/.test(yearText)) {
        errors.push({
            path,
            message: "O ano do path de Watch Record deve ter quatro digitos."
        });
        return null;
    }

    return {
        path,
        year: Number(yearText),
        filename,
        fileId: removeJsonExtension(filename)
    };
}

function toRepositoryDataPath(modulePath) {
    const normalizedPath = modulePath.replace(/\\/g, "/");
    const dataPathStart = normalizedPath.indexOf("data/");

    return dataPathStart >= 0 ? normalizedPath.slice(dataPathStart) : normalizedPath;
}

function removeJsonExtension(filename) {
    return filename.replace(/\.json$/, "");
}

function uniqueSorted(values, sorter = sortTextAscending) {
    return Array.from(new Set(values)).sort(sorter);
}

function sortTextAscending(left, right) {
    return String(left).localeCompare(String(right));
}

function sortYearsDescending(left, right) {
    return right - left;
}
