import { MediaItemGenerator } from "./components/MediaItemGenerator";
import { WatchRecordGenerator } from "./components/WatchRecordGenerator";
import { staticLibraryData } from "./data-loader";
import { CategoryLibraryPage } from "./pages/CategoryLibraryPage";
import { LibraryPage } from "./pages/LibraryPage";
import { MediaLibraryPage } from "./pages/MediaLibraryPage";
import { RouteNotFoundPage } from "./pages/RouteNotFoundPage";
import { YearLibraryPage } from "./pages/YearLibraryPage";

export const navItems = [
    { href: "/", label: "Biblioteca", note: "views" },
    { href: "/generate/media", label: "Midia", note: "media item" },
    { href: "/generate/watch-record", label: "Registro", note: "watch record" }
];

export const routeExamples = [
    { href: "/library/year/2026", label: "Ano", value: "2026" },
    { href: "/library/media/spy-family", label: "Midia", value: "spy-family" },
    { href: "/library/category/anime", label: "Categoria", value: "anime" }
];

export function readRoutePathFromLocation(location) {
    const hash = String(location.hash || "");
    if (hash.startsWith("#/")) {
        return normalizeRoutePath(hash.slice(1));
    }
    if (hash && hash !== "#") {
        return null;
    }
    return getRoutePathFromPathname(location.pathname);
}

export function toAppHref(pathname) {
    return `#${normalizeRoutePath(pathname)}`;
}

export function resolveRoute(pathname) {
    if (pathname === "/" || pathname === "/library") {
        return {
            eyebrow: "Biblioteca",
            title: "Historico audiovisual",
            description: "Uma bancada para transformar obras assistidas em registros claros, portateis e versionados.",
            content: <LibraryPage data={staticLibraryData}/>
        };
    }
    if (pathname === "/generate/media") {
        return {
            eyebrow: "Media Item",
            title: "Nova midia",
            description: "Defina a obra uma vez para que varios eventos de consumo possam referencia-la depois.",
            content: <MediaItemGenerator />
        };
    }
    if (pathname === "/generate/watch-record") {
        return {
            eyebrow: "Watch Record",
            title: "Novo registro",
            description: "Registre o consumo de uma temporada, filme, especial, arco ou obra completa.",
            content: <WatchRecordGenerator mediaItems={staticLibraryData.normalized.mediaItems}/>
        };
    }
    const yearMatch = /^\/library\/year\/([^/]+)$/.exec(pathname);
    if (yearMatch) {
        const year = decodeRouteValue(yearMatch[1]);
        return {
            eyebrow: "Ano",
            title: `Ano ${year}`,
            description: "Um recorte da biblioteca com somente os registros encontrados para este ano.",
            content: <YearLibraryPage data={staticLibraryData} year={year}/>
        };
    }
    const mediaMatch = /^\/library\/media\/([^/]+)$/.exec(pathname);
    if (mediaMatch) {
        const mediaId = decodeRouteValue(mediaMatch[1]);
        return {
            eyebrow: "Midia",
            title: "Historico da obra",
            description: "Uma gaveta para reunir a obra selecionada e todos os registros ligados a ela.",
            content: <MediaLibraryPage data={staticLibraryData} mediaId={mediaId}/>
        };
    }
    const categoryMatch = /^\/library\/category\/([^/]+)$/.exec(pathname);
    if (categoryMatch) {
        const category = decodeRouteValue(categoryMatch[1]);
        return {
            eyebrow: "Categoria",
            title: "Categoria",
            description: "Uma gaveta para navegar as obras de uma categoria e seus registros ligados.",
            content: <CategoryLibraryPage category={category} data={staticLibraryData}/>
        };
    }
    return {
        eyebrow: "404",
        title: "Pagina indisponivel",
        description: "Essa rota nao esta no mapa da aplicacao. A biblioteca completa continua disponivel.",
        content: <RouteNotFoundPage />
    };
}

export function isActive(pathname, href) {
    if (href === "/") {
        return pathname === "/" || pathname.startsWith("/library");
    }
    return pathname === href;
}

function getRoutePathFromPathname(pathname) {
    const base = normalizeBasePath(import.meta.env.BASE_URL);
    const baseWithoutTrailingSlash = base === "/" ? "" : base.replace(/\/$/, "");
    const normalizedPathname = normalizeRoutePath(pathname);

    if (baseWithoutTrailingSlash && normalizedPathname === baseWithoutTrailingSlash) {
        return "/";
    }
    if (baseWithoutTrailingSlash && normalizedPathname.startsWith(`${baseWithoutTrailingSlash}/`)) {
        return normalizeRoutePath(normalizedPathname.slice(baseWithoutTrailingSlash.length));
    }

    return normalizedPathname;
}

function normalizeBasePath(value) {
    const base = String(value || "/");
    if (!base.startsWith("/")) {
        return `/${base}`;
    }
    return base;
}

function normalizeRoutePath(value) {
    const [routePart] = String(value || "/").split(/[?#]/);
    const route = routePart.startsWith("/") ? routePart : `/${routePart}`;
    const normalized = route.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
    return normalized || "/";
}

function decodeRouteValue(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}
